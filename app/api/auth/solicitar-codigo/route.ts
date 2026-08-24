import { NextResponse } from "next/server";
import { z } from "zod";
import { enviarCodigoOtp } from "../../../../lib/auth";

const schema = z.object({ telefone: z.string().min(10) });

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    await enviarCodigoOtp(parsed.data.telefone);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Não foi possível enviar o código agora. Tente de novo." },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
