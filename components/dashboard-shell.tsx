"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import LogoutButton from "@/components/logout-button";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";

export type DashboardNavItem = {
  href: string;
  label: string;
  // JSX já renderizado (ex.: <LayoutDashboard className="h-4 w-4" />), não a
  // referência do componente — os layouts que montam essa lista são Server
  // Components, e uma função não atravessa a fronteira pra este client
  // component (React: "Functions cannot be passed directly to Client
  // Components"). Um elemento React já resolvido, sim.
  icon: React.ReactNode;
  badge?: number;
};

function isActive(pathname: string, href: string) {
  return pathname === href || (href !== "/admin" && href !== "/motorista" && pathname.startsWith(href + "/"));
}

function NavLinks({ navItems, pathname }: { navItems: DashboardNavItem[]; pathname: string }) {
  return (
    <nav className="space-y-1">
      {navItems.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition",
              active ? "bg-white/10 text-white" : "text-white/65 hover:bg-white/5 hover:text-white"
            )}
          >
            <span className="flex items-center gap-2.5">
              {item.icon}
              {item.label}
            </span>
            {!!item.badge && (
              <span className="rounded-full bg-amber px-2 py-0.5 text-[11px] font-bold text-navy">
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarBody({
  brandLabel,
  navItems,
  pathname,
  userName,
  userSubtitle,
}: {
  brandLabel: string;
  navItems: DashboardNavItem[];
  pathname: string;
  userName?: string;
  userSubtitle?: React.ReactNode;
}) {
  return (
    <div className="flex h-full flex-col">
      <div>
        <Logo on="dark" size="sm" />
        <span className="ml-9 font-mono text-[11px] uppercase tracking-widest text-white/50">{brandLabel}</span>
      </div>
      <div className="mt-8 flex-1">
        <NavLinks navItems={navItems} pathname={pathname} />
      </div>
      <div className="mt-6 space-y-3 border-t border-white/10 pt-5">
        {userSubtitle}
        <div className="flex items-center justify-between">
          {userName && <p className="truncate text-sm font-medium text-white/85">{userName}</p>}
          <LogoutButton className="text-xs font-semibold text-white/50 hover:text-white" />
        </div>
      </div>
    </div>
  );
}

export function DashboardShell({
  brandLabel,
  navItems,
  userName,
  userSubtitle,
  children,
}: {
  brandLabel: string;
  navItems: DashboardNavItem[];
  userName?: string;
  userSubtitle?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-cream md:flex">
      {/* Sidebar fixa — desktop */}
      <aside className="hidden w-64 shrink-0 bg-navy px-5 py-7 md:block">
        <SidebarBody
          brandLabel={brandLabel}
          navItems={navItems}
          pathname={pathname}
          userName={userName}
          userSubtitle={userSubtitle}
        />
      </aside>

      <div className="flex-1">
        {/* Topo com hambúrguer — mobile */}
        <header className="flex items-center justify-between border-b border-cream-line bg-navy px-5 py-4 text-white md:hidden">
          <Logo on="dark" size="sm" />
          <Sheet>
            <SheetTrigger asChild>
              <button aria-label="Abrir menu" className="rounded-full p-1.5 text-white/85 hover:bg-white/10">
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 border-none bg-navy p-6">
              <SidebarBody
                brandLabel={brandLabel}
                navItems={navItems}
                pathname={pathname}
                userName={userName}
                userSubtitle={userSubtitle}
              />
            </SheetContent>
          </Sheet>
        </header>

        <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
