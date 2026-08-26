import { NextResponse } from "next/server";
import { db } from "../../../../../../lib/db";
import { exigirPapel } from "../../../../../../lib/auth";
import { DESTAQUE_PRECO_CENTAVOS } from "../../../../../../lib/financeiro";
import { enviarEmail, emailExtraPendenteAdmin, urlBase } from "../../../../../../lib/email";

function formatarReais(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/**
 * POST /api/motorista/extras/destaque/ativar — contrata o destaque.
 *
 * Sem Asaas integrado ainda, o pagamento acontece por fora (PIX/transferência
 * combinado com o admin) — igual ao fluxo de aprovação de motorista hoje.
 * Por isso fica PENDENTE aqui: o selo e a posição no topo da busca só
 * ligam quando o admin confirma o pagamento em /admin/financeiro
 * (ver POST /api/admin/extras/[id]/confirmar).
 */
export async function POST() {
  const session = await exigirPapel("MOTORISTA");
  if (!session) {
    return NextResponse.json({ error: "Sem sessão de motorista." }, { status: 401 });
  }

  const motorista = await db.motorista.findUnique({
    where: { userId: session.userId },
    select: { id: true, user: { select: { nome: true } } },
  });
  if (!motorista) {
    return NextResponse.json({ error: "Perfil não encontrado." }, { status: 404 });
  }

  const jaExiste = await db.motoristaExtra.findFirst({
    where: { motoristaId: motorista.id, tipo: "DESTAQUE", status: { in: ["PENDENTE", "ATIVO"] } },
  });
  if (jaExiste) {
    return NextResponse.json(
      { error: jaExiste.status === "PENDENTE" ? "Já tem uma contratação aguardando confirmação." : "Destaque já está ativo." },
      { status: 409 }
    );
  }

  const valorCentavos = DESTAQUE_PRECO_CENTAVOS;

  const extra = await db.motoristaExtra.create({
    data: { motoristaId: motorista.id, tipo: "DESTAQUE", valorCentavos, periodicidade: "MENSAL", status: "PENDENTE" },
  });

  try {
    const admins = await db.user.findMany({ where: { role: "ADMIN" }, select: { email: true } });
    const conteudo = emailExtraPendenteAdmin({
      motoristaNome: motorista.user.nome,
      servico: "Destaque",
      valorFormatado: formatarReais(valorCentavos),
      link: `${urlBase()}/admin/financeiro`,
    });
    await Promise.all(admins.map((a) => enviarEmail({ para: a.email, ...conteudo })));
  } catch (err) {
    console.error("Extra criado, mas falha ao avisar o admin:", err);
  }

  return NextResponse.json({ ok: true, extraId: extra.id });
}
