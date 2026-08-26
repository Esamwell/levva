import { redirect } from "next/navigation";
import { Wallet } from "lucide-react";
import { db } from "../../../lib/db";
import { exigirPapel } from "../../../lib/auth";
import { StatCard } from "../../../components/stat-card";
import SaquesList from "./saques-list";

function formatarReais(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function SaquesPage() {
  const session = await exigirPapel("ADMIN");
  if (!session) redirect("/entrar");

  const saques = await db.solicitacaoSaque.findMany({
    orderBy: { createdAt: "desc" },
    include: { motorista: { select: { id: true, user: { select: { nome: true } } } } },
  });

  const pendentes = saques.filter((s) => s.status === "PENDENTE");
  const totalPendenteCentavos = pendentes.reduce((s, sq) => s + sq.valorCentavos, 0);

  return (
    <div>
      <h1 className="font-serif text-3xl text-navy">Saques</h1>
      <p className="mt-1 text-sm text-ink-soft">
        O motorista pede quando quiser sacar o que já foi pago pelo pai via Asaas. O Pix é manual,
        fora do Asaas — marca como pago depois de transferir.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard icon={Wallet} label="Saques pendentes" value={String(pendentes.length)} />
        <StatCard icon={Wallet} label="Valor pendente" value={formatarReais(totalPendenteCentavos)} />
      </div>

      <SaquesList
        saques={saques.map((s) => ({
          id: s.id,
          valorCentavos: s.valorCentavos,
          status: s.status,
          createdAt: s.createdAt.toISOString(),
          pagoEm: s.pagoEm?.toISOString() ?? null,
          motoristaId: s.motorista.id,
          motoristaNome: s.motorista.user.nome,
        }))}
      />
    </div>
  );
}
