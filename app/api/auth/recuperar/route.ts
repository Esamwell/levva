import { NextResponse } from "next/server";
import { z } from "zod";
import { criarTokenRecuperacao } from "../../../../lib/auth";
import { enviarEmail, emailRecuperacaoSenha, urlBase } from "../../../../lib/email";

const schema = z.object({ email: z.string().email() });

const TTL_MINUTOS = 60;

/**
 * POST /api/auth/recuperar — dispara o e-mail de redefinição de senha.
 *
 * Responde sempre a mesma coisa, exista a conta ou não. Confirmar que um
 * e-mail está cadastrado entrega quem usa a plataforma — e, no caso do
 * admin, entrega exatamente qual conta atacar.
 */
export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));

  const resposta = NextResponse.json({
    ok: true,
    mensagem: "Se existir uma conta com esse e-mail, o link de redefinição chegou na caixa de entrada.",
  });

  if (!parsed.success) return resposta;

  try {
    const pedido = await criarTokenRecuperacao(parsed.data.email);
    if (!pedido) return resposta;

    const link = `${urlBase()}/redefinir-senha?token=${pedido.token}`;

    await enviarEmail({
      para: pedido.email,
      ...emailRecuperacaoSenha({ nome: pedido.nome, link, minutos: TTL_MINUTOS }),
    });
  } catch (err) {
    // Falha de SMTP não pode virar sinal de que a conta existe — logamos e
    // devolvemos a mesma resposta de sempre.
    console.error("Falha ao enviar e-mail de recuperação:", err);
  }

  return resposta;
}
