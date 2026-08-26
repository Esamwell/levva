import { NextResponse } from "next/server";
import { db } from "../../../../lib/db";
import { exigirPapel } from "../../../../lib/auth";
import { criarSolicitacaoSaque } from "../../../../lib/saques";

/** POST /api/motorista/saques — motorista pede pra sacar tudo que está disponível agora. */
export async function POST() {
  const session = await exigirPapel("MOTORISTA");
  if (!session) {
    return NextResponse.json({ error: "Sem sessão de motorista." }, { status: 401 });
  }

  const motorista = await db.motorista.findUnique({ where: { userId: session.userId }, select: { id: true } });
  if (!motorista) {
    return NextResponse.json({ error: "Perfil não encontrado." }, { status: 404 });
  }

  const resultado = await criarSolicitacaoSaque(motorista.id);
  if (!resultado.ok) {
    return NextResponse.json({ error: resultado.erro }, { status: 400 });
  }

  return NextResponse.json(resultado, { status: 201 });
}
