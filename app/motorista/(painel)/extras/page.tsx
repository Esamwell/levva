import { redirect } from "next/navigation";
import { exigirPapel } from "../../../../lib/auth";
import { db } from "../../../../lib/db";
import { PRECOS_PILOTO } from "../../../../lib/plano";
import DestaqueCard from "./destaque-card";
import FotosVideoCard from "./fotos-video-card";
import { MapPin } from "lucide-react";

export default async function ExtrasMotoristaPage() {
  const session = await exigirPapel("MOTORISTA");
  if (!session) redirect("/entrar");

  const motorista = await db.motorista.findUnique({
    where: { userId: session.userId },
    select: { destaqueAtivo: true },
  });
  if (!motorista) redirect("/entrar");

  return (
    <div>
      <h1 className="font-serif text-3xl text-navy">Extras</h1>
      <p className="mt-1 text-sm text-ink-soft">Serviços avulsos, sem mensalidade obrigatória — contrata quem quiser.</p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <DestaqueCard ativo={motorista.destaqueAtivo} valorCentavos={PRECOS_PILOTO.DESTAQUE} />
        <FotosVideoCard />

        <div className="rounded-2xl border border-dashed border-cream-line bg-white p-5 opacity-70">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cream text-ink-soft">
            <MapPin className="h-4 w-4" strokeWidth={1.75} />
          </div>
          <p className="mt-3 font-serif text-lg text-navy">Rastreador</p>
          <p className="mt-1 text-sm text-ink-soft">
            Pra família acompanhar o trajeto do filho em tempo real. Ainda em análise — em breve por aqui.
          </p>
        </div>
      </div>
    </div>
  );
}
