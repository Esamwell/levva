-- AlterTable: autor vira opcional (mensagem automática de cobrança não tem autor humano)
ALTER TABLE "LeadMensagem" ALTER COLUMN "autorId" DROP NOT NULL;

-- AlterTable: vincula a mensagem automática à cobrança que ela anuncia
ALTER TABLE "LeadMensagem" ADD COLUMN "cobrancaId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "LeadMensagem_cobrancaId_key" ON "LeadMensagem"("cobrancaId");

-- AddForeignKey
ALTER TABLE "LeadMensagem" ADD CONSTRAINT "LeadMensagem_cobrancaId_fkey" FOREIGN KEY ("cobrancaId") REFERENCES "Cobranca"("id") ON DELETE SET NULL ON UPDATE CASCADE;
