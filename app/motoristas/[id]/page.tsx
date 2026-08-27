import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Star, ShieldCheck, Car, School, Users } from "lucide-react";
import { db } from "../../../lib/db";
import { getSession } from "../../../lib/auth";
import { Logo } from "../../../components/logo";
import { Avatar, AvatarFallback, AvatarImage } from "../../../components/ui/avatar";
import { Badge } from "../../../components/ui/badge";
import { WhatsappButton } from "../../../components/whatsapp-button";
import { FotoGaleria } from "../../../components/foto-galeria";

function iniciais(nome: string): string {
  return nome.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
}

function primeiroNome(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  return partes.length > 1 ? `${partes[0]} ${partes[1][0]}.` : partes[0];
}

function formatarReais(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/**
 * Perfil público do motorista — sem sessão, acessível direto da busca
 * (/pai) antes mesmo do pai pedir contato. Só o que uma família precisa
 * ver: fotos, avaliações, veículo, escolas atendidas, faixa de preço.
 * Nada de CNH, documento, telefone ou e-mail — isso é privado (ver
 * /admin/motoristas/[id] pro equivalente interno).
 */
export default async function PerfilMotoristaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const motorista = await db.motorista.findUnique({
    where: { id },
    include: {
      user: { select: { nome: true, ativo: true, telefone: true } },
      veiculos: true,
      escolas: { include: { escola: true } },
      avaliacoes: {
        where: { moderado: true },
        orderBy: { createdAt: "desc" },
        include: { pai: { include: { user: { select: { nome: true } } } } },
      },
    },
  });

  if (!motorista || motorista.statusAprovacao !== "APROVADO" || !motorista.user.ativo) notFound();

  const notaMedia =
    motorista.avaliacoes.length > 0
      ? motorista.avaliacoes.reduce((s, a) => s + a.nota, 0) / motorista.avaliacoes.length
      : null;

  const galeria = [motorista.fotoRosto, ...motorista.fotos].filter((f): f is string => !!f);

  // WhatsApp só aparece aqui se o pai logado já tiver um lead de verdade
  // com esse motorista (não faz sentido mostrar cadeado pra quem é
  // estranho ainda) — e só libera de fato depois da primeira fatura paga,
  // mesma regra do chat (ver components/whatsapp-button.tsx).
  const session = await getSession();
  let leadComEssePai: { contrato: { cobrancas: { paga: boolean }[] } | null } | null = null;
  if (session?.role === "PAI") {
    const pai = await db.pai.findUnique({ where: { userId: session.userId }, select: { id: true } });
    if (pai) {
      leadComEssePai = await db.lead.findFirst({
        where: { paiId: pai.id, motoristaId: motorista.id },
        include: { contrato: { include: { cobrancas: { select: { paga: true } } } } },
      });
    }
  }
  const whatsappLiberado = leadComEssePai?.contrato?.cobrancas.some((c) => c.paga) ?? false;

  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-cream-line bg-white px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link href="/pai" className="flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-navy">
            <ArrowLeft className="h-4 w-4" /> Buscar
          </Link>
          <Logo on="light" size="sm" />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-cream-line bg-white p-6">
          <Avatar className="h-20 w-20 shrink-0">
            {motorista.fotoRosto && <AvatarImage src={motorista.fotoRosto} alt={motorista.user.nome} />}
            <AvatarFallback className="bg-navy text-xl font-bold text-white">{iniciais(motorista.user.nome)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-serif text-2xl text-navy">{motorista.user.nome}</h1>
              <Badge className="gap-1 border-transparent bg-sage-soft text-[11px] font-semibold text-sage">
                <ShieldCheck className="h-3 w-3" /> Verificado
              </Badge>
            </div>
            <p className="mt-1 text-sm text-ink-soft">
              {motorista.anosExperiencia} anos de experiência · {motorista.temMonitor ? "Com monitor" : "Sem monitor"}
            </p>
            {notaMedia && (
              <p className="mt-1 flex items-center gap-1 text-sm">
                <Star className="h-4 w-4 fill-amber text-amber" />
                <span className="font-semibold text-navy">{notaMedia.toFixed(1)}</span>
                <span className="text-ink-soft">({motorista.avaliacoes.length} avaliações)</span>
              </p>
            )}
            {motorista.precoMin && motorista.precoMax && (
              <p className="mt-1 text-sm text-ink-soft">
                Faixa de preço: <strong className="text-navy">{formatarReais(motorista.precoMin)} – {formatarReais(motorista.precoMax)}</strong>
              </p>
            )}
          </div>
          {leadComEssePai && <WhatsappButton telefone={motorista.user.telefone} liberado={whatsappLiberado} />}
        </div>

        {motorista.bio && (
          <div className="mt-6 rounded-2xl border border-cream-line bg-white p-5">
            <h2 className="font-serif text-lg text-navy">Sobre</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm text-ink-soft">{motorista.bio}</p>
          </div>
        )}

        <FotoGaleria fotos={galeria} />

        {motorista.videoUrl && (
          <video controls className="mt-4 w-full rounded-2xl border border-cream-line">
            <source src={motorista.videoUrl} />
          </video>
        )}

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <section className="rounded-2xl border border-cream-line bg-white p-5">
            <h2 className="flex items-center gap-1.5 font-serif text-lg text-navy">
              <Car className="h-4 w-4" /> Veículo
            </h2>
            {motorista.veiculos.length === 0 ? (
              <p className="mt-2 text-sm text-ink-soft">Nenhum veículo cadastrado.</p>
            ) : (
              <ul className="mt-2 space-y-1.5">
                {motorista.veiculos.map((v) => (
                  <li key={v.id} className="text-sm text-ink-soft">
                    {v.modelo} · {v.capacidade} crianças
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-2xl border border-cream-line bg-white p-5">
            <h2 className="flex items-center gap-1.5 font-serif text-lg text-navy">
              <School className="h-4 w-4" /> Escolas atendidas
            </h2>
            {motorista.escolas.length === 0 ? (
              <p className="mt-2 text-sm text-ink-soft">Nenhuma escola vinculada ainda.</p>
            ) : (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {motorista.escolas.map((me) => (
                  <span key={me.id} className="rounded-full bg-sage-soft px-3 py-1 text-xs font-semibold text-sage">
                    {me.escola.nome}
                  </span>
                ))}
              </div>
            )}
          </section>
        </div>

        <section className="mt-6 rounded-2xl border border-cream-line bg-white p-5">
          <h2 className="flex items-center gap-1.5 font-serif text-lg text-navy">
            <Users className="h-4 w-4" /> Avaliações de famílias
          </h2>
          {motorista.avaliacoes.length === 0 ? (
            <p className="mt-2 text-sm text-ink-soft">Nenhuma avaliação ainda.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {motorista.avaliacoes.map((a) => (
                <li key={a.id} className="rounded-xl border border-cream-line px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-navy">{primeiroNome(a.pai.user.nome)}</p>
                    <div className="flex items-center gap-0.5 text-amber">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-3.5 w-3.5 ${i < a.nota ? "fill-amber" : "text-cream-line"}`} />
                      ))}
                    </div>
                  </div>
                  {a.comentario && <p className="mt-1.5 text-sm text-ink-soft">{a.comentario}</p>}
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
