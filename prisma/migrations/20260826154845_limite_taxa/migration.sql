-- CreateTable
CREATE TABLE "LimiteTaxa" (
    "id" TEXT NOT NULL,
    "escopo" TEXT NOT NULL,
    "chave" TEXT NOT NULL,
    "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LimiteTaxa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LimiteTaxa_escopo_chave_criadaEm_idx" ON "LimiteTaxa"("escopo", "chave", "criadaEm");
