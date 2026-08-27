-- DropForeignKey
ALTER TABLE "LeadMensagem" DROP CONSTRAINT "LeadMensagem_autorId_fkey";

-- AlterTable
ALTER TABLE "Motorista" ADD COLUMN     "bio" TEXT;

-- AddForeignKey
ALTER TABLE "LeadMensagem" ADD CONSTRAINT "LeadMensagem_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
