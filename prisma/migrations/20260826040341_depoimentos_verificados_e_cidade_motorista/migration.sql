-- AlterTable: cidade coletada no cadastro, mas até aqui descartada
ALTER TABLE "Motorista" ADD COLUMN     "cidade" TEXT NOT NULL DEFAULT 'Salvador';

-- As únicas avaliações existentes são as 2 da seed de demonstração, sem
-- nenhum pai/solicitação real vinculado — não tem como preencher paiId/leadId
-- pra elas retroativamente. Ambiente ainda pré-lançamento, sem usuário real
-- usando o recurso: removidas aqui, e a seed passa a recriá-las já ligadas a
-- um lead fechado de verdade (ver prisma/seed-demo.ts).
DELETE FROM "Avaliacao";

-- AlterTable
ALTER TABLE "Avaliacao" ADD COLUMN     "paiId" TEXT NOT NULL,
ADD COLUMN     "leadId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Avaliacao_leadId_key" ON "Avaliacao"("leadId");

-- AddForeignKey
ALTER TABLE "Avaliacao" ADD CONSTRAINT "Avaliacao_paiId_fkey" FOREIGN KEY ("paiId") REFERENCES "Pai"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Avaliacao" ADD CONSTRAINT "Avaliacao_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
