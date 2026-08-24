import { NextResponse } from "next/server";
import { z } from "zod";
import {
  autenticar,
  criarSessao,
  destinoPorPapel,
  loginBloqueado,
  registrarFalhaLogin,
  limparFalhasLogin,
  faxinaEventual,
  normalizarEmail,
  LOGIN_JANELA_MINUTOS,
} from "../../../../lib/auth";
import { ipDoCliente, userAgentDoCliente } from "../../../../lib/request";

const schema = z.object({
  email: z.string().email("E-mail inválido."),
  senha: z.string().min(1, "Informe a senha."),
});

/**
 * POST /api/auth/entrar — login por e-mail e senha, para os três papéis.
 *
 * O papel não é escolhido pelo usuário: vem do que está gravado no User.
 * A resposta diz para onde ir, e o middleware garante que ninguém acesse
 * painel de outro papel mesmo forçando a URL.
 */
export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "E-mail ou senha inválidos." }, { status: 400 });
  }

  const email = normalizarEmail(parsed.data.email);
  const ip = ipDoCliente(req);
  const chaves = [`email:${email}`, `ip:${ip}`];

  await faxinaEventual();

  if (await loginBloqueado(chaves)) {
    return NextResponse.json(
      {
        error: `Muitas tentativas seguidas. Espere ${LOGIN_JANELA_MINUTOS} minutos e tente de novo, ou redefina sua senha.`,
      },
      { status: 429 }
    );
  }

  const user = await autenticar(email, parsed.data.senha);

  if (!user) {
    await registrarFalhaLogin(chaves);
    // Mensagem única de propósito: dizer qual dos dois errou revela quais
    // e-mails têm conta na plataforma.
    return NextResponse.json({ error: "E-mail ou senha incorretos." }, { status: 401 });
  }

  await limparFalhasLogin(chaves);
  await criarSessao(user.id, user.role, {
    ip,
    userAgent: userAgentDoCliente(req),
  });

  return NextResponse.json({ ok: true, destino: destinoPorPapel(user.role) });
}
