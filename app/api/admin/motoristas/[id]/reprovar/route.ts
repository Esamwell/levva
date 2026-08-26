import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "../../../../../../lib/db";
import { exigirPapel } from "../../../../../../lib/auth";
import { enviarEmail, emailMotoristaReprovado } from "../../../../../../lib/email";
import { DIAS_ESPERA_REANALISE } from "../../../../../../lib/aprovacao";

const schema = z.object({ motivo: z.string().min(3) });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await exigirPapel("ADMIN");
  if (!session) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { id } = await params;

  const motorista = await db.motorista.findUnique({
    where: { id },
    include: { user: { select: { nome: true, email: true } } },
  });
  if (!motorista) {
    return NextResponse.json({ error: "Motorista não encontrado." }, { status: 404 });
  }

  const reprovadoEm = new Date();
  await db.motorista.update({
    where: { id },
    data: { statusAprovacao: "REPROVADO", motivoReprovacao: parsed.data.motivo, reprovadoEm },
  });

  const dataLimite = new Date(reprovadoEm.getTime() + DIAS_ESPERA_REANALISE * 24 * 60 * 60 * 1000);

  try {
    await enviarEmail({
      para: motorista.user.email,
      ...emailMotoristaReprovado({
        nome: motorista.user.nome,
        motivo: parsed.data.motivo,
        dataLimite: dataLimite.toLocaleDateString("pt-BR"),
      }),
    });
  } catch (err) {
    console.error("Motorista reprovado, mas falha ao enviar o e-mail:", err);
  }

  return NextResponse.json({ ok: true });
}
