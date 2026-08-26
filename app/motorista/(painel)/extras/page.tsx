import { redirect } from "next/navigation";
import { exigirPapel } from "../../../../lib/auth";
import { db } from "../../../../lib/db";
import { DESTAQUE_PRECO_CENTAVOS } from "../../../../lib/financeiro";
import DestaqueCard from "./destaque-card";
import FotosVideoCard from "./fotos-video-card";
import { MapPin } from "lucide-react";

export default async function ExtrasMotoristaPage() {
  const session = await exigirPapel("MOTORISTA");
  if (!session) redirect("/entrar");

  const motorista = await db.motorista.findUnique({ where: { userId: session.userId }, select: { id: true } });
  if (!motorista) redirect("/entrar");

  const destaque = await db.motoristaExtra.findFirst({
    where: { motoristaId: motorista.id, tipo: "DESTAQUE", status: { in: ["PENDENTE", "ATIVO"] } },
  });

  return (
    <div>
      <h1 className="font-serif text-3xl text-navy">Impulsione seu perfil</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Sem mensalidade obrigatória pra estar na Mova. Estes são serviços opcionais pra quem quer se destacar e
        atender mais famílias.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <DestaqueCard
          status={destaque?.status === "PENDENTE" || destaque?.status === "ATIVO" ? destaque.status : null}
          valorCentavos={DESTAQUE_PRECO_CENTAVOS}
        />
        <FotosVideoCard />

        <div className="rounded-2xl border border-dashed border-cream-line bg-white p-5 opacity-70">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cream text-ink-soft">
            <MapPin className="h-4 w-4" strokeWidth={1.75} />
          </div>
          <p className="mt-3 font-serif text-lg text-navy">Rastreador</p>
          <p className="mt-1 text-sm text-ink-soft">
            Pra família acompanhar o trajeto do filho em tempo real. Em análise — em breve por aqui.
          </p>
        </div>
      </div>
    </div>
  );
}
