import { NextResponse } from "next/server";
import { z } from "zod";
import { confirmarCodigoOtp } from "../../../../lib/auth";

const schema = z.object({ telefone: z.string().min(10), codigo: z.string().length(6) });

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const session = await confirmarCodigoOtp(parsed.data.telefone, parsed.data.codigo);
  if (!session) {
    return NextResponse.json(
      { error: "Código inválido, expirado, ou telefone sem cadastro." },
      { status: 401 }
    );
  }

  return NextResponse.json({ ok: true, role: session.role });
}
