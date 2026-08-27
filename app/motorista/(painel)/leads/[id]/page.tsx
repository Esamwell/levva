import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, School, Phone } from "lucide-react";
import { exigirPapel } from "../../../../../lib/auth";
import { db } from "../../../../../lib/db";
import { StatusBadge } from "../../../../../components/status-badge";
import { LeadThread } from "../../../../../components/lead-thread";

function formatarReais(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function LeadMotoristaPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await exigirPapel("MOTORISTA");
  if (!session) redirect("/entrar");

  const { id } = await params;

  const motorista = await db.motorista.findUnique({ where: { userId: session.userId }, select: { id: true } });
  if (!motorista) redirect("/entrar");

  const lead = await db.lead.findUnique({
    where: { id },
    include: {
      pai: { include: { user: { select: { nome: true, telefone: true } } } },
      filho: { include: { escola: true } },
      mensagens: {
        orderBy: { createdAt: "asc" },
        include: { autor: { select: { nome: true } }, cobranca: { select: { id: true, valorCentavos: true, competencia: true, paga: true } } },
      },
    },
  });

  if (!lead || lead.motoristaId !== motorista.id) notFound();

  const telefoneLimpo = lead.pai.user.telefone?.replace(/\D/g, "");

  return (
    <div>
      <Link href="/motorista" className="flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-navy">
        <ArrowLeft className="h-4 w-4" />
        Leads
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cream-line bg-white p-5">
        <div>
          <h1 className="font-serif text-2xl text-navy">{lead.pai.user.nome}</h1>
          <p className="flex items-center gap-1.5 text-sm text-ink-soft">
            <School className="h-3.5 w-3.5" /> {lead.filho.nome} · {lead.filho.escola.nome}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={lead.status} />
          {telefoneLimpo && (
            <a
              href={`https://wa.me/${telefoneLimpo}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-full border border-sage-soft px-3 py-1.5 text-xs font-semibold text-sage hover:bg-sage-soft/40"
            >
              <Phone className="h-3.5 w-3.5" /> WhatsApp
            </a>
          )}
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
              label: m.autorId === session.userId ? "Você" : lead.pai.user.nome,
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
