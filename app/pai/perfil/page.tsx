/**
 * "Meu perfil" do pai: editar endereço/telefone e gerenciar os filhos
 * (nome + escola) fora do fluxo de "solicitar contato". Espelha o que o
 * motorista já tem em /motorista/perfil — antes o pai só ganhava conta e
 * um primeiro filho de passagem, dentro do modal de contato, sem nenhum
 * jeito de revisar ou corrigir isso depois.
 */
import { redirect } from "next/navigation";
import { exigirPapel } from "../../../lib/auth";
import { db } from "../../../lib/db";
import PerfilForm from "./perfil-form";

export default async function PerfilPaiPage() {
  const session = await exigirPapel("PAI");
  if (!session) redirect("/entrar");

  const [user, pai] = await Promise.all([
    db.user.findUnique({ where: { id: session.userId }, select: { nome: true, email: true, telefone: true } }),
    db.pai.findUnique({
      where: { userId: session.userId },
      select: { endereco: true, cpfCnpj: true, filhos: { include: { escola: true }, orderBy: { nome: "asc" } } },
    }),
  ]);

  if (!user || !pai) redirect("/entrar");

  return (
    <div>
      <h1 className="font-serif text-3xl text-navy">Meu perfil</h1>
      <p className="mt-2 text-ink-soft">Seus dados de contato e os filhos cadastrados na plataforma.</p>

      <PerfilForm
        conta={{ nome: user.nome, email: user.email, telefone: user.telefone ?? "" }}
        endereco={pai.endereco}
        cpfCnpj={pai.cpfCnpj}
        filhosIniciais={pai.filhos.map((f) => ({
          id: f.id,
          nome: f.nome,
          escola: { id: f.escola.id, nome: f.escola.nome },
        }))}
      />
    </div>
  );
}
