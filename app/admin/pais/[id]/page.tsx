import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, School, Baby, ArrowRight } from "lucide-react";
import { db } from "../../../../lib/db";
import { exigirPapel } from "../../../../lib/auth";
import { Avatar, AvatarFallback } from "../../../../components/ui/avatar";
import { Badge } from "../../../../components/ui/badge";
import { StatusBadge } from "../../../../components/status-badge";
import { EmptyState } from "../../../../components/empty-state";
import PaiDetailActions from "./pai-detail-actions";

function iniciais(nome: string): string {
  return nome.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
}

export default async function PaiDetailPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await exigirPapel("ADMIN"))) redirect("/entrar");

  const { id } = await params;

  const pai = await db.pai.findUnique({
    where: { id },
    include: {
      user: true,
      filhos: { include: { escola: true } },
      leads: {
        orderBy: { createdAt: "desc" },
        include: {
          filho: { include: { escola: true } },
          motorista: { include: { user: true } },
        },
      },
    },
  });

  if (!pai) notFound();

  const fechados = pai.leads.filter((l) => l.status === "FECHADO");

  return (
    <div>
      <Link href="/admin/usuarios" className="flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-navy">
        <ArrowLeft className="h-4 w-4" />
        Usuários
      </Link>

      <div className="mt-4 flex flex-col gap-4 rounded-2xl border border-cream-line bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14 shrink-0">
            <AvatarFallback className="bg-navy text-lg font-bold text-white">{iniciais(pai.user.nome)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-serif text-2xl text-navy">{pai.user.nome}</h1>
              {!pai.user.ativo && (
                <Badge variant="outline" className="border-transparent bg-red-50 font-semibold text-red-600">
                  Conta desativada
                </Badge>
              )}
            </div>
            <p className="mt-0.5 text-sm text-ink-soft">
              {pai.user.email}
              {pai.user.telefone && ` · ${pai.user.telefone}`}
            </p>
            <p className="mt-0.5 text-xs text-ink-soft">{pai.endereco}</p>
          </div>
        </div>
        <PaiDetailActions userId={pai.userId} ativo={pai.user.ativo} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <section className="h-fit rounded-2xl border border-cream-line bg-white p-5">
          <h2 className="flex items-center gap-2 font-serif text-lg text-navy">
            <Baby className="h-4 w-4" /> Filhos e escolas
          </h2>
          {pai.filhos.length === 0 ? (
            <p className="mt-2 text-sm text-ink-soft">Nenhum filho cadastrado ainda.</p>
          ) : (
            <ul className="mt-3 space-y-2.5">
              {pai.filhos.map((f) => (
                <li key={f.id} className="flex items-center justify-between rounded-xl border border-cream-line px-4 py-3">
                  <span className="text-sm font-medium text-navy">{f.nome}</span>
                  <span className="flex items-center gap-1.5 text-xs text-ink-soft">
                    <School className="h-3.5 w-3.5" /> {f.escola.nome}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-cream-line bg-white p-5">
          <h2 className="font-serif text-lg text-navy">Solicitações</h2>
          <p className="mt-1 text-xs text-ink-soft">
            {fechados.length > 0
              ? `${fechados.length} van${fechados.length > 1 ? "s" : ""} contratada${fechados.length > 1 ? "s" : ""} através da Mova.`
              : "Nenhuma contratação fechada ainda."}
          </p>
          {pai.leads.length === 0 ? (
            <div className="mt-3">
              <EmptyState icon={Baby} title="Nenhuma solicitação ainda" description="Esse pai ainda não contatou nenhum transportador." />
            </div>
          ) : (
            <ul className="mt-3 space-y-2.5">
              {pai.leads.map((lead) => (
                <li key={lead.id} className="rounded-xl border border-cream-line px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-sm">
                      <span className="font-medium text-navy">{lead.filho.nome}</span>
                      <ArrowRight className="h-3 w-3 text-ink-soft" />
                      <Link href={`/admin/motoristas/${lead.motoristaId}`} className="font-medium text-sage hover:underline">
                        {lead.motorista.user.nome}
                      </Link>
                    </div>
                    <StatusBadge status={lead.status} />
                  </div>
                  <p className="mt-1 text-xs text-ink-soft">
                    {lead.filho.escola.nome} · solicitado em {new Date(lead.createdAt).toLocaleDateString("pt-BR")}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
