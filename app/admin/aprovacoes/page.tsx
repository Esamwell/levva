import { redirect } from "next/navigation";
import { db } from "../../../lib/db";
import { exigirPapel } from "../../../lib/auth";
import AprovacoesList from "./aprovacoes-list";

export default async function AprovacoesPage() {
  if (!(await exigirPapel("ADMIN"))) redirect("/entrar");

  const pendentes = await db.motorista.findMany({
    where: { statusAprovacao: "PENDENTE" },
    include: { user: true, veiculos: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div>
      <h1 className="font-serif text-3xl">Aprovações pendentes</h1>
      <p className="mt-2 text-white/60">
        Confira CNH, curso de transporte escolar e antecedentes antes de aprovar.
      </p>

      {pendentes.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-white/15 p-10 text-center text-white/50">
          Nenhum cadastro pendente no momento.
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
