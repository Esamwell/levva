import { Inbox, UserRound, LifeBuoy, Sparkles, Wallet, Users, FileText } from "lucide-react";
import { redirect } from "next/navigation";
import { getSession } from "../../../lib/auth";
import { db } from "../../../lib/db";
import { DashboardShell, type DashboardNavItem } from "../../../components/dashboard-shell";
import { Badge } from "../../../components/ui/badge";
import { ReprovadoBanner } from "../../../components/reprovado-banner";
import { dataElegivelReanalise } from "../../../lib/aprovacao";

const APROVACAO_LABEL: Record<string, string> = {
  PENDENTE: "Em análise",
  APROVADO: "Aprovado",
  REPROVADO: "Reprovado",
};

export default async function MotoristaLayout({ children }: { children: React.ReactNode }) {
  // Sessão + papel já garantidos pelo middleware.ts antes de chegar aqui.
  const session = await getSession();
  if (!session) redirect("/entrar");

  const motorista = await db.motorista.findUnique({
    where: { userId: session.userId },
    include: { user: true },
  });
  if (!motorista) redirect("/entrar");

  const navItems: DashboardNavItem[] = [
    { href: "/motorista", label: "Leads", icon: <Inbox className="h-4 w-4" strokeWidth={1.75} /> },
    { href: "/motorista/alunos", label: "Meus alunos", icon: <Users className="h-4 w-4" strokeWidth={1.75} /> },
    { href: "/motorista/financeiro", label: "Financeiro", icon: <Wallet className="h-4 w-4" strokeWidth={1.75} /> },
    { href: "/motorista/perfil", label: "Meu perfil", icon: <UserRound className="h-4 w-4" strokeWidth={1.75} /> },
    { href: "/motorista/documentos", label: "Documentos", icon: <FileText className="h-4 w-4" strokeWidth={1.75} /> },
    { href: "/motorista/extras", label: "Extras", icon: <Sparkles className="h-4 w-4" strokeWidth={1.75} /> },
    { href: "/motorista/suporte", label: "Suporte", icon: <LifeBuoy className="h-4 w-4" strokeWidth={1.75} /> },
  ];

  return (
    <DashboardShell
      brandLabel="motorista"
      navItems={navItems}
      userName={motorista.user.nome}
      userSubtitle={
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline" className="border-white/15 bg-white/5 text-[11px] font-semibold text-white/80">
            {APROVACAO_LABEL[motorista.statusAprovacao] ?? motorista.statusAprovacao}
          </Badge>
          {motorista.destaqueAtivo && (
            <Badge variant="outline" className="border-amber/30 bg-amber/10 text-[11px] font-semibold text-amber">
              Destaque
            </Badge>
          )}
        </div>
      }
    >
      {motorista.statusAprovacao === "REPROVADO" && motorista.motivoReprovacao && (
        <ReprovadoBanner
          motivo={motorista.motivoReprovacao}
          elegivelEmISO={motorista.reprovadoEm ? dataElegivelReanalise(motorista.reprovadoEm).toISOString() : null}
        />
      )}
      {children}
    </DashboardShell>
  );
}
