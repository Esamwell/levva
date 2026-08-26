"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, ArrowRight } from "lucide-react";
import { Avatar, AvatarFallback } from "../../../components/ui/avatar";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { cn } from "../../../lib/utils";

type Usuario = {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  role: "PAI" | "MOTORISTA" | "ADMIN";
  ativo: boolean;
  createdAt: string;
  motoristaId: string | null;
  paiId: string | null;
};

const PAPEL_LABEL: Record<Usuario["role"], string> = {
  PAI: "Pai",
  MOTORISTA: "Motorista",
  ADMIN: "Admin",
};

const FILTROS = [
  { value: "TODOS", label: "Todos" },
  { value: "PAI", label: "Pais" },
  { value: "MOTORISTA", label: "Motoristas" },
  { value: "ADMIN", label: "Admins" },
] as const;

function iniciais(nome: string): string {
  return nome.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
}

export default function UsuariosList({
  usuarios,
  contaAtualId,
}: {
  usuarios: Usuario[];
  contaAtualId: string;
}) {
  const router = useRouter();
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<(typeof FILTROS)[number]["value"]>("TODOS");
  const [processando, setProcessando] = useState<string | null>(null);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return usuarios.filter((u) => {
      if (filtro !== "TODOS" && u.role !== filtro) return false;
      if (!termo) return true;
      return u.nome.toLowerCase().includes(termo) || u.email.toLowerCase().includes(termo);
    });
  }, [usuarios, busca, filtro]);

  async function alternarAtivo(u: Usuario) {
    const acao = u.ativo ? "desativar" : "ativar";
    if (u.ativo && !window.confirm(`Desativar a conta de ${u.nome}? Ela não consegue mais entrar.`)) return;
    setProcessando(u.id);
    try {
      const res = await fetch(`/api/admin/usuarios/${u.id}/${acao}`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        window.alert(data.error || "Não foi possível atualizar.");
        return;
      }
      router.refresh();
    } finally {
      setProcessando(null);
    }
  }

  return (
    <div className="mt-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-xs flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome ou e-mail"
            className="w-full rounded-full border border-cream-line py-2 pl-9 pr-4 text-sm outline-none focus:border-amber"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {FILTROS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFiltro(f.value)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                filtro === f.value
                  ? "border-navy bg-navy text-white"
                  : "border-cream-line text-ink-soft hover:border-amber hover:text-navy"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {filtrados.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-cream-line bg-white p-8 text-center text-sm text-ink-soft">
            Nenhum usuário encontrado.
          </p>
        ) : (
          filtrados.map((u) => (
            <div key={u.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cream-line bg-white px-4 py-3.5">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarFallback className="bg-cream text-xs font-bold text-navy">{iniciais(u.nome)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-navy">
                    {u.nome}
                    {!u.ativo && (
                      <span className="ml-2 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase text-red-600">
                        Desativado
                      </span>
                    )}
                  </p>
                  <p className="truncate text-xs text-ink-soft">
                    {u.email}
                    {u.telefone && ` · ${u.telefone}`}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge variant="outline" className="border-cream-line text-ink-soft">
                  {PAPEL_LABEL[u.role]}
                </Badge>
                {(u.motoristaId || u.paiId) && (
                  <Link
                    href={u.motoristaId ? `/admin/motoristas/${u.motoristaId}` : `/admin/pais/${u.paiId}`}
                    className="flex items-center gap-1 text-xs font-semibold text-sage hover:underline"
                  >
                    Ver perfil <ArrowRight className="h-3 w-3" />
                  </Link>
                )}
                {u.id !== contaAtualId && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={processando === u.id}
                    onClick={() => alternarAtivo(u)}
                    className={u.ativo ? "border-red-200 text-red-600 hover:bg-red-50" : "border-sage-soft text-sage hover:bg-sage-soft/40"}
                  >
                    {u.ativo ? "Desativar" : "Reativar"}
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
