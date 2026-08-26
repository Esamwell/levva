import { NextResponse } from "next/server";
import { db } from "../../../../../../lib/db";
import { exigirPapel } from "../../../../../../lib/auth";
import { enviarEmail, emailExtraConfirmado, urlBase } from "../../../../../../lib/email";

const SERVICO_LABEL: Record<string, string> = { DESTAQUE: "Destaque" };

/** POST /api/admin/extras/[id]/confirmar — admin confirma que o pagamento (fora do app) chegou. */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await exigirPapel("ADMIN");
  if (!session) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const { id } = await params;

  const extra = await db.motoristaExtra.findUnique({
    where: { id },
    include: { motorista: { include: { user: { select: { nome: true, email: true } } } } },
  });
  if (!extra) {
    return NextResponse.json({ error: "Não encontrado." }, { status: 404 });
  }
  if (extra.status !== "PENDENTE") {
    return NextResponse.json({ error: "Esse extra não está aguardando confirmação." }, { status: 409 });
  }

  await db.$transaction([
    db.motoristaExtra.update({ where: { id }, data: { status: "ATIVO" } }),
    ...(extra.tipo === "DESTAQUE"
      ? [db.motorista.update({ where: { id: extra.motoristaId }, data: { destaqueAtivo: true } })]
      : []),
  ]);

  try {
    await enviarEmail({
      para: extra.motorista.user.email,
      ...emailExtraConfirmado({
        nome: extra.motorista.user.nome,
        servico: SERVICO_LABEL[extra.tipo] ?? extra.tipo,
        link: `${urlBase()}/motorista/extras`,
      }),
    });
  } catch (err) {
    console.error("Extra confirmado, mas falha ao avisar o motorista:", err);
  }

  return NextResponse.json({ ok: true });
}
