import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Car, School, FileCheck, FileX, Star } from "lucide-react";
import { db } from "../../../../lib/db";
import { exigirPapel } from "../../../../lib/auth";
import { Avatar, AvatarFallback } from "../../../../components/ui/avatar";
import { Badge } from "../../../../components/ui/badge";
import { cn } from "../../../../lib/utils";
import MotoristaDetailActions from "./motorista-detail-actions";

function formatarReais(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function iniciais(nome: string): string {
  return nome.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
}

const APROVACAO_META = {
  PENDENTE: { label: "Pendente", className: "bg-amber-soft text-navy" },
  APROVADO: { label: "Aprovado", className: "bg-sage-soft text-sage" },
  REPROVADO: { label: "Reprovado", className: "bg-red-50 text-red-600" },
} as const;

export default async function MotoristaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await exigirPapel("ADMIN"))) redirect("/entrar");

  const { id } = await params;

  const motorista = await db.motorista.findUnique({
    where: { id },
    include: {
      user: true,
      veiculos: true,
      escolas: { include: { escola: true } },
      contratos: true,
      extras: { where: { status: { in: ["ATIVO", "PENDENTE"] } } },
      avaliacoes: { orderBy: { createdAt: "desc" }, take: 10 },
      leads: {
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { pai: { include: { user: true } }, filho: true },
      },
    },
  });

  if (!motorista) notFound();

  const docs = [
    { label: "CNH", url: motorista.cnhDocUrl },
    { label: "Curso de transporte escolar", url: motorista.cursoDocUrl },
    { label: "Antecedentes criminais", url: motorista.antecedentesDocUrl },
  ];

  const aprovacao = APROVACAO_META[motorista.statusAprovacao];
  const receitaGeradaCentavos = motorista.contratos.reduce((s, c) => s + c.taxaCentavos, 0);

  return (
    <div>
      <Link href="/admin/motoristas" className="flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-navy">
        <ArrowLeft className="h-4 w-4" />
        Motoristas
      </Link>

      <div className="mt-4 flex flex-col gap-4 rounded-2xl border border-cream-line bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14 shrink-0">
            <AvatarFallback className="bg-navy text-lg font-bold text-white">{iniciais(motorista.user.nome)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-serif text-2xl text-navy">{motorista.user.nome}</h1>
              <Badge variant="outline" className={cn("border-transparent font-semibold", aprovacao.className)}>
                {aprovacao.label}
              </Badge>
              {!motorista.user.ativo && (
                <Badge variant="outline" className="border-transparent bg-red-50 font-semibold text-red-600">
                  Conta desativada
                </Badge>
              )}
            </div>
            <p className="mt-0.5 text-sm text-ink-soft">
              {motorista.user.email}
              {motorista.user.telefone && ` · ${motorista.user.telefone}`}
            </p>
          </div>
        </div>
        <MotoristaDetailActions
          motoristaId={motorista.id}
          userId={motorista.userId}
          statusAprovacao={motorista.statusAprovacao}
          ativo={motorista.user.ativo}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-cream-line bg-white p-5">
            <h2 className="font-serif text-lg text-navy">Documentação</h2>
            <p className="mt-1 text-xs text-ink-soft">
              CNH {motorista.cnhCategoria} nº {motorista.cnhNumero}
            </p>
            <div className="mt-4 space-y-3">
              {docs.map((doc) => (
                <div key={doc.label} className="flex items-center justify-between gap-3 rounded-xl border border-cream-line px-4 py-3">
                  <span className="text-sm text-ink-soft">{doc.label}</span>
                  {doc.url ? (
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex shrink-0 items-center gap-1.5 rounded-full border border-sage-soft px-3 py-1.5 text-xs font-semibold text-sage hover:bg-sage-soft/40"
                    >
                      <FileCheck className="h-3.5 w-3.5" /> Abrir documento
                    </a>
                  ) : (
                    <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-cream-line px-3 py-1.5 text-xs font-semibold text-ink-soft/50">
                      <FileX className="h-3.5 w-3.5" /> Não enviado
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-cream-line bg-white p-5">
            <h2 className="font-serif text-lg text-navy">Veículos e escolas</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {motorista.veiculos.map((v) => (
                <span key={v.id} className="flex items-center gap-1.5 rounded-full bg-cream px-3 py-1.5 text-xs text-ink-soft">
                  <Car className="h-3.5 w-3.5" /> {v.modelo} ({v.placa}) · {v.capacidade} crianças
                </span>
              ))}
              {motorista.veiculos.length === 0 && <p className="text-xs text-ink-soft">Nenhum veículo cadastrado.</p>}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {motorista.escolas.map((me) => (
                <span key={me.id} className="flex items-center gap-1.5 rounded-full bg-sage-soft px-3 py-1.5 text-xs text-sage">
                  <School className="h-3.5 w-3.5" /> {me.escola.nome}
                </span>
              ))}
              {motorista.escolas.length === 0 && <p className="text-xs text-ink-soft">Nenhuma escola vinculada ainda.</p>}
            </div>
            <p className="mt-4 text-xs text-ink-soft">
              {motorista.anosExperiencia} anos de experiência · {motorista.temMonitor ? "Com monitor" : "Sem monitor"}
              {motorista.precoMin && motorista.precoMax && (
                <> · faixa {formatarReais(motorista.precoMin)}–{formatarReais(motorista.precoMax)}</>
              )}
            </p>
          </section>

          <section className="rounded-2xl border border-cream-line bg-white p-5">
            <h2 className="font-serif text-lg text-navy">Avaliações recebidas</h2>
            {motorista.avaliacoes.length === 0 ? (
              <p className="mt-2 text-sm text-ink-soft">Nenhuma avaliação ainda.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {motorista.avaliacoes.map((a) => (
                  <li key={a.id} className="rounded-xl border border-cream-line px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1 text-amber">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={cn("h-3.5 w-3.5", i < a.nota ? "fill-amber" : "text-cream-line")} />
                        ))}
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          a.moderado
                            ? "border-transparent bg-sage-soft text-[10px] font-semibold text-sage"
                            : "border-transparent bg-amber-soft text-[10px] font-semibold text-navy"
                        }
                      >
                        {a.moderado ? "Publicado" : "Pendente"}
                      </Badge>
                    </div>
                    {a.comentario && <p className="mt-1.5 text-sm text-ink-soft">{a.comentario}</p>}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-cream-line bg-white p-5">
            <h2 className="font-serif text-lg text-navy">Comissão</h2>
            <div className="mt-3 space-y-1.5 text-sm">
              <p className="flex justify-between"><span className="text-ink-soft">Contratos fechados</span><span className="font-semibold text-navy">{motorista.contratos.length}</span></p>
              <p className="flex justify-between"><span className="text-ink-soft">Receita gerada</span><span className="font-semibold text-sage">{formatarReais(receitaGeradaCentavos)}</span></p>
              <p className="flex justify-between"><span className="text-ink-soft">Destaque</span><span className="font-semibold text-navy">{motorista.destaqueAtivo ? "Ativo" : "Não contratado"}</span></p>
            </div>
            <Link href="/admin/financeiro" className="mt-3 block text-xs font-semibold text-sage hover:underline">
              Ver no Financeiro →
            </Link>
          </section>

          <section className="rounded-2xl border border-cream-line bg-white p-5">
            <h2 className="font-serif text-lg text-navy">Últimos leads</h2>
            {motorista.leads.length === 0 ? (
              <p className="mt-2 text-sm text-ink-soft">Nenhum lead recebido ainda.</p>
            ) : (
              <ul className="mt-3 space-y-2.5">
                {motorista.leads.map((lead) => (
                  <li key={lead.id} className="text-sm">
                    <p className="font-medium text-navy">{lead.pai.user.nome}</p>
                    <p className="text-xs text-ink-soft">{lead.filho.nome} · {lead.status}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
