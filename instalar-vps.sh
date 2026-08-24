#!/usr/bin/env bash
#
# instalar-vps.sh — instala a Levva do zero numa VPS Ubuntu/Debian limpa.
#
# O que faz:
#   1. Instala Docker + Docker Compose (se ainda não tiver)
#   2. Pergunta o domínio, gera senha do banco e JWT_SECRET automaticamente
#   3. Sobe Postgres + app + Nginx via docker compose
#   4. Roda as migrações do Prisma e o seed de escolas
#   5. Emite certificado HTTPS gratuito (Let's Encrypt) via certbot
#
# Uso:
#   1. Copie a pasta do projeto (ou o zip extraído) pra VPS, ex.:
#        scp -r levva-app usuario@SEU_IP:~/levva-app
#   2. Entre na pasta e rode:
#        cd levva-app && chmod +x instalar-vps.sh && ./instalar-vps.sh
#
# Testado em Ubuntu 22.04/24.04. Precisa rodar como usuário com sudo.

set -euo pipefail

CINZA='\033[0;90m'; VERDE='\033[0;32m'; AMARELO='\033[1;33m'; RESET='\033[0m'
log()  { echo -e "${VERDE}==>${RESET} $1"; }
aviso(){ echo -e "${AMARELO}!!${RESET} $1"; }

if [ "$EUID" -eq 0 ]; then
  aviso "Rodando como root. Recomendado usar um usuário com sudo, mas seguindo assim mesmo."
fi

# ---------------------------------------------------------------------------
log "Verificando Docker..."
if ! command -v docker &> /dev/null; then
  log "Docker não encontrado — instalando (script oficial get.docker.com)..."
  curl -fsSL https://get.docker.com | sudo sh
  sudo usermod -aG docker "$USER"
  aviso "Docker instalado. Se der erro de permissão mais abaixo, rode 'newgrp docker' e execute o script de novo."
else
  log "Docker já está instalado."
fi

if ! docker compose version &> /dev/null; then
  aviso "Plugin 'docker compose' não encontrado. Instalando..."
  sudo apt-get update -y
  sudo apt-get install -y docker-compose-plugin
fi

# ---------------------------------------------------------------------------
log "Configurando variáveis de ambiente..."

if [ -f .env ]; then
  aviso ".env já existe — mantendo o que já está configurado (apague o arquivo se quiser recomeçar)."
else
  read -rp "Domínio que vai apontar pra essa VPS (ex.: app.levva.com.br) — deixe em branco pra configurar depois: " DOMINIO
  read -rp "Token da WhatsApp Cloud API (Enter pra pular e configurar depois): " WA_TOKEN
  read -rp "Phone ID da WhatsApp Cloud API (Enter pra pular): " WA_PHONE_ID

  SENHA_DB=$(openssl rand -hex 16)
  JWT_SECRET=$(openssl rand -base64 48 | tr -d '\n')

  cat > .env << EOF
DATABASE_URL="postgresql://levva:${SENHA_DB}@db:5432/levva"
POSTGRES_PASSWORD="${SENHA_DB}"
JWT_SECRET="${JWT_SECRET}"
WHATSAPP_API_TOKEN="${WA_TOKEN}"
WHATSAPP_PHONE_ID="${WA_PHONE_ID}"
NODE_ENV="production"
EOF

  log ".env criado com senha de banco e JWT_SECRET gerados automaticamente."

  if [ -n "$DOMINIO" ]; then
    sed -i "s/SEU_DOMINIO_AQUI/${DOMINIO}/g" nginx.conf
    log "nginx.conf atualizado com o domínio ${DOMINIO}."
  else
    aviso "Sem domínio informado — o app vai responder só por HTTP/IP por enquanto."
    aviso "Edite nginx.conf com o domínio depois e rode este script de novo pra ativar HTTPS."
  fi
fi

# ---------------------------------------------------------------------------
log "Subindo os containers (build pode levar alguns minutos na primeira vez)..."
sudo docker compose up -d --build

log "Aguardando o banco ficar pronto..."
sleep 8

log "Rodando migrações do Prisma (cria as tabelas)..."
sudo docker compose exec -T app npx prisma db push

log "Rodando seed de escolas..."
sudo docker compose exec -T app npx tsx prisma/seed.ts || aviso "Seed falhou — pode rodar manualmente depois com: docker compose exec app npx tsx prisma/seed.ts"

# ---------------------------------------------------------------------------
if grep -q "SEU_DOMINIO_AQUI" nginx.conf; then
  aviso "Pulei a emissão de HTTPS porque nenhum domínio foi configurado."
else
  DOMINIO_ATUAL=$(grep -oP 'server_name \K[^;]+' nginx.conf | head -1)
  read -rp "Emitir certificado HTTPS agora pra ${DOMINIO_ATUAL}? Confirme que o DNS já aponta pra esse IP (s/N): " EMITIR
  if [[ "$EMITIR" =~ ^[sS]$ ]]; then
    log "Emitindo certificado via Let's Encrypt..."
    sudo docker run --rm \
      -v "$(pwd)/certbot-www:/var/www/certbot" \
      -v levva-app_certbot_conf:/etc/letsencrypt \
      certbot/certbot certonly --webroot -w /var/www/certbot \
      -d "$DOMINIO_ATUAL" --non-interactive --agree-tos -m "admin@${DOMINIO_ATUAL}" || \
      aviso "Certbot falhou — confira se a porta 80 está acessível e o DNS já propagou, depois tente de novo."

    sed -i \
      -e 's/^# server {/server {/' \
      -e 's/^#     /    /' \
      -e 's/^# }/}/' \
      nginx.conf
    sudo docker compose restart nginx
    log "HTTPS ativado — acesse https://${DOMINIO_ATUAL}"
  fi
fi

echo ""
log "Pronto! A Levva está no ar."
echo -e "${CINZA}Comandos úteis:${RESET}"
echo "  docker compose logs -f app        # ver logs do app em tempo real"
echo "  docker compose exec app sh        # abrir shell dentro do container"
echo "  docker compose down               # parar tudo"
echo "  docker compose up -d --build      # rebuildar após mudanças no código"
