import { notFound } from "next/navigation";
import { db } from "../../../lib/db";
import { Logo } from "../../../components/logo";
import PagamentoClient from "./pagamento-client";

function formatarReais(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function PagarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const cobranca = await db.cobranca.findUnique({
    where: { id },
    include: {
      contrato: { include: { motorista: { include: { user: { select: { nome: true } } } } } },
    },
  });

  if (!cobranca || !cobranca.asaasPaymentId) notFound();

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-4 py-12">
      <div className="w-full max-w-sm">
        <Logo on="light" size="md" className="mb-6 justify-center" />
        <div className="rounded-2xl border border-cream-line bg-white p-6">
          <p className="text-center text-xs uppercase tracking-wide text-ink-soft">Cobrança do transporte</p>
          <p className="mt-1 text-center font-serif text-3xl text-navy">{formatarReais(cobranca.valorCentavos)}</p>
          <p className="mt-1 text-center text-sm text-ink-soft">
            {cobranca.contrato.motorista.user.nome} · vencimento em {cobranca.competencia.toLocaleDateString("pt-BR")}
          </p>

          <div className="mt-6">
            <PagamentoClient
              cobrancaId={cobranca.id}
              paga={cobranca.paga}
              linkPagamento={cobranca.linkPagamento}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
