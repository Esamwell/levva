import { redirect } from "next/navigation";
import { exigirPapel } from "../../../../lib/auth";
import { db } from "../../../../lib/db";
import DocumentosForm from "./documentos-form";

export default async function DocumentosMotoristaPage() {
  const session = await exigirPapel("MOTORISTA");
  if (!session) redirect("/entrar");

  const motorista = await db.motorista.findUnique({
    where: { userId: session.userId },
    select: { cnhDocUrl: true, cursoDocUrl: true, antecedentesDocUrl: true, statusAprovacao: true },
  });
  if (!motorista) redirect("/entrar");

  return (
    <div>
      <h1 className="font-serif text-3xl text-navy">Documentos</h1>
      <p className="mt-1 text-sm text-ink-soft">
        CNH, curso de transporte escolar e antecedentes criminais. Atualize aqui quando vencer.
      </p>

      <DocumentosForm
        statusAprovacao={motorista.statusAprovacao}
        documentos={{
          cnh: motorista.cnhDocUrl,
          "curso-transporte": motorista.cursoDocUrl,
          antecedentes: motorista.antecedentesDocUrl,
        }}
      />
    </div>
  );
}
