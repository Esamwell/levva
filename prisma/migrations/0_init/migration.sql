-- CreateEnum
CREATE TYPE "Role" AS ENUM ('PAI', 'MOTORISTA', 'ADMIN');

-- CreateEnum
CREATE TYPE "PlanoTipo" AS ENUM ('BASICO', 'FROTA');

-- CreateEnum
CREATE TYPE "StatusAssinatura" AS ENUM ('ATIVA', 'PENDENTE', 'VENCIDA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "StatusAprovacao" AS ENUM ('PENDENTE', 'APROVADO', 'REPROVADO');

-- CreateEnum
CREATE TYPE "StatusLead" AS ENUM ('AGUARDANDO', 'ENCAMINHADO', 'EM_NEGOCIACAO', 'FECHADO', 'NAO_FECHOU');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "telefone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "senhaAlteradaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sessao" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userAgent" TEXT,
    "ip" TEXT,

    CONSTRAINT "Sessao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TokenRecuperacao" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "usado" BOOLEAN NOT NULL DEFAULT false,
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TokenRecuperacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TentativaLogin" (
    "id" TEXT NOT NULL,
    "chave" TEXT NOT NULL,
    "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TentativaLogin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pai" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endereco" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pai_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Filho" (
    "id" TEXT NOT NULL,
    "paiId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "escolaId" TEXT NOT NULL,

    CONSTRAINT "Filho_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Escola" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "bairro" TEXT NOT NULL,
    "cidade" TEXT NOT NULL DEFAULT 'Salvador',
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Escola_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Motorista" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fotoRosto" TEXT,
    "cnhNumero" TEXT NOT NULL,
    "cnhCategoria" TEXT NOT NULL,
    "cnhDocUrl" TEXT,
    "cursoDocUrl" TEXT,
    "antecedentesDocUrl" TEXT,
    "cursoTransporte" BOOLEAN NOT NULL DEFAULT false,
    "antecedentesOk" BOOLEAN NOT NULL DEFAULT false,
    "statusAprovacao" "StatusAprovacao" NOT NULL DEFAULT 'PENDENTE',
    "anosExperiencia" INTEGER NOT NULL DEFAULT 0,
    "temMonitor" BOOLEAN NOT NULL DEFAULT false,
    "precoMin" INTEGER,
    "precoMax" INTEGER,
    "destaqueAtivo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Motorista_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Veiculo" (
    "id" TEXT NOT NULL,
    "motoristaId" TEXT NOT NULL,
    "placa" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "capacidade" INTEGER NOT NULL,
    "fotoUrl" TEXT,

    CONSTRAINT "Veiculo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MotoristaEscola" (
    "id" TEXT NOT NULL,
    "motoristaId" TEXT NOT NULL,
    "escolaId" TEXT NOT NULL,

    CONSTRAINT "MotoristaEscola_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assinatura" (
    "id" TEXT NOT NULL,
    "motoristaId" TEXT NOT NULL,
    "plano" "PlanoTipo" NOT NULL,
    "destaque" BOOLEAN NOT NULL DEFAULT false,
    "status" "StatusAssinatura" NOT NULL DEFAULT 'PENDENTE',
    "valorCentavos" INTEGER NOT NULL,
    "proximaCobranca" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Assinatura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "paiId" TEXT NOT NULL,
    "filhoId" TEXT NOT NULL,
    "motoristaId" TEXT NOT NULL,
    "status" "StatusLead" NOT NULL DEFAULT 'AGUARDANDO',
    "motivoNaoFechou" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "encaminhadoEm" TIMESTAMP(3),

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Avaliacao" (
    "id" TEXT NOT NULL,
    "motoristaId" TEXT NOT NULL,
    "nota" INTEGER NOT NULL,
    "comentario" TEXT,
    "moderado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Avaliacao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_telefone_key" ON "User"("telefone");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_userId_key" ON "Admin"("userId");

-- CreateIndex
CREATE INDEX "Sessao_userId_idx" ON "Sessao"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TokenRecuperacao_tokenHash_key" ON "TokenRecuperacao"("tokenHash");

-- CreateIndex
CREATE INDEX "TokenRecuperacao_userId_idx" ON "TokenRecuperacao"("userId");

-- CreateIndex
CREATE INDEX "TentativaLogin_chave_criadaEm_idx" ON "TentativaLogin"("chave", "criadaEm");

-- CreateIndex
CREATE UNIQUE INDEX "Pai_userId_key" ON "Pai"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Motorista_userId_key" ON "Motorista"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MotoristaEscola_motoristaId_escolaId_key" ON "MotoristaEscola"("motoristaId", "escolaId");

-- CreateIndex
CREATE UNIQUE INDEX "Assinatura_motoristaId_key" ON "Assinatura"("motoristaId");

-- AddForeignKey
ALTER TABLE "Admin" ADD CONSTRAINT "Admin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sessao" ADD CONSTRAINT "Sessao_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TokenRecuperacao" ADD CONSTRAINT "TokenRecuperacao_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pai" ADD CONSTRAINT "Pai_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Filho" ADD CONSTRAINT "Filho_paiId_fkey" FOREIGN KEY ("paiId") REFERENCES "Pai"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Filho" ADD CONSTRAINT "Filho_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "Escola"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Motorista" ADD CONSTRAINT "Motorista_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Veiculo" ADD CONSTRAINT "Veiculo_motoristaId_fkey" FOREIGN KEY ("motoristaId") REFERENCES "Motorista"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MotoristaEscola" ADD CONSTRAINT "MotoristaEscola_motoristaId_fkey" FOREIGN KEY ("motoristaId") REFERENCES "Motorista"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MotoristaEscola" ADD CONSTRAINT "MotoristaEscola_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "Escola"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assinatura" ADD CONSTRAINT "Assinatura_motoristaId_fkey" FOREIGN KEY ("motoristaId") REFERENCES "Motorista"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_paiId_fkey" FOREIGN KEY ("paiId") REFERENCES "Pai"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_filhoId_fkey" FOREIGN KEY ("filhoId") REFERENCES "Filho"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_motoristaId_fkey" FOREIGN KEY ("motoristaId") REFERENCES "Motorista"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Avaliacao" ADD CONSTRAINT "Avaliacao_motoristaId_fkey" FOREIGN KEY ("motoristaId") REFERENCES "Motorista"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

