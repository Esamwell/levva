-- CreateEnum
CREATE TYPE "AmbienteAsaas" AS ENUM ('SANDBOX', 'PRODUCAO');

-- CreateTable
CREATE TABLE "ConfiguracaoAsaas" (
    "id" TEXT NOT NULL DEFAULT 'asaas',
    "apiKeyCifrada" TEXT,
    "ambiente" "AmbienteAsaas" NOT NULL DEFAULT 'SANDBOX',
    "contaNome" TEXT,
    "contaEmail" TEXT,
    "testadoEm" TIMESTAMP(3),
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfiguracaoAsaas_pkey" PRIMARY KEY ("id")
);
