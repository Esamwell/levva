import { NextResponse } from "next/server";
import { z } from "zod";
import { redefinirSenhaComToken } from "../../../../lib/auth";

const schema = z.object({
  token: z.string().min(32),
  senha: z.string().min(8),
});

/**
 * POST /api/auth/redefinir — troca a senha usando o token que veio no e-mail.
 * Ao concluir, todas as sessões daquele usuário caem (ver lib/auth.ts).
 */
export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Link inválido ou senha muito curta (mínimo 8 caracteres)." },
      { status: 400 }
    );
  }

  const resultado = await redefinirSenhaComToken(parsed.data.token, parsed.data.senha);
  if (!resultado.ok) {
    return NextResponse.json({ error: resultado.erro }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
