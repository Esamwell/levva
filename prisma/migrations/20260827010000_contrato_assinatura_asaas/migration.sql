-- AlterTable
ALTER TABLE "Contrato" ADD COLUMN     "asaasSubscriptionId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Contrato_asaasSubscriptionId_key" ON "Contrato"("asaasSubscriptionId");
