import { redirect } from "next/navigation";
import { exigirPapel } from "../../../lib/auth";
import ConfiguracoesAsaasForm from "./configuracoes-asaas-form";

export default async function ConfiguracoesPage() {
  const session = await exigirPapel("ADMIN");
  if (!session) redirect("/entrar");

  return (
    <div>
      <h1 className="font-serif text-3xl text-navy">Configurações</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Integrações da Mova com serviços externos. Hoje só o Asaas (cobrança) — trocar de conta
        aqui não precisa de deploy nem de mexer em código.
      </p>

      <div className="mt-8 max-w-lg">
        <ConfiguracoesAsaasForm />
      </div>
    </div>
  );
}
