import { Inbox, UserRound, LifeBuoy, Sparkles } from "lucide-react";
import { redirect } from "next/navigation";
import { getSession } from "../../../lib/auth";
import { db } from "../../../lib/db";
import { DashboardShell, type DashboardNavItem } from "../../../components/dashboard-shell";
import { Badge } from "../../../components/ui/badge";

const PLANO_LABEL: Record<string, string> = { BASICO: "Básico", FROTA: "Frota" };

export default async function MotoristaLayout({ children }: { children: React.ReactNode }) {
  // Sessão + papel já garantidos pelo middleware.ts antes de chegar aqui.
  const session = await getSession();
  if (!session) redirect("/entrar");

  const motorista = await db.motorista.findUnique({
    where: { userId: session.userId },
    include: { user: true, assinatura: true },
  });
  if (!motorista) redirect("/entrar");

  const navItems: DashboardNavItem[] = [
    { href: "/motorista", label: "Leads", icon: <Inbox className="h-4 w-4" strokeWidth={1.75} /> },
    { href: "/motorista/perfil", label: "Meu perfil", icon: <UserRound className="h-4 w-4" strokeWidth={1.75} /> },
    { href: "/motorista/extras", label: "Extras", icon: <Sparkles className="h-4 w-4" strokeWidth={1.75} /> },
    { href: "/motorista/suporte", label: "Suporte", icon: <LifeBuoy className="h-4 w-4" strokeWidth={1.75} /> },
  ];

  return (
    <DashboardShell
      brandLabel="motorista"
      navItems={navItems}
      userName={motorista.user.nome}
      userSubtitle={
        <Badge variant="outline" className="border-white/15 bg-white/5 text-[11px] font-semibold text-white/80">
          {motorista.assinatura
            ? `${motorista.assinatura.status === "ATIVA" ? "Ativo" : motorista.assinatura.status.toLowerCase()} · Plano ${
                PLANO_LABEL[motorista.assinatura.plano] ?? motorista.assinatura.plano
              }`
            : "Sem assinatura"}
        </Badge>
      }
    >
      {children}
    </DashboardShell>
  );
}
