import { exigirPapel } from "../../../../lib/auth";
import { db } from "../../../../lib/db";
import { redirect } from "next/navigation";
import PerfilForm from "./perfil-form";
import MidiaForm from "./midia-form";

export default async function PerfilMotoristaPage() {
  const session = await exigirPapel("MOTORISTA");
  if (!session) redirect("/entrar");

  const motorista = await db.motorista.findUnique({
    where: { userId: session.userId },
    include: { escolas: { include: { escola: true } } },
  });
  if (!motorista) redirect("/entrar");

  return (
    <div>
      <h1 className="font-serif text-3xl text-navy">Meu perfil público</h1>
      <p className="mt-2 text-ink-soft">É isso que as famílias veem antes de decidir.</p>

      {motorista.statusAprovacao !== "APROVADO" && (
        <div className="mt-6 rounded-xl border border-amber bg-amber-soft/30 px-4 py-3 text-sm text-navy">
          Seus documentos ainda estão em análise. Assim que forem aprovados, seu
          perfil passa a aparecer nas buscas dos pais.
        </div>
      )}

      <PerfilForm
        motorista={{
          anosExperiencia: motorista.anosExperiencia,
          temMonitor: motorista.temMonitor,
          precoMin: motorista.precoMin,
          precoMax: motorista.precoMax,
          escolas: motorista.escolas.map((e) => ({ id: e.escola.id, nome: e.escola.nome })),
          pagadorTaxaPadrao: motorista.pagadorTaxaPadrao,
          bio: motorista.bio,
        }}
      />
      <MidiaForm fotos={motorista.fotos} videoUrl={motorista.videoUrl} />
    </div>
  );
}
