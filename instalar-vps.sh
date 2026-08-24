#!/usr/bin/env bash
#
# instalar-vps.sh — instala a Levva do zero numa VPS Ubuntu/Debian limpa.
#
# O que faz:
#   1. Instala Docker + Docker Compose (se ainda não tiver)
#   2. Pergunta domínio, e-mail/senha do admin, e SMTP; gera senha do banco
#      e JWT_SECRET automaticamente
#   3. Sobe Postgres + app + Nginx via docker compose
#   4. Roda as migrações do Prisma, o seed de escolas e cria o administrador
#   5. Emite certificado HTTPS gratuito (Let's Encrypt) e liga a renovação
#
# Uso:
#   git clone https://github.com/Esamwell/levva.git
#   cd levva && chmod +x instalar-vps.sh && ./instalar-vps.sh
#
# A pasta pode ter qualquer nome: o script descobre o nome do projeto Compose
# sozinho, em vez de assumir "levva-app" como antes.
#
# Testado em Ubuntu 22.04/24.04. Precisa rodar como usuário com sudo.

set -euo pipefail

CINZA='\033[0;90m'; VERDE='\033[0;32m'; AMARELO='\033[1;33m'; VERMELHO='\033[0;31m'; RESET='\033[0m'
log()  { echo -e "${VERDE}==>${RESET} $1"; }
aviso(){ echo -e "${AMARELO}!!${RESET} $1"; }
falha(){ echo -e "${VERMELHO}✗${RESET} $1"; exit 1; }

cd "$(dirname "$0")"

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

if ! sudo docker compose version &> /dev/null; then
  aviso "Plugin 'docker compose' não encontrado. Instalando..."
  sudo apt-get update -y
  sudo apt-get install -y docker-compose-plugin
fi

# Chamamos sempre por esta função pra garantir o mesmo nome de projeto em
# todos os comandos — é o nome do projeto que prefixa os volumes.
COMPOSE="sudo docker compose"

# Gera nginx.conf a partir de um template, com o domínio substituído.
# Antes o script alternava blocos comentados com sed dentro do próprio
# nginx.conf — o que descomentava também as linhas marcadoras e deixava dois
# "location /" no mesmo server, quebrando o Nginx na hora de ativar o HTTPS.
gerar_nginx() { # $1 = http|https, $2 = domínio
  sed "s/SEU_DOMINIO_AQUI/$2/g" "nginx/$1.conf" > nginx.conf
}

# ---------------------------------------------------------------------------
log "Configurando variáveis de ambiente..."

ADMIN_EMAIL=""
ADMIN_SENHA=""

if [ -f .env ]; then
  aviso ".env já existe — mantendo o que já está configurado (apague o arquivo se quiser recomeçar)."
  # shellcheck disable=SC1091
  set -a; . ./.env; set +a
else
  read -rp "Domínio que vai apontar pra essa VPS (ex.: app.levva.com.br) — deixe em branco pra configurar depois: " DOMINIO

  echo ""
  echo "  Conta de administrador (é com ela que você aprova motoristas)."
  read -rp "  E-mail do admin: " ADMIN_EMAIL
  while [ -z "$ADMIN_EMAIL" ]; do
    aviso "O e-mail do admin é obrigatório — sem ele ninguém aprova cadastro nenhum."
    read -rp "  E-mail do admin: " ADMIN_EMAIL
  done

  read -rsp "  Senha do admin (mín. 8 caracteres, com letra e número): " ADMIN_SENHA; echo ""
  while [ ${#ADMIN_SENHA} -lt 8 ]; do
    aviso "Senha curta demais."
    read -rsp "  Senha do admin: " ADMIN_SENHA; echo ""
  done

  echo ""
  echo "  SMTP — usado pra redefinição de senha e avisos de aprovação."
  echo "  Sem isso, ninguém consegue recuperar a senha esquecida."
  read -rp "  Servidor SMTP (Enter pra pular): " SMTP_HOST
  SMTP_PORT=""; SMTP_USER=""; SMTP_PASS=""; SMTP_FROM=""
  if [ -n "$SMTP_HOST" ]; then
    read -rp "  Porta SMTP [587]: " SMTP_PORT; SMTP_PORT=${SMTP_PORT:-587}
    read -rp "  Usuário SMTP: " SMTP_USER
    read -rsp "  Senha SMTP: " SMTP_PASS; echo ""
    read -rp "  Remetente [Levva <${SMTP_USER}>]: " SMTP_FROM
    SMTP_FROM=${SMTP_FROM:-"Levva <${SMTP_USER}>"}
  else
    aviso "Sem SMTP: a recuperação de senha não vai funcionar até você configurar."
  fi

  SENHA_DB=$(openssl rand -hex 16)
  JWT_SECRET=$(openssl rand -base64 48 | tr -d '\n')

  if [ -n "$DOMINIO" ]; then
    APP_URL="https://${DOMINIO}"
  else
    # Sem domínio o app responde pelo IP. Precisa ser o IP público de verdade:
    # APP_URL define os links dos e-mails e, principalmente, decide se o cookie
    # de sessão vai marcado como `secure` — que em HTTP faria o navegador
    # descartar o cookie e ninguém conseguiria entrar.
    IP_PUBLICO=$(curl -fsS --max-time 5 https://api.ipify.org 2>/dev/null || true)
    if [ -z "$IP_PUBLICO" ]; then
      IP_PUBLICO=$(hostname -I 2>/dev/null | awk '{print $1}')
    fi
    read -rp "  IP público desta VPS [${IP_PUBLICO}]: " IP_INFORMADO
    IP_PUBLICO=${IP_INFORMADO:-$IP_PUBLICO}
    APP_URL="http://${IP_PUBLICO}"
    aviso "Sem HTTPS, a sessão trafega em texto puro. Use só pra testar; assim que"
    aviso "tiver domínio, rode este script de novo pra ativar o certificado."
  fi

  cat > .env << EOF
DATABASE_URL="postgresql://levva:${SENHA_DB}@db:5432/levva"
POSTGRES_PASSWORD="${SENHA_DB}"
JWT_SECRET="${JWT_SECRET}"
APP_URL="${APP_URL}"
SMTP_HOST="${SMTP_HOST}"
SMTP_PORT="${SMTP_PORT}"
SMTP_USER="${SMTP_USER}"
SMTP_PASS="${SMTP_PASS}"
SMTP_FROM="${SMTP_FROM}"
NODE_ENV="production"
EOF
  chmod 600 .env

  log ".env criado (senha do banco e JWT_SECRET gerados automaticamente)."

  if [ -n "$DOMINIO" ]; then
    gerar_nginx http "$DOMINIO"
    log "nginx.conf gerado para o domínio ${DOMINIO} (HTTP; o HTTPS entra depois do certificado)."
  else
    # "_" é o coringa do Nginx: responde por qualquer host, inclusive o IP.
    gerar_nginx http "_"
    aviso "Sem domínio informado — o app responde por HTTP no IP ${IP_PUBLICO}."
    aviso "Quando tiver domínio, aponte o DNS e rode este script de novo pra ativar HTTPS."
  fi
fi

# ---------------------------------------------------------------------------
log "Subindo os containers (build pode levar alguns minutos na primeira vez)..."
# O serviço "migrate" roda as migrações e sai; o app só sobe depois que ele
# termina com sucesso, então não há mais 'sleep' torcendo pro banco estar pronto.
$COMPOSE up -d --build

log "Rodando seed de escolas..."
$COMPOSE run --rm migrate npx tsx prisma/seed.ts \
  || aviso "Seed falhou — rode depois com: sudo docker compose run --rm migrate npx tsx prisma/seed.ts"

# ---------------------------------------------------------------------------
if [ -n "${ADMIN_EMAIL}" ] && [ -n "${ADMIN_SENHA}" ]; then
  log "Criando a conta de administrador..."
  $COMPOSE run --rm \
    -e ADMIN_EMAIL="$ADMIN_EMAIL" \
    -e ADMIN_SENHA="$ADMIN_SENHA" \
    migrate npx tsx prisma/criar-admin.ts \
    || aviso "Não deu pra criar o admin agora. Rode depois com:
    sudo ADMIN_EMAIL=... ADMIN_SENHA=... docker compose run --rm -e ADMIN_EMAIL -e ADMIN_SENHA migrate npx tsx prisma/criar-admin.ts"
else
  aviso "Admin não criado (o .env já existia). Pra criar ou trocar a senha:"
  echo "    sudo docker compose run --rm -e ADMIN_EMAIL=voce@exemplo.com -e ADMIN_SENHA='SuaSenha1' migrate npx tsx prisma/criar-admin.ts"
fi

# ---------------------------------------------------------------------------
echo ""
read -rp "Criar contas de DEMONSTRAÇÃO (admin, pai e motorista, com senhas conhecidas)? (s/N): " DEMO
if [[ "$DEMO" =~ ^[sS]$ ]]; then
  $COMPOSE run --rm migrate npx tsx prisma/seed-demo.ts \
    || aviso "Seed de demonstração falhou — rode depois com: sudo docker compose run --rm migrate npx tsx prisma/seed-demo.ts"
  aviso "As senhas de demonstração estão no repositório. Apague essas contas antes de abrir ao público."
fi

# ---------------------------------------------------------------------------
if grep -qE "SEU_DOMINIO_AQUI|server_name _;" nginx.conf; then
  aviso "Pulei a emissão de HTTPS porque nenhum domínio foi configurado."
  aviso "Acesse por ${APP_URL}"
else
  DOMINIO_ATUAL=$(grep -m1 -oP 'server_name \K[^;]+' nginx.conf)

  if $COMPOSE run --rm --entrypoint sh certbot -c "[ -d /etc/letsencrypt/live/${DOMINIO_ATUAL} ]" 2>/dev/null; then
    log "Certificado de ${DOMINIO_ATUAL} já existe — pulando a emissão."
    EMITIR="n"
  else
    echo ""
    read -rp "Emitir certificado HTTPS agora pra ${DOMINIO_ATUAL}? Confirme que o DNS já aponta pra esse IP (s/N): " EMITIR
  fi

  if [[ "$EMITIR" =~ ^[sS]$ ]]; then
    log "Emitindo certificado via Let's Encrypt..."

    # Roda pelo próprio compose, e não por 'docker run' com nome de volume
    # fixo: assim o desafio é gravado no MESMO volume que o Nginx serve, e o
    # certificado vai pro MESMO volume que o Nginx monta. Antes eram lugares
    # diferentes, e a validação falhava (ou o certificado sumia) dependendo
    # do nome da pasta do projeto.
    if $COMPOSE run --rm --entrypoint certbot certbot \
        certonly --webroot -w /var/www/certbot \
        -d "$DOMINIO_ATUAL" --non-interactive --agree-tos \
        -m "${ADMIN_EMAIL:-admin@${DOMINIO_ATUAL}}"; then

      log "Certificado emitido. Ativando HTTPS no Nginx..."

      # Descomenta o bloco 443 e o redirecionamento do 80.
      sed -i \
        -e '/>>> BLOCO HTTPS/,/<<< FIM DO BLOCO HTTPS/ s/^# \{0,1\}//' \
        -e '/>>> REDIRECIONAMENTO HTTPS/,/<<< FIM DO REDIRECIONAMENTO/ s/^\( *\)# \{0,1\}/\1/' \
        nginx.conf

      if $COMPOSE exec -T nginx nginx -t; then
        $COMPOSE restart nginx
        log "HTTPS ativado — acesse https://${DOMINIO_ATUAL}"
      else
        falha "A configuração do Nginx não passou no teste. Confira nginx.conf e rode: sudo docker compose restart nginx"
      fi
    else
      aviso "Certbot falhou — confira se a porta 80 está acessível de fora e se o DNS já propagou, depois rode este script de novo."
    fi
  fi
fi

# ---------------------------------------------------------------------------
echo ""
log "Pronto! A Levva está no ar."
if [ -n "${ADMIN_EMAIL}" ]; then
  echo -e "${CINZA}Entre em ${APP_URL:-http://SEU_IP}/entrar com ${ADMIN_EMAIL} e a senha que você definiu.${RESET}"
fi
echo ""
echo -e "${CINZA}Comandos úteis:${RESET}"
echo "  sudo docker compose logs -f app       # ver logs do app em tempo real"
echo "  sudo docker compose ps                # estado dos containers"
echo "  sudo docker compose down              # parar tudo"
echo "  sudo docker compose up -d --build     # rebuildar após mudanças no código"
echo "  sudo docker compose run --rm migrate npx prisma migrate deploy   # aplicar migrações novas"
