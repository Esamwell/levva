-- AlterTable
ALTER TABLE "Pai" ADD COLUMN     "cpfCnpj" TEXT,
ADD COLUMN     "asaasCustomerId" TEXT;

-- AlterTable
ALTER TABLE "Cobranca" ADD COLUMN     "asaasPaymentId" TEXT,
ADD COLUMN     "linkPagamento" TEXT,
ADD COLUMN     "paga" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "pagaEm" TIMESTAMP(3),
ADD COLUMN     "repassadoMotorista" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "repassadoEm" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ConfiguracaoAsaas" ADD COLUMN     "webhookTokenCifrada" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Cobranca_asaasPaymentId_key" ON "Cobranca"("asaasPaymentId");
