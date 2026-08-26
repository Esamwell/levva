-- CreateEnum
CREATE TYPE "StatusTicket" AS ENUM ('ABERTO', 'RESPONDIDO', 'FECHADO');

-- CreateTable
CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    "assunto" TEXT NOT NULL,
    "status" "StatusTicket" NOT NULL DEFAULT 'ABERTO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketMensagem" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    "corpo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketMensagem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketMensagem" ADD CONSTRAINT "TicketMensagem_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketMensagem" ADD CONSTRAINT "TicketMensagem_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
