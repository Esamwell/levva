import { redirect } from "next/navigation";
import { Users, School, Phone } from "lucide-react";
import { exigirPapel } from "../../../../lib/auth";
import { db } from "../../../../lib/db";
import { EmptyState } from "../../../../components/empty-state";
import { Avatar, AvatarFallback } from "../../../../components/ui/avatar";

function iniciais(nome: string): string {
  return nome.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
}

export default async function AlunosMotoristaPage() {
  const session = await exigirPapel("MOTORISTA");
  if (!session) redirect("/entrar");

  const motorista = await db.motorista.findUnique({ where: { userId: session.userId }, select: { id: true } });
  if (!motorista) redirect("/entrar");

  const contratos = await db.contrato.findMany({
    where: { motoristaId: motorista.id },
    orderBy: { createdAt: "desc" },
    include: {
      lead: { include: { filho: { include: { escola: true } } } },
      pai: { include: { user: { select: { nome: true, telefone: true } } } },
    },
  });

  return (
    <div>
      <h1 className="font-serif text-3xl text-navy">Meus alunos</h1>
      <p className="mt-1 text-sm text-ink-soft">As crianças que você transporta hoje, com o contato do responsável.</p>

      {contratos.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={Users}
            title="Nenhum aluno ainda"
            description="Assim que você fechar um lead, o aluno aparece aqui."
          />
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {contratos.map((c) => {
            const telefoneLimpo = c.pai.user.telefone?.replace(/\D/g, "");
            return (
              <div key={c.id} className="rounded-2xl border border-cream-line bg-white p-5">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarFallback className="bg-cream text-xs font-bold text-navy">
                      {iniciais(c.lead.filho.nome)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-navy">{c.lead.filho.nome}</p>
                    <p className="flex items-center gap-1 text-xs text-ink-soft">
                      <School className="h-3 w-3" /> {c.lead.filho.escola.nome}
                    </p>
                  </div>
                </div>

                <div className="mt-3.5 flex items-center justify-between border-t border-cream-line pt-3.5 text-sm">
                  <div>
                    <p className="text-xs text-ink-soft">Responsável</p>
                    <p className="font-medium text-navy">{c.pai.user.nome}</p>
                  </div>
                  {telefoneLimpo && (
                    <a
                      href={`https://wa.me/${telefoneLimpo}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 rounded-full border border-sage-soft px-3 py-1.5 text-xs font-semibold text-sage hover:bg-sage-soft/40"
                    >
                      <Phone className="h-3.5 w-3.5" /> WhatsApp
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
