# Levva

Plataforma de intermediação de transporte escolar em Salvador/BA.
App completo — landing, os 3 painéis (pai / motorista / admin), login
sem senha por OTP, upload de documentos, geocoding e busca por região,
tudo ligado a um banco Postgres de verdade.

## Stack

- **Next.js 15** (App Router) + TypeScript
- **Tailwind CSS** — tokens de marca em `tailwind.config.ts`
- **Prisma + PostgreSQL** — schema em `prisma/schema.prisma`
- **Zod** — validação de dados nas API routes
- **jose** — JWT de sessão (cookie httpOnly)
- **Nominatim (OSM)** — geocoding de endereço, sem custo

## Estrutura

```
app/
  page.tsx                → landing page (pública)
  entrar/                  → login por OTP (telefone -> código -> sessão)
  pai/
    page.tsx                → busca (pública, sem cadastro obrigatório)
    dashboard/               → histórico de solicitações (autenticado)
  motorista/
    cadastro/                → cadastro PÚBLICO de motorista novo (sem sessão).
                                Única página que mostra valores de plano.
    (painel)/                 → área autenticada (leads, perfil).
                                Route group só pra não herdar o header
                                público de /cadastro; não afeta a URL.
  admin/                    → aprovação de motoristas + métricas (MRR etc)
  api/
    auth/                     → solicitar-codigo, confirmar-codigo, sair
    motoristas/                → POST cria cadastro (chamado por /motorista/cadastro)
    motorista/perfil/           → PUT atualiza perfil público + escolas atendidas
    motorista/leads/[id]/        → PATCH muda status de um lead
    admin/motoristas/[id]/        → aprovar/reprovar (protegido por sessão ADMIN)
    busca/                     → POST geocodifica + lista motoristas compatíveis
    leads/                     → POST cria lead (cria o pai na hora, sem fricção)
    upload/                    → POST recebe documentos (CNH, curso, etc.)
    escolas/                   → GET autocomplete de escolas
lib/
  geo.ts                    → Haversine + geocoding real via Nominatim
  plano.ts                   → regra de enquadramento Básico/Frota + preços
  auth.ts                     → OTP via WhatsApp Cloud API + sessão JWT
  storage.ts                   → upload local (public/uploads), pronto pra
                                  trocar por S3/R2 trocando só essa função
  db.ts                        → cliente Prisma
prisma/
  schema.prisma               → modelo de dados completo
  seed.ts                      → escolas de Salvador/Lauro de Freitas
middleware.ts                → protege /pai, /motorista, /admin por sessão+papel
Dockerfile, docker-compose.yml, nginx.conf, instalar-vps.sh
                             → deploy completo (ver seção abaixo)
```

## Como rodar localmente

```bash
npm install
cp .env.example .env        # preencher DATABASE_URL, POSTGRES_PASSWORD, JWT_SECRET
npm run db:push             # cria as tabelas a partir do schema
npm run db:seed             # popula escolas de Salvador/Lauro de Freitas
npm run dev
```

Sem `WHATSAPP_API_TOKEN`/`WHATSAPP_PHONE_ID` configurados, o código OTP
cai no console do servidor (`[OTP dev] Código pra 55...: 123456`) — dá
pra testar o fluxo de login inteiro sem gastar nada.

## Deploy na VPS

Tudo pronto pra subir com Docker — Postgres, o app e Nginx com HTTPS
automático via Let's Encrypt.

```bash
scp -r levva-app usuario@SEU_IP:~/levva-app
ssh usuario@SEU_IP
cd levva-app
chmod +x instalar-vps.sh
./instalar-vps.sh
```

O script (`instalar-vps.sh`):
1. Instala Docker + Docker Compose se ainda não tiver
2. Gera senha de banco e `JWT_SECRET` sozinho, cria o `.env`
3. Sobe Postgres + app + Nginx (`docker compose up -d --build`)
4. Roda as migrações do Prisma e o seed de escolas
5. Se você informar um domínio (e o DNS já estiver apontado pro IP da
   VPS), emite certificado HTTPS automaticamente

Pode rodar de novo a qualquer momento — se o `.env` já existir, ele
não mexe nas credenciais, só garante que os containers estão no ar.

**Antes de rodar**, aponte o DNS do seu domínio (registro A) pro IP da
VPS — o certbot só emite certificado se a VPS já responder por esse
domínio.

Depois de qualquer mudança de código, o deploy é:
```bash
docker compose up -d --build
```

### Comandos úteis pós-deploy

```bash
docker compose logs -f app        # logs do app em tempo real
docker compose exec app sh        # shell dentro do container
docker compose exec app npx prisma studio  # abrir o Prisma Studio (dados)
docker compose down               # parar tudo
```

## O que já está pronto

- Landing page completa e responsiva, com menu mobile
- Login sem senha por OTP (WhatsApp), sessão via JWT em cookie httpOnly
- Cadastro público de motorista (`/motorista/cadastro`) ligado ao banco,
  com upload de documentos e cálculo de plano em tempo real
- Busca do pai por endereço + escola (geocoding real via Nominatim),
  sem exigir cadastro prévio
- Painel do motorista: leads recebidos com atualização de status, perfil
  editável com autocomplete de escolas atendidas
- Painel admin: fila de aprovação de documentos (aprovar libera o
  motorista pra aparecer nas buscas e ativa a assinatura), dashboard de
  métricas reais (MRR, transportadores ativos, taxa de conversão, leads
  aguardando repasse manual)
- Regra de enquadramento de plano (`lib/plano.ts`): **Frota = mais de 1
  veículo OU 3+ escolas atendidas**
- Deploy completo via Docker, com HTTPS automático

## O que falta (não bloqueia o deploy, mas vale planejar)

1. **Notificação automática de novo lead pro admin** — hoje o admin vê
   os leads pendentes no dashboard e repassa manualmente via WhatsApp
   (link já pronto); dá pra automatizar isso com um webhook depois
2. **Notificar motorista de aprovação/reprovação** — os `TODO` já estão
   marcados em `app/api/admin/motoristas/[id]/*`
3. **Cobrança recorrente de verdade** — hoje a assinatura só vira "ATIVA"
   quando o admin aprova; falta integrar um gateway (Stripe, Asaas, etc.)
   pra cobrar a mensalidade de fato
4. **Avaliações pós-atendimento** — schema já tem `Avaliacao`, falta a tela
5. Trocar upload local por S3/R2 se o volume de documentos crescer muito
   (o contrato em `lib/storage.ts` já foi pensado pra essa troca ser simples)

## Design tokens

Toda cor e tipografia do produto vive em `tailwind.config.ts`. Não
hardcode hex codes nas páginas — sempre `text-navy`, `bg-amber`, etc.

| Token | Uso |
|---|---|
| `navy` #12203D | fundo principal, texto sobre claro |
| `amber` #E8A33D | CTA principal, destaque |
| `cream` #FBF8F1 | fundo de seções claras |
| `sage` #4F6D5C | verificação, confiança, sucesso |
| `ink` #161510 | texto padrão |

Fontes: `Instrument Serif` (títulos), `Inter` (corpo/UI), `Space Mono`
(dados/labels pequenos).
