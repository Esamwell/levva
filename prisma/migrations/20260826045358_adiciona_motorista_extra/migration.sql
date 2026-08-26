-- CreateEnum
CREATE TYPE "StatusExtra" AS ENUM ('ATIVO', 'CANCELADO');

-- CreateTable
CREATE TABLE "MotoristaExtra" (
    "id" TEXT NOT NULL,
    "motoristaId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "valorCentavos" INTEGER NOT NULL,
    "periodicidade" "Periodicidade" NOT NULL,
    "status" "StatusExtra" NOT NULL DEFAULT 'ATIVO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "canceladoEm" TIMESTAMP(3),

    CONSTRAINT "MotoristaExtra_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MotoristaExtra" ADD CONSTRAINT "MotoristaExtra_motoristaId_fkey" FOREIGN KEY ("motoristaId") REFERENCES "Motorista"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
