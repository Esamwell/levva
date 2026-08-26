# Mova

Plataforma de intermediação de transporte escolar em Salvador/BA (#vaidemova).
App completo — landing, os 3 painéis (pai / motorista / admin), login por
e-mail e senha, upload protegido de documentos, geocoding e busca por
região, PWA instalável — tudo ligado a um banco Postgres de verdade.

**Modelo de negócio**: cadastro e listagem gratuitos, sem mensalidade. A
Mova ganha uma comissão (`TAXA_MOVA_PERCENTUAL`, hoje 15%, em
`lib/financeiro.ts`) só em cima de contrato fechado de verdade — o
motorista escolhe, a cada contrato, se absorve a taxa ou repassa pro
responsável. Cobrança recorrente automática (Asaas) ainda não está
integrada; fase atual só registra o acordo dentro da plataforma.

## Stack

- **Next.js 15** (App Router) + TypeScript
- **Tailwind CSS** — tokens de marca em `tailwind.config.ts`
- **Prisma + PostgreSQL** — schema em `prisma/schema.prisma`
- **Zod** — validação de dados nas API routes
- **jose** — JWT de sessão (cookie httpOnly `mova_sessao`)
- **bcryptjs** — hash de senha
- **Nodemailer** — e-mail transacional (redefinição de senha, avisos)
- **Nominatim (OSM)** — geocoding de endereço, com cache em `GeocodeCache`
- **Framer Motion / GSAP** (via componentes react-bits) — animações
- **next-pwa manual** (`app/manifest.ts` + `public/sw.js`) — instalável, com
  fallback offline

## Painéis e o que cada um faz hoje

### Pai (`/pai`)
Busca pública por endereço + escola (sem cadastro obrigatório) →
solicita contato com um transportador → cadastro explícito (com senha)
acontece nesse momento. Painel autenticado: `dashboard` (solicitações e
avaliação de contrato fechado), `perfil` (dados + filhos), `suporte`
(chamados).

### Motorista (`/motorista`)
Cadastro público em 4 passos (`/motorista/cadastro`, com aceite de
Termos via modal de scroll obrigatório) → fila de aprovação documental
→ painel: `Leads`, `Meus alunos` (roster + contato do responsável),
`Financeiro` (contratos fechados, valor líquido, marcar ciclo como
recebido), `Meu perfil` (dados públicos + fotos/vídeo + preferência de
quem paga a taxa), `Documentos` (reenviar CNH/curso/antecedentes —
reenviar depois de aprovado manda de volta pra fila), `Extras`
(destaque avulso, pago fora da plataforma por enquanto), `Suporte`.

### Admin (`/admin`)
Dashboard (comissão do mês, transportadores ativos, taxa de conversão,
leads aguardando repasse), `Aprovações` (fila documental),
`Motoristas` (lista + detalhe completo), `Usuários` (pai/motorista/admin,
ativar/desativar), `Pais` (detalhe: filhos + histórico de solicitações),
`Depoimentos` (moderação de avaliação antes de virar pública),
`Suporte` (fila de chamados, prioriza quem tem Destaque ativo),
`Financeiro` (receita de comissão, extras pendentes de confirmação de
pagamento).

## Estrutura

```
app/
  page.tsx                     → landing (pública)
  para-motoristas/              → página explicativa do modelo de comissão
  termos/                        → Termos de Uso (seções #motoristas e #familias)
  entrar/, recuperar-senha/, redefinir-senha/
  pai/                          → busca, dashboard, perfil, suporte
  motorista/
    cadastro/                    → cadastro público (aceite de termos via modal)
    (painel)/                     → leads, alunos, financeiro, perfil, documentos, extras, suporte
  admin/                        → aprovações, motoristas, usuários, pais,
                                    depoimentos, suporte, financeiro
  api/                          → uma rota por ação; ver prisma/schema.prisma
                                    pros modelos e app/api/**/route.ts pra
                                    regra de cada uma
lib/
  auth.ts                       → senha, sessão em banco + JWT, tentativas,
                                    recuperação de senha
  session-edge.ts                → só checagem de JWT (roda em edge, sem Prisma)
  financeiro.ts                  → TAXA_MOVA_PERCENTUAL, preço do Destaque,
                                    cálculo de vencimento de ciclo
  termos.ts, termos-conteudo.tsx  → versão e texto dos Termos de Uso
                                     (fonte única pra página + modal)
  email.ts                       → SMTP + modelos de mensagem
  storage.ts                     → upload de documento (privado, /api/documentos)
                                    e de mídia de perfil (pública, /api/midia)
  geo.ts                         → Haversine + geocoding com cache
  db.ts                          → cliente Prisma
prisma/
  schema.prisma                  → modelo de dados completo
  migrations/                     → histórico (uma migração por mudança de schema)
  seed.ts                         → escolas de Salvador/Lauro de Freitas
  seed-demo.ts                    → contas de teste dos 3 papéis (ver aviso abaixo)
  criar-admin.ts                  → cria/atualiza a conta de administrador
middleware.ts                   → protege /pai, /motorista, /admin por sessão+papel
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

**`npm run seed:demo` deixa senha em texto claro no repositório**
(`prisma/seed-demo.ts`). Serve só pra explorar o sistema — apague essas
contas ou troque as senhas antes de abrir ao público de verdade.

Sem SMTP configurado, e-mails (redefinição de senha, aprovação de
motorista, avisos de lead/extra) **não são enviados**: caem no log do
servidor com aviso em destaque. Serve pra testar em dev; em produção
significa que ninguém recupera senha sozinho.

## Deploy na VPS

```bash
ssh usuario@SEU_IP
sudo apt update && sudo apt install -y git
git clone https://github.com/Esamwell/levva.git
cd levva
chmod +x instalar-vps.sh
./instalar-vps.sh
```

O script:
1. Instala Docker + Docker Compose se ainda não tiver
2. Pergunta domínio, e-mail/senha do admin e SMTP; gera senha de banco e
   `JWT_SECRET` sozinho e cria o `.env`
3. Sobe Postgres + app + Nginx. Migrações rodam num container próprio; o
   app só sobe depois que elas terminam com sucesso
4. Roda o seed de escolas e cria a conta de administrador
5. Se você informar um domínio (e o DNS já apontar pro IP da VPS), emite
   certificado HTTPS via certbot e liga a renovação automática

Pode rodar de novo a qualquer momento — se o `.env` já existir, não mexe
nas credenciais, só garante que os containers estão no ar.

Depois de qualquer mudança de código:
```bash
docker compose up -d --build app
```

Depois de editar `nginx.active.conf` (gerado pelo instalador, fora do
git): `docker compose restart nginx` — um `reload` sozinho não pega o
arquivo novo por causa de como o bind mount funciona.

### Comandos úteis pós-deploy

```bash
docker compose logs -f app          # logs do app em tempo real
docker compose ps                   # estado dos containers
docker compose run --rm migrate npx prisma migrate deploy   # migração nova após git pull

# criar admin, ou trocar a senha dele
docker compose run --rm -e ADMIN_EMAIL=voce@exemplo.com -e ADMIN_SENHA='NovaSenha1' migrate npx tsx prisma/criar-admin.ts
```

## O que já está pronto

- Landing responsiva com painel split-flap animado, PWA instalável com
  prompt de instalação e fallback offline
- Login único (e-mail + senha) pros 3 papéis, sessão em banco (revogável)
  + JWT em cookie httpOnly, bloqueio de 5 tentativas/15min por conta e IP
- Redefinição de senha por e-mail com token de uso único (expira em 1h,
  derruba sessões abertas)
- Documentos oficiais (CNH, curso, antecedentes) fora de `public/`,
  servidos só por `/api/documentos` com checagem de papel; fotos/vídeo de
  perfil são público de propósito, por `/api/midia`
- Cadastro de motorista com aceite de Termos de Uso via modal (scroll
  obrigatório até o fim antes de poder concordar) — mesmo padrão no
  primeiro contato do pai
- Reenviar documento oficial depois de aprovado manda o cadastro de volta
  pra fila de revisão automaticamente
- Modelo de comissão: `Contrato` nasce quando o motorista marca um lead
  como fechado (valor, periodicidade, quem paga a taxa); `Cobranca`
  registra cada ciclo recebido manualmente (sem Asaas ainda, o motorista
  marca à mão); `MotoristaExtra` cobre serviços avulsos (Destaque) com
  fluxo de confirmação de pagamento pelo admin
  <br>Assinatura (mensalidade fixa) **foi aposentada** do fluxo ativo — o
  model continua no schema só pra não perder dado de quem já tinha, sem
  migração de remoção
- Avaliação pós-fechamento com moderação do admin antes de contar na nota
  pública de busca
- Chamados de suporte (tipo ticket, não chat) nos três painéis, com fila
  priorizada pra motorista com Destaque ativo
- Deploy completo via Docker com HTTPS automático

## Auditoria — achados e o que falta

Varredura completa feita em 26/08/2026, cobrindo segurança, integridade
de dados e lacunas de produto. **Relatório detalhado, com prioridade e
como corrigir cada item, publicado como artifact** — peça o link de novo
se precisar, ou veja o resumo por categoria abaixo.

**Segurança — vale corrigir antes de abrir ao público:**
- Senhas de `seed:demo` públicas no GitHub — apagar essas contas ou
  trocar senha antes do lançamento real
- Cabeçalhos de segurança (`X-Frame-Options` etc.) só se aplicam a
  `/pai`, `/motorista`, `/admin` — landing, `/termos`, `/entrar` e toda
  rota `/api/*` saem sem eles, porque `middleware.ts` só intercepta esse
  matcher
- Cache do Service Worker não é limpo no logout — em aparelho
  compartilhado, tela autenticada fica acessível offline pro próximo
  usuário do mesmo navegador
- Sem rate limit em `/api/busca` (geocoding) e `/api/auth/recuperar`
  (recuperação de senha)
- 4 vulnerabilidades altas via `npm audit` (postcss/sharp, transitivas do
  Next) — só resolve subindo pra Next 16, mudança grande, planejar com
  calma

**Produto — combinado que fica pra depois, não é bug:**
1. Integração real com Asaas (cobrança automática, split de pagamento)
2. Rastreador GPS — ainda em análise
3. Autoexclusão de conta / exportação de dados (LGPD)
4. Moderação de fotos/vídeo do perfil do motorista (hoje aparece assim
   que sobe, sem revisão prévia como documento oficial)
5. Aceite retroativo de Termos pra quem já tinha conta antes da coluna
   `termosAceitosEm` existir

**Correção/operacional:**
- Nenhuma lista do admin tem paginação (`findMany` sem `take`) — ok hoje,
  vai pesar conforme a base cresce
- Busca por escola não ignora acento (`Antonio` não acha `Antônio`)
- Sem jeito do admin corrigir um `Contrato`/`Cobranca` depois de criado,
  nem cadastrar `Escola` nova pelo painel (só via `prisma/seed.ts`)
- Chamado de suporte novo não dispara e-mail pro admin (leads e extras
  disparam; suporte só aparece pelo contador no menu)
- Zero teste automatizado no projeto

## Design tokens

Toda cor e tipografia do produto vive em `tailwind.config.ts`. Não
hardcode hex nas páginas — sempre `text-navy`, `bg-amber`, etc.

| Token | Hex | Uso |
|---|---|---|
| `navy` | `#111111` | texto padrão, fundo dos painéis internos (sidebar) |
| `amber` | `#FEDB1A` | cor de marca, fundo da landing, CTA principal |
| `cream` | `#FFFFFF` / linha `#E5E5E5` | fundo de cartão, borda |
| `ink-soft` | `#6B6B6B` | texto secundário |
| `sage` | `#4A7A5E` | verificação/aprovação — à parte do par amarelo+preto de propósito, pra não perder o sinal visual de "confirmado" |

Fontes: **Fredoka** (`font-serif`, títulos), **Inter** (`font-sans`,
corpo), **Space Mono** (`font-mono`, valores/labels pequenos).
