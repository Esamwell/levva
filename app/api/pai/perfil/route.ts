import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "../../../../lib/db";
import { exigirPapel, normalizarTelefone } from "../../../../lib/auth";
import { geocodeEndereco } from "../../../../lib/geo";

const schema = z.object({
  telefone: z.string().min(10),
  endereco: z.string().min(4),
});

/** PUT /api/pai/perfil — o próprio pai edita telefone e endereço. */
export async function PUT(req: Request) {
  const session = await exigirPapel("PAI");
  if (!session) {
    return NextResponse.json({ error: "Sem sessão de responsável." }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const pai = await db.pai.findUnique({ where: { userId: session.userId }, select: { id: true } });
  if (!pai) {
    return NextResponse.json({ error: "Perfil de responsável não encontrado." }, { status: 404 });
  }

  const telefone = normalizarTelefone(parsed.data.telefone);

  const telefoneEmUso = await db.user.findFirst({
    where: { telefone, id: { not: session.userId } },
    select: { id: true },
  });
  if (telefoneEmUso) {
    return NextResponse.json({ error: "Esse telefone já está em uso por outra conta." }, { status: 409 });
  }

  // Endereço mudou? Se sim, geocodifica de novo (ver comentário em /api/leads
  // sobre não travar o fluxo quando o serviço externo não reconhece).
  const ponto = await geocodeEndereco(parsed.data.endereco);

  await db.$transaction([
    db.user.update({ where: { id: session.userId }, data: { telefone } }),
    db.pai.update({
      where: { id: pai.id },
      data: { endereco: parsed.data.endereco, lat: ponto?.lat ?? null, lng: ponto?.lng ?? null },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
