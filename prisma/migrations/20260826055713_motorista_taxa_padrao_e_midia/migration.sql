-- AlterTable
ALTER TABLE "Motorista" ADD COLUMN     "fotos" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "pagadorTaxaPadrao" "PagadorTaxa" NOT NULL DEFAULT 'MOTORISTA',
ADD COLUMN     "videoUrl" TEXT;
