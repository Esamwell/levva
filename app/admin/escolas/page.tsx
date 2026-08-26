import { redirect } from "next/navigation";
import { School } from "lucide-react";
import { db } from "../../../lib/db";
import { exigirPapel } from "../../../lib/auth";
import { StatCard } from "../../../components/stat-card";
import EscolasList from "./escolas-list";

export default async function EscolasPage() {
  const session = await exigirPapel("ADMIN");
  if (!session) redirect("/entrar");

  const escolas = await db.escola.findMany({
    orderBy: { nome: "asc" },
    include: {
      _count: { select: { filhos: true, transportadores: true } },
    },
  });

  return (
    <div>
      <h1 className="font-serif text-3xl text-navy">Escolas</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Toda escola que aparece na busca do pai precisa estar aqui — antes só dava pra adicionar rodando um script na VPS.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={School} label="Escolas cadastradas" value={String(escolas.length)} />
      </div>

      <EscolasList
        escolas={escolas.map((e) => ({
          id: e.id,
          nome: e.nome,
          bairro: e.bairro,
          cidade: e.cidade,
          lat: e.lat,
          lng: e.lng,
          filhos: e._count.filhos,
          transportadores: e._count.transportadores,
        }))}
      />
    </div>
  );
}
