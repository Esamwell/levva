import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, School, MapPin, Check } from "lucide-react";
import { exigirPapel } from "../../../../../lib/auth";
import { db } from "../../../../../lib/db";
import { proximoVencimento } from "../../../../../lib/financeiro";
import { Avatar, AvatarFallback } from "../../../../../components/ui/avatar";
import { WhatsappButton } from "../../../../../components/whatsapp-button";

function iniciais(nome: string): string {
  return nome.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
}

function formatarReais(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const PERIODO_LABEL: Record<string, string> = { MENSAL: "mês", TRIMESTRAL: "trimestre", SEMESTRAL: "semestre", ANUAL: "ano" };

export default async function AlunoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await exigirPapel("MOTORISTA");
  if (!session) redirect("/entrar");

  const { id } = await params;

  const motorista = await db.motorista.findUnique({ where: { userId: session.userId }, select: { id: true } });
  if (!motorista) redirect("/entrar");

  const contrato = await db.contrato.findUnique({
    where: { id },
    include: {
      lead: { include: { filho: { include: { escola: true } } } },
      pai: { include: { user: { select: { nome: true, telefone: true } } } },
      cobrancas: { orderBy: { competencia: "desc" } },
    },
  });

  if (!contrato || contrato.motoristaId !== motorista.id) notFound();

  const whatsappLiberado = contrato.cobrancas.some((c) => c.paga);
  const liquido = contrato.pagadorTaxa === "MOTORISTA" ? contrato.valorCentavos - contrato.taxaCentavos : contrato.valorCentavos;
  const vencimento = proximoVencimento(contrato.periodicidade, contrato.cobrancas[0]?.competencia ?? contrato.createdAt);

  return (
    <div>
      <Link href="/motorista/alunos" className="flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-navy">
        <ArrowLeft className="h-4 w-4" />
        Meus alunos
      </Link>

      <div className="mt-4 flex items-center gap-4 rounded-2xl border border-cream-line bg-white p-5">
        <Avatar className="h-14 w-14 shrink-0">
          <AvatarFallback className="bg-navy text-lg font-bold text-white">{iniciais(contrato.lead.filho.nome)}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="font-serif text-2xl text-navy">{contrato.lead.filho.nome}</h1>
          <p className="flex items-center gap-1.5 text-sm text-ink-soft">
            <School className="h-3.5 w-3.5" /> {contrato.lead.filho.escola.nome}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-cream-line bg-white p-5">
          <h2 className="font-serif text-lg text-navy">Responsável</h2>
          <p className="mt-3 font-medium text-navy">{contrato.pai.user.nome}</p>
          {contrato.pai.endereco && (
            <p className="mt-1 flex items-start gap-1.5 text-sm text-ink-soft">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {contrato.pai.endereco}
            </p>
          )}
          <div className="mt-3">
            <WhatsappButton telefone={contrato.pai.user.telefone} liberado={whatsappLiberado} />
          </div>
        </section>

        <section className="rounded-2xl border border-cream-line bg-white p-5">
          <h2 className="font-serif text-lg text-navy">Contrato</h2>
          <div className="mt-3 space-y-1.5 text-sm">
            <p className="flex justify-between">
              <span className="text-ink-soft">Valor combinado</span>
              <span className="font-semibold text-navy">
                {formatarReais(contrato.valorCentavos)}/{PERIODO_LABEL[contrato.periodicidade]}
              </span>
            </p>
            <p className="flex justify-between">
              <span className="text-ink-soft">Você recebe</span>
              <span className="font-semibold text-sage">{formatarReais(liquido)}</span>
            </p>
            <p className="flex justify-between">
              <span className="text-ink-soft">Quem paga a taxa</span>
              <span className="font-semibold text-navy">{contrato.pagadorTaxa === "MOTORISTA" ? "Você" : "Família"}</span>
            </p>
            <p className="flex justify-between">
              <span className="text-ink-soft">Próximo vencimento</span>
              <span className="font-semibold text-navy">{vencimento.toLocaleDateString("pt-BR")}</span>
            </p>
            <p className="flex justify-between">
              <span className="text-ink-soft">Fechado em</span>
              <span className="font-semibold text-navy">{contrato.createdAt.toLocaleDateString("pt-BR")}</span>
            </p>
          </div>

          {contrato.cobrancas.length > 0 && (
            <>
              <h3 className="mt-4 border-t border-cream-line pt-4 text-xs font-semibold uppercase tracking-wide text-ink-soft">
                Histórico de recebimentos
              </h3>
              <ul className="mt-2 space-y-1.5">
                {contrato.cobrancas.map((c) => (
                  <li key={c.id} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 text-ink-soft">
                      <Check className="h-3.5 w-3.5 text-sage" /> {c.competencia.toLocaleDateString("pt-BR")}
                    </span>
                    <span className="font-medium text-navy">{formatarReais(c.valorCentavos)}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
