#!/usr/bin/env bash
#
# atualizar.sh — puxa o código novo do Git e aplica tudo na VPS, num comando só.
#
#   ./atualizar.sh           atualiza código, migrações e sobe os containers
#   ./atualizar.sh --demo    idem, e recria as contas de demonstração
#
# É seguro rodar quantas vezes quiser. Não mexe no .env nem no banco além das
# migrações — suas contas, motoristas e leads continuam onde estão.

set -euo pipefail

VERDE='\033[0;32m'; AMARELO='\033[1;33m'; VERMELHO='\033[0;31m'; CINZA='\033[0;90m'; RESET='\033[0m'
log()  { echo -e "${VERDE}==>${RESET} $1"; }
aviso(){ echo -e "${AMARELO}!!${RESET} $1"; }
falha(){ echo -e "${VERMELHO}✗${RESET} $1"; exit 1; }

cd "$(dirname "$0")"

DEMO=0
for arg in "$@"; do
  case "$arg" in
    --demo|--seed-demo) DEMO=1 ;;
    *) falha "Opção desconhecida: $arg (use --demo)" ;;
  esac
done

COMPOSE="sudo docker compose"
NGINX_ATIVO="nginx.active.conf"

[ -f .env ] || falha "Não achei o .env. Rode ./instalar-vps.sh primeiro."

# ---------------------------------------------------------------------------
# Migração de quem instalou antes: o nginx.conf versionado saiu do repositório
# e virou nginx.active.conf, gerado e fora do controle de versão. Sem isso o
# git pull falharia reclamando de alteração local num arquivo rastreado.
if [ ! -f "$NGINX_ATIVO" ] && [ -f nginx.conf ]; then
  log "Movendo nginx.conf para $NGINX_ATIVO (deixou de ser versionado)..."
  mv nginx.conf "$NGINX_ATIVO"
fi
# Se o arquivo ainda existir rastreado pelo Git, descarta a cópia local pra
# não travar o pull — o conteúdo que vale já está em $NGINX_ATIVO.
if git ls-files --error-unmatch nginx.conf > /dev/null 2>&1; then
  git checkout -- nginx.conf 2>/dev/null || true
fi

# ---------------------------------------------------------------------------
log "Buscando atualizações do GitHub..."
ANTES=$(git rev-parse HEAD)
git pull --ff-only || falha "git pull falhou. Rode 'git status' pra ver o que travou."
DEPOIS=$(git rev-parse HEAD)

if [ "$ANTES" = "$DEPOIS" ]; then
  log "Já estava na versão mais recente ($(git rev-parse --short HEAD))."
else
  log "Atualizado: $(git rev-parse --short "$ANTES") → $(git rev-parse --short "$DEPOIS")"
  git --no-pager log --oneline "$ANTES..$DEPOIS" | sed 's/^/    /'
fi

# ---------------------------------------------------------------------------
# APP_URL define os links dos e-mails e, mais importante, decide se o cookie
# de sessão vai marcado como `secure`. Apontando pra localhost numa VPS, os
# links saem quebrados; apontando pra https sem certificado, ninguém entra.
if grep -q 'APP_URL="http://localhost' .env 2>/dev/null; then
  IP=$(curl -fsS --max-time 5 https://api.ipify.org 2>/dev/null || hostname -I | awk '{print $1}')
  if [ -n "$IP" ]; then
    sed -i "s|^APP_URL=.*|APP_URL=\"http://${IP}\"|" .env
    log "APP_URL corrigido para http://${IP} (estava apontando pra localhost)."
  else
    aviso "APP_URL aponta pra localhost e não consegui descobrir o IP. Ajuste à mão no .env."
  fi
fi

# Sem esse arquivo o Docker criaria um diretório no lugar do bind mount.
if [ ! -f "$NGINX_ATIVO" ]; then
  log "Gerando configuração do Nginx (HTTP, respondendo por qualquer host)..."
  sed 's/SEU_DOMINIO_AQUI/_/g' nginx/http.conf > "$NGINX_ATIVO"
fi

# ---------------------------------------------------------------------------
log "Rebuildando e subindo os containers..."
# As migrações rodam no serviço "migrate", e o app só sobe depois que elas
# terminam com sucesso — não precisa de passo separado.
$COMPOSE up -d --build

if [ "$DEMO" = "1" ]; then
  log "Recriando as contas de demonstração..."
  $COMPOSE run --rm migrate npx tsx prisma/seed-demo.ts
fi

# ---------------------------------------------------------------------------
echo ""
log "Estado dos containers:"
$COMPOSE ps

APP_URL_ATUAL=$(grep -m1 '^APP_URL=' .env | cut -d'"' -f2)
echo ""
log "Pronto. Acesse ${APP_URL_ATUAL:-http://SEU_IP}"
echo -e "${CINZA}  'migrate' aparecer como exited (0) é o esperado: ele roda as migrações e sai.${RESET}"
