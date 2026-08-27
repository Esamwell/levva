import { redirect } from "next/navigation";
import { MessageSquare, Clock, CheckCircle2 } from "lucide-react";
import { db } from "../../../lib/db";
import { exigirPapel } from "../../../lib/auth";
import { StatCard } from "../../../components/stat-card";
import DepoimentosList from "./depoimentos-list";

export default async function DepoimentosPage() {
  const session = await exigirPapel("ADMIN");
  if (!session) redirect("/entrar");

  const avaliacoes = await db.avaliacao.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      motorista: { select: { id: true, user: { select: { nome: true } } } },
      pai: { select: { id: true, user: { select: { nome: true } } } },
    },
  });

  const pendentes = avaliacoes.filter((a) => !a.moderado).length;

  return (
    <div>
      <h1 className="font-serif text-3xl text-navy">Depoimentos</h1>
      <p className="mt-1 text-sm text-ink-soft">Avaliações enviadas pelas famílias após a contratação do transporte.</p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={MessageSquare} label="Total" value={String(avaliacoes.length)} />
        <StatCard icon={Clock} label="Pendentes de aprovação" value={String(pendentes)} />
        <StatCard icon={CheckCircle2} label="Publicados" value={String(avaliacoes.length - pendentes)} />
      </div>

      <DepoimentosList
        avaliacoes={avaliacoes.map((a) => ({
          id: a.id,
          nota: a.nota,
          comentario: a.comentario,
          moderado: a.moderado,
          createdAt: a.createdAt.toISOString(),
          motoristaId: a.motorista.id,
          motoristaNome: a.motorista.user.nome,
          paiId: a.pai.id,
          paiNome: a.pai.user.nome,
        }))}
      />
    </div>
  );
}
