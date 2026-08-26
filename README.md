# Mova

Plataforma de intermediação de transporte escolar em Salvador/BA.
App completo — landing, os 3 painéis (pai / motorista / admin), login
por e-mail e senha, upload protegido de documentos, geocoding e busca
por região, tudo ligado a um banco Postgres de verdade.

## Stack

- **Next.js 15** (App Router) + TypeScript
- **Tailwind CSS** — tokens de marca em `tailwind.config.ts`
- **Prisma + PostgreSQL** — schema em `prisma/schema.prisma`
- **Zod** — validação de dados nas API routes
- **jose** — JWT de sessão (cookie httpOnly)
- **bcryptjs** — hash de senha
- **Nodemailer** — e-mail transacional (redefinição de senha, avisos)
- **Nominatim (OSM)** — geocoding de endereço, sem custo

## Estrutura

```
app/
  page.tsx                → landing page (pública)
  entrar/                  → login único (e-mail + senha), redireciona por papel
  recuperar-senha/          → pede o link de redefinição
  redefinir-senha/           → escolhe a nova senha a partir do link
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
    auth/                     → entrar, sair, recuperar, redefinir
    motoristas/                → POST cria cadastro (chamado por /motorista/cadastro)
    motorista/perfil/           → PUT atualiza perfil público + escolas atendidas
    motorista/leads/[id]/        → PATCH muda status de um lead
    admin/motoristas/[id]/        → aprovar/reprovar (protegido por sessão ADMIN)
    busca/                     → POST geocodifica + lista motoristas compatíveis
    leads/                     → POST cria lead (cadastra o pai com senha, se novo)
    upload/                    → POST recebe documentos (exige sessão de motorista)
    documentos/[...caminho]/    → GET serve documento com checagem de papel
    escolas/                   → GET autocomplete de escolas
lib/
  geo.ts                    → Haversine + geocoding real via Nominatim
  plano.ts                   → regra de enquadramento Básico/Frota + preços
  auth.ts                     → senha (bcrypt), sessão em banco + JWT,
                                  limite de tentativas, recuperação de senha
  session-edge.ts              → só a checagem de JWT, sem Prisma nem bcrypt.
                                  É o que o middleware importa (roda em edge)
  email.ts                      → SMTP + modelos das mensagens
  storage.ts                     → upload FORA de public/, pronto pra trocar
                                    por S3/R2 mexendo só nessa função
  db.ts                        → cliente Prisma
prisma/
  schema.prisma               → modelo de dados completo
  migrations/                  → histórico de migrações (prisma migrate)
  seed.ts                       → escolas de Salvador/Lauro de Freitas
  criar-admin.ts                 → cria/atualiza a conta de administrador
middleware.ts                → protege /pai, /motorista, /admin por sessão+papel
nginx/http.conf, nginx/https.conf
                             → templates do Nginx; nginx.conf é GERADO
                                a partir deles pelo instalador
Dockerfile, docker-compose.yml, instalar-vps.sh
                             → deploy completo (ver seção abaixo)
```

## Como rodar localmente

```bash
npm install
cp .env.example .env        # preencher DATABASE_URL, POSTGRES_PASSWORD, JWT_SECRET
npm run db:migrate          # aplica as migrações
npm run db:seed             # popula escolas de Salvador/Lauro de Freitas
ADMIN_EMAIL=voce@exemplo.com ADMIN_SENHA='TrocarDepois1' npm run criar-admin
npm run seed:demo           # opcional: contas de teste dos 3 papéis
npm run dev
```

O `criar-admin` cria a conta de administrador. O `seed:demo` adiciona contas
de teste dos três papéis, com dados de exemplo nos painéis — as senhas ficam
visíveis em `prisma/seed-demo.ts`, então apague essas contas antes de abrir
ao público. **Sem ela ninguém aprova
motorista nenhum** — o painel existe, mas fica inacessível.

Sem SMTP configurado, o e-mail de redefinição de senha **não é enviado**:
a mensagem cai no log do servidor com um aviso em destaque. Serve pra
testar em desenvolvimento; em produção significa que ninguém recupera a
senha sozinho.

## Deploy na VPS

Tudo pronto pra subir com Docker — Postgres, o app e Nginx com HTTPS
automático via Let's Encrypt.

```bash
ssh usuario@SEU_IP
sudo apt update && sudo apt install -y git
git clone https://github.com/Esamwell/levva.git
cd levva
chmod +x instalar-vps.sh
./instalar-vps.sh
```

A pasta pode ter qualquer nome — o instalador não depende mais disso.

O script (`instalar-vps.sh`):
1. Instala Docker + Docker Compose se ainda não tiver
2. Pergunta domínio, e-mail/senha do admin e SMTP; gera senha de banco e
   `JWT_SECRET` sozinho e cria o `.env`
3. Sobe Postgres + app + Nginx. As migrações rodam num container próprio e
   o app só sobe depois que elas terminam com sucesso
4. Roda o seed de escolas e cria a conta de administrador
5. Se você informar um domínio (e o DNS já estiver apontado pro IP da
   VPS), emite certificado HTTPS e liga a renovação automática

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
sudo docker compose logs -f app     # logs do app em tempo real
sudo docker compose ps              # estado dos containers
sudo docker compose down            # parar tudo

# aplicar migrações novas depois de um git pull
sudo docker compose run --rm migrate npx prisma migrate deploy

# criar admin, ou trocar a senha dele
sudo docker compose run --rm -e ADMIN_EMAIL=voce@exemplo.com -e ADMIN_SENHA='NovaSenha1' migrate npx tsx prisma/criar-admin.ts
```

## O que já está pronto

- Landing page completa e responsiva, com menu mobile
- Login por e-mail e senha para os 3 papéis, numa tela só que redireciona
  conforme o papel gravado na conta. Senha em bcrypt, sessão gravada em
  banco (dá pra revogar) e referenciada por JWT em cookie httpOnly
- Bloqueio por tentativas de login: 5 falhas em 15 minutos, contadas por
  conta e por IP separadamente
- Redefinição de senha por e-mail, com token de uso único que expira em 1h
  e derruba as sessões abertas da conta
- Documentos (CNH, antecedentes) ficam FORA de `public/` e só saem por
  `/api/documentos`, que confere sessão e papel: admin vê tudo, motorista
  vê só os próprios
- Aviso por e-mail ao motorista aprovado ou reprovado, e ao admin quando
  entra lead novo
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

1. **Cobrança recorrente de verdade** — hoje a assinatura só vira "ATIVA"
   quando o admin aprova; falta integrar um gateway (Stripe, Asaas, etc.)
   pra cobrar a mensalidade de fato
2. **Avaliações pós-atendimento** — schema já tem `Avaliacao`, falta a tela
3. **Cache de geocoding** — `/api/busca` e `/api/leads` chamam o Nominatim
   a cada requisição. A política do serviço é de 1 consulta por segundo e o
   bloqueio é por IP; guardar o resultado por endereço normalizado resolve a
   maior parte, já que os endereços se repetem dentro de um mesmo bairro
4. **Gestão de veículos pelo motorista** — hoje são cadastrados uma vez, no
   fluxo inicial, e o perfil não permite adicionar nem remover
5. **Testes** — não há nenhum. As regras que mais merecem cobertura são o
   enquadramento de plano, o cálculo de mensalidade e as checagens de papel
6. Trocar upload local por S3/R2 se o volume de documentos crescer muito
   (o contrato em `lib/storage.ts` já foi pensado pra essa troca ser simples)
7. **Next.js 15 → 16** — `npm audit` aponta 4 vulnerabilidades altas em
   dependências transitivas do Next (postcss e sharp). A correção exige
   subir de major, o que é uma mudança grande e merece ser feita com calma

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
