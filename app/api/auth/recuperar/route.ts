import { NextResponse } from "next/server";
import { z } from "zod";
import { criarTokenRecuperacao, normalizarEmail } from "../../../../lib/auth";
import { enviarEmail, emailRecuperacaoSenha, urlBase } from "../../../../lib/email";
import { limiteExcedido, registrarUso } from "../../../../lib/rate-limit";
import { ipDoCliente } from "../../../../lib/request";

const schema = z.object({ email: z.string().email() });

const TTL_MINUTOS = 60;
// Limita o e-mail de verdade (não a resposta — ver comentário abaixo) por
// endereço e por IP: sem isso, dá pra floodar a caixa de entrada de alguém
// só repetindo o pedido.
const JANELA_MINUTOS = 60;
const MAX_POR_EMAIL = 3;
const MAX_POR_IP = 20;

/**
 * POST /api/auth/recuperar — dispara o e-mail de redefinição de senha.
 *
 * Responde sempre a mesma coisa, exista a conta ou não, e também quando o
 * limite de taxa é excedido — um erro diferente aqui vazaria tanto quanto
 * confirmar a conta. O limite trava o envio de verdade, em silêncio.
 */
export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));

  const resposta = NextResponse.json({
    ok: true,
    mensagem: "Se existir uma conta com esse e-mail, o link de redefinição chegou na caixa de entrada.",
  });

  if (!parsed.success) return resposta;

  const chaveEmail = `email:${normalizarEmail(parsed.data.email)}`;
  const chaveIp = `ip:${ipDoCliente(req)}`;
  const [porEmail, porIp] = await Promise.all([
    limiteExcedido("recuperar-senha", chaveEmail, JANELA_MINUTOS, MAX_POR_EMAIL),
    limiteExcedido("recuperar-senha", chaveIp, JANELA_MINUTOS, MAX_POR_IP),
  ]);
  if (porEmail || porIp) return resposta;

  try {
    const pedido = await criarTokenRecuperacao(parsed.data.email);
    if (!pedido) return resposta;

    await Promise.all([registrarUso("recuperar-senha", chaveEmail), registrarUso("recuperar-senha", chaveIp)]);

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
