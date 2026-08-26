-- CreateEnum
CREATE TYPE "StatusSaque" AS ENUM ('PENDENTE', 'PAGO');

-- CreateTable
CREATE TABLE "SolicitacaoSaque" (
    "id" TEXT NOT NULL,
    "motoristaId" TEXT NOT NULL,
    "valorCentavos" INTEGER NOT NULL,
    "status" "StatusSaque" NOT NULL DEFAULT 'PENDENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pagoEm" TIMESTAMP(3),

    CONSTRAINT "SolicitacaoSaque_pkey" PRIMARY KEY ("id")
);

-- AlterTable: substitui os campos de repasse por-cobrança (sem uso em produção
-- ainda, migração anterior no mesmo dia) pelo modelo de saldo/saque.
ALTER TABLE "Cobranca" DROP COLUMN "repassadoMotorista",
DROP COLUMN "repassadoEm",
ADD COLUMN     "solicitacaoSaqueId" TEXT;

-- AddForeignKey
ALTER TABLE "SolicitacaoSaque" ADD CONSTRAINT "SolicitacaoSaque_motoristaId_fkey" FOREIGN KEY ("motoristaId") REFERENCES "Motorista"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cobranca" ADD CONSTRAINT "Cobranca_solicitacaoSaqueId_fkey" FOREIGN KEY ("solicitacaoSaqueId") REFERENCES "SolicitacaoSaque"("id") ON DELETE SET NULL ON UPDATE CASCADE;
