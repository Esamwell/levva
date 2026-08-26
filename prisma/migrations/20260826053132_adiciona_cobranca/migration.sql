-- CreateTable
CREATE TABLE "Cobranca" (
    "id" TEXT NOT NULL,
    "contratoId" TEXT NOT NULL,
    "competencia" TIMESTAMP(3) NOT NULL,
    "valorCentavos" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cobranca_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Cobranca" ADD CONSTRAINT "Cobranca_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "Contrato"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
