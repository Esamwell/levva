import { exigirPapel } from "../../../../lib/auth";
import { db } from "../../../../lib/db";
import { redirect } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../../../components/ui/tabs";
import PerfilForm from "./perfil-form";
import MidiaForm from "./midia-form";
import AreasAtendimentoForm from "./areas-form";

const ABA_TRIGGER =
  "rounded-full px-4 py-2 text-sm font-semibold text-ink-soft data-[state=active]:bg-navy data-[state=active]:text-white data-[state=active]:shadow-none";

export default async function PerfilMotoristaPage() {
  const session = await exigirPapel("MOTORISTA");
  if (!session) redirect("/entrar");

  const motorista = await db.motorista.findUnique({
    where: { userId: session.userId },
    include: {
      escolas: { include: { escola: true } },
      areasAtendimento: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!motorista) redirect("/entrar");

  return (
    <div>
      <h1 className="font-serif text-3xl text-navy">Meu perfil público</h1>
      <p className="mt-2 text-ink-soft">As informações que as famílias veem ao avaliar o seu perfil.</p>

      {motorista.statusAprovacao !== "APROVADO" && (
        <div className="mt-6 rounded-xl border border-amber bg-amber-soft/30 px-4 py-3 text-sm text-navy">
          Seus documentos ainda estão em análise. Assim que forem aprovados, seu
          perfil passa a aparecer nas buscas dos pais.
        </div>
      )}

      <Tabs defaultValue="sobre" className="mt-8">
        <TabsList className="h-auto flex-wrap gap-1.5 rounded-full bg-cream p-1.5">
          <TabsTrigger value="sobre" className={ABA_TRIGGER}>Sobre você</TabsTrigger>
          <TabsTrigger value="fotos" className={ABA_TRIGGER}>Fotos e vídeo</TabsTrigger>
          <TabsTrigger value="area" className={ABA_TRIGGER}>Área de atendimento</TabsTrigger>
        </TabsList>

        <TabsContent value="sobre" className="mt-6">
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
        </TabsContent>

        <TabsContent value="fotos" className="mt-6">
          <MidiaForm fotos={motorista.fotos} videoUrl={motorista.videoUrl} />
        </TabsContent>

        <TabsContent value="area" className="mt-6">
          <AreasAtendimentoForm
            areas={motorista.areasAtendimento.map((a) => ({ id: a.id, nome: a.nome, lat: a.lat, lng: a.lng, raioKm: a.raioKm }))}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
