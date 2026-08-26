import { redirect } from "next/navigation";
import { Car } from "lucide-react";
import { db } from "../../../lib/db";
import { exigirPapel } from "../../../lib/auth";
import { EmptyState } from "../../../components/empty-state";
import MotoristasList from "./motoristas-list";

export default async function MotoristasPage() {
  if (!(await exigirPapel("ADMIN"))) redirect("/entrar");

  const motoristas = await db.motorista.findMany({
    include: { user: true, assinatura: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="font-serif text-3xl text-navy">Motoristas</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Todos os transportadores cadastrados, aprovados ou não.
      </p>

      {motoristas.length === 0 ? (
        <div className="mt-8">
          <EmptyState icon={Car} title="Nenhum motorista cadastrado ainda" />
        </div>
      ) : (
        <MotoristasList
          motoristas={motoristas.map((m) => ({
            id: m.id,
            nome: m.user.nome,
            email: m.user.email,
            telefone: m.user.telefone,
            ativo: m.user.ativo,
            statusAprovacao: m.statusAprovacao,
            plano: m.assinatura?.plano ?? null,
            statusAssinatura: m.assinatura?.status ?? null,
            createdAt: m.createdAt.toISOString(),
          }))}
        />
      )}
    </div>
  );
}
