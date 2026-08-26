import { LayoutDashboard, ShieldCheck, Car, Users, MessageSquare, LifeBuoy, Wallet, School, Settings, Banknote } from "lucide-react";
import { db } from "../../lib/db";
import { DashboardShell, type DashboardNavItem } from "../../components/dashboard-shell";

/**
 * Sessão e papel ADMIN são garantidos pelo middleware.ts antes de chegar aqui,
 * e reconfirmados contra o banco por getSession() em cada página e rota.
 *
 * `dynamic = "force-dynamic"`: sem isso o Next tenta pré-renderizar este
 * layout em build time (ele não chama cookies()/headers() diretamente, só
 * o db pro contador de pendentes), e o build não tem DATABASE_URL — só o
 * container em produção tem, via docker-compose.
 */
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const [pendentes, depoimentosPendentes, ticketsAbertos, saquesPendentes] = await Promise.all([
    db.motorista.count({ where: { statusAprovacao: "PENDENTE" } }),
    db.avaliacao.count({ where: { moderado: false } }),
    db.ticket.count({ where: { status: "ABERTO" } }),
    db.solicitacaoSaque.count({ where: { status: "PENDENTE" } }),
  ]);

  const navItems: DashboardNavItem[] = [
    { href: "/admin", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" strokeWidth={1.75} /> },
    {
      href: "/admin/aprovacoes",
      label: "Aprovações",
      icon: <ShieldCheck className="h-4 w-4" strokeWidth={1.75} />,
      badge: pendentes,
    },
    { href: "/admin/motoristas", label: "Motoristas", icon: <Car className="h-4 w-4" strokeWidth={1.75} /> },
    { href: "/admin/usuarios", label: "Usuários", icon: <Users className="h-4 w-4" strokeWidth={1.75} /> },
    {
      href: "/admin/depoimentos",
      label: "Depoimentos",
      icon: <MessageSquare className="h-4 w-4" strokeWidth={1.75} />,
      badge: depoimentosPendentes,
    },
    {
      href: "/admin/suporte",
      label: "Suporte",
      icon: <LifeBuoy className="h-4 w-4" strokeWidth={1.75} />,
      badge: ticketsAbertos,
    },
    { href: "/admin/financeiro", label: "Financeiro", icon: <Wallet className="h-4 w-4" strokeWidth={1.75} /> },
    {
      href: "/admin/saques",
      label: "Saques",
      icon: <Banknote className="h-4 w-4" strokeWidth={1.75} />,
      badge: saquesPendentes,
    },
    { href: "/admin/escolas", label: "Escolas", icon: <School className="h-4 w-4" strokeWidth={1.75} /> },
    { href: "/admin/configuracoes", label: "Configurações", icon: <Settings className="h-4 w-4" strokeWidth={1.75} /> },
  ];

  return (
    <DashboardShell brandLabel="admin" navItems={navItems}>
      {children}
    </DashboardShell>
  );
}
