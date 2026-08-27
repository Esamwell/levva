-- CreateTable
CREATE TABLE "AreaAtendimento" (
    "id" TEXT NOT NULL,
    "motoristaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "raioKm" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AreaAtendimento_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AreaAtendimento" ADD CONSTRAINT "AreaAtendimento_motoristaId_fkey" FOREIGN KEY ("motoristaId") REFERENCES "Motorista"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
