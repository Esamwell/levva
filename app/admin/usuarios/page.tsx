import { redirect } from "next/navigation";
import { Users, UserRound, Car, ShieldCheck } from "lucide-react";
import { db } from "../../../lib/db";
import { exigirPapel } from "../../../lib/auth";
import { StatCard } from "../../../components/stat-card";
import UsuariosList from "./usuarios-list";

export default async function UsuariosPage() {
  const session = await exigirPapel("ADMIN");
  if (!session) redirect("/entrar");

  const usuarios = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      nome: true,
      email: true,
      telefone: true,
      role: true,
      ativo: true,
      createdAt: true,
      motorista: { select: { id: true } },
      pai: { select: { id: true } },
    },
  });

  const totais = {
    total: usuarios.length,
    pais: usuarios.filter((u) => u.role === "PAI").length,
    motoristas: usuarios.filter((u) => u.role === "MOTORISTA").length,
    admins: usuarios.filter((u) => u.role === "ADMIN").length,
  };

  return (
    <div>
      <h1 className="font-serif text-3xl text-navy">Usuários</h1>
      <p className="mt-1 text-sm text-ink-soft">Todas as contas cadastradas na Mova, dos três papéis.</p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Total de contas" value={String(totais.total)} />
        <StatCard icon={UserRound} label="Pais" value={String(totais.pais)} />
        <StatCard icon={Car} label="Motoristas" value={String(totais.motoristas)} />
        <StatCard icon={ShieldCheck} label="Admins" value={String(totais.admins)} />
      </div>

      <UsuariosList
        usuarios={usuarios.map((u) => ({
          id: u.id,
          nome: u.nome,
          email: u.email,
          telefone: u.telefone,
          role: u.role,
          ativo: u.ativo,
          createdAt: u.createdAt.toISOString(),
          motoristaId: u.motorista?.id ?? null,
          paiId: u.pai?.id ?? null,
        }))}
        contaAtualId={session.userId}
      />
    </div>
  );
}
