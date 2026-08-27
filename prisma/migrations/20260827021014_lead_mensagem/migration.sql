-- CreateTable
CREATE TABLE "LeadMensagem" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    "corpo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadMensagem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LeadMensagem_leadId_createdAt_idx" ON "LeadMensagem"("leadId", "createdAt");

-- AddForeignKey
ALTER TABLE "LeadMensagem" ADD CONSTRAINT "LeadMensagem_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadMensagem" ADD CONSTRAINT "LeadMensagem_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
