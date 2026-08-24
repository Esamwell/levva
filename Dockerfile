# syntax=docker/dockerfile:1

FROM node:20-slim AS base
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# ---- deps ----
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci

# ---- build ----
# Este estágio também é usado em produção pelo serviço "migrate" do compose:
# é aqui que existem o CLI do Prisma e o tsx, que a imagem final não carrega.
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# ---- runtime ----
FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Documentos enviados pelos motoristas. Fora de public/ de propósito: CNH e
# certidão de antecedentes são dado pessoal e só saem por /api/documentos,
# que confere sessão e papel antes de responder.
ENV UPLOAD_DIR=/app/uploads
RUN mkdir -p /app/uploads && chown -R nextjs:nodejs /app/uploads

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
