import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "../../../../lib/db";
import { exigirPapel } from "../../../../lib/auth";

const schema = z.object({
  nome: z.string().trim().min(2).max(120),
  lat: z.number(),
  lng: z.number(),
  raioKm: z.number().min(1).max(50),
});

/**
 * POST /api/motorista/areas — adiciona uma área de atendimento (ponto +
 * raio). Não substitui as escolas atendidas (MotoristaEscola) — é um
 * segundo critério cruzado na busca do pai (ver /api/busca), pro caso do
 * motorista atender uma escola mas só pegar passageiro de um bairro
 * específico, não da cidade inteira.
 */
export async function POST(req: Request) {
  const session = await exigirPapel("MOTORISTA");
  if (!session) {
    return NextResponse.json({ error: "Sem sessão de motorista." }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const motorista = await db.motorista.findUnique({ where: { userId: session.userId }, select: { id: true } });
  if (!motorista) {
    return NextResponse.json({ error: "Perfil não encontrado." }, { status: 404 });
  }

  const area = await db.areaAtendimento.create({
    data: { motoristaId: motorista.id, ...parsed.data },
  });

  return NextResponse.json({ area }, { status: 201 });
}
