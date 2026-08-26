-- CreateEnum
CREATE TYPE "Periodicidade" AS ENUM ('MENSAL', 'TRIMESTRAL', 'ANUAL');

-- CreateEnum
CREATE TYPE "PagadorTaxa" AS ENUM ('MOTORISTA', 'PAI');

-- CreateTable
CREATE TABLE "Contrato" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "motoristaId" TEXT NOT NULL,
    "paiId" TEXT NOT NULL,
    "valorCentavos" INTEGER NOT NULL,
    "periodicidade" "Periodicidade" NOT NULL,
    "taxaPercentual" INTEGER NOT NULL,
    "pagadorTaxa" "PagadorTaxa" NOT NULL,
    "taxaCentavos" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Contrato_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Contrato_leadId_key" ON "Contrato"("leadId");

-- AddForeignKey
ALTER TABLE "Contrato" ADD CONSTRAINT "Contrato_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contrato" ADD CONSTRAINT "Contrato_motoristaId_fkey" FOREIGN KEY ("motoristaId") REFERENCES "Motorista"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contrato" ADD CONSTRAINT "Contrato_paiId_fkey" FOREIGN KEY ("paiId") REFERENCES "Pai"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
