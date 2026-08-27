import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { db } from "../../../lib/db";
import { exigirPapel } from "../../../lib/auth";
import AprovacoesList from "./aprovacoes-list";
import { EmptyState } from "../../../components/empty-state";

export default async function AprovacoesPage() {
  if (!(await exigirPapel("ADMIN"))) redirect("/entrar");

  const pendentes = await db.motorista.findMany({
    where: { statusAprovacao: "PENDENTE" },
    include: { user: true, veiculos: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div>
      <h1 className="font-serif text-3xl text-navy">Aprovações pendentes</h1>
      <p className="mt-2 text-ink-soft">
        Revise CNH, curso de transporte escolar e antecedentes antes de aprovar o cadastro.
      </p>

      {pendentes.length === 0 ? (
        <div className="mt-8">
          <EmptyState icon={ShieldCheck} title="Nenhum cadastro pendente" description="Assim que um motorista se cadastrar, o pedido aparece aqui pra revisão." />
        </div>
      ) : (
        <AprovacoesList
          motoristas={pendentes.map((m) => ({
            id: m.id,
            nome: m.user.nome,
            telefone: m.user.telefone,
            cnhNumero: m.cnhNumero,
            cnhCategoria: m.cnhCategoria,
            cnhDocUrl: m.cnhDocUrl,
            cursoDocUrl: m.cursoDocUrl,
            antecedentesDocUrl: m.antecedentesDocUrl,
            veiculos: m.veiculos.map((v) => ({ placa: v.placa, modelo: v.modelo })),
          }))}
        />
      )}
    </div>
  );
}
