import { redirect } from "next/navigation";
import { LifeBuoy, Clock, MessageCircle } from "lucide-react";
import { db } from "../../../lib/db";
import { exigirPapel } from "../../../lib/auth";
import { StatCard } from "../../../components/stat-card";
import SuporteList from "./suporte-list";

export default async function SuporteAdminPage() {
  const session = await exigirPapel("ADMIN");
  if (!session) redirect("/entrar");

  const tickets = await db.ticket.findMany({
    orderBy: { updatedAt: "desc" },
    include: { autor: { select: { nome: true, role: true } } },
  });

  const abertos = tickets.filter((t) => t.status === "ABERTO").length;

  return (
    <div>
      <h1 className="font-serif text-3xl text-navy">Suporte</h1>
      <p className="mt-1 text-sm text-ink-soft">Chamados abertos por pais e motoristas.</p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={LifeBuoy} label="Total de chamados" value={String(tickets.length)} />
        <StatCard icon={Clock} label="Aguardando resposta" value={String(abertos)} />
        <StatCard icon={MessageCircle} label="Respondidos ou encerrados" value={String(tickets.length - abertos)} />
      </div>

      <SuporteList
        tickets={tickets.map((t) => ({
          id: t.id,
          assunto: t.assunto,
          status: t.status,
          updatedAt: t.updatedAt.toISOString(),
          autorNome: t.autor.nome,
          autorRole: t.autor.role,
        }))}
      />
    </div>
  );
}
