import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, School, UserRound } from "lucide-react";
import { exigirPapel } from "../../../../lib/auth";
import { db } from "../../../../lib/db";
import { StatusBadge } from "../../../../components/status-badge";
import { LeadThread } from "../../../../components/lead-thread";
import { WhatsappButton } from "../../../../components/whatsapp-button";

function formatarReais(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function LeadPaiPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await exigirPapel("PAI");
  if (!session) redirect("/entrar");

  const { id } = await params;

  const pai = await db.pai.findUnique({ where: { userId: session.userId }, select: { id: true } });
  if (!pai) redirect("/entrar");

  const lead = await db.lead.findUnique({
    where: { id },
    include: {
      motorista: { include: { user: { select: { nome: true, telefone: true } } } },
      filho: { include: { escola: true } },
      contrato: { include: { cobrancas: { select: { paga: true } } } },
      mensagens: {
        orderBy: { createdAt: "asc" },
        include: { cobranca: { select: { id: true, valorCentavos: true, competencia: true, paga: true } } },
      },
    },
  });

  if (!lead || lead.paiId !== pai.id) notFound();

  const whatsappLiberado = lead.contrato?.cobrancas.some((c) => c.paga) ?? false;

  return (
    <div>
      <Link href="/pai/dashboard" className="flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-navy">
        <ArrowLeft className="h-4 w-4" />
        Minhas solicitações
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cream-line bg-white p-5">
        <div>
          <h1 className="font-serif text-2xl text-navy">{lead.motorista.user.nome}</h1>
          <p className="flex items-center gap-1.5 text-sm text-ink-soft">
            <School className="h-3.5 w-3.5" /> {lead.filho.nome} · {lead.filho.escola.nome}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={lead.status} />
          <Link
            href={`/motoristas/${lead.motoristaId}`}
            target="_blank"
            className="flex items-center gap-1.5 rounded-full border border-cream-line px-3 py-1.5 text-xs font-semibold text-ink-soft hover:border-amber hover:text-navy"
          >
            <UserRound className="h-3.5 w-3.5" /> Ver perfil
          </Link>
          <WhatsappButton telefone={lead.motorista.user.telefone} liberado={whatsappLiberado} />
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-cream-line bg-white p-5">
        <h2 className="font-serif text-lg text-navy">Conversa</h2>
        <div className="mt-4">
          <LeadThread
            leadId={lead.id}
            mensagens={lead.mensagens.map((m) => ({
              id: m.id,
              corpo: m.corpo,
              createdAt: m.createdAt.toISOString(),
              mine: m.autorId === session.userId,
              label: m.autorId === session.userId ? "Você" : lead.motorista.user.nome,
              cobranca: m.cobranca
                ? {
                    id: m.cobranca.id,
                    valorFormatado: formatarReais(m.cobranca.valorCentavos),
                    vencimentoFormatado: m.cobranca.competencia.toLocaleDateString("pt-BR"),
                    paga: m.cobranca.paga,
                  }
                : null,
            }))}
          />
        </div>
      </div>
    </div>
  );
}
