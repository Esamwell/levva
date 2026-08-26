import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionEdge, SESSION_COOKIE_NAME } from "./lib/session-edge";

/**
 * Portão de entrada de /pai, /motorista e /admin.
 *
 * Roda em edge runtime, onde o Prisma não alcança — por isso importa de
 * lib/session-edge.ts, que não puxa banco nem bcrypt. Aqui a checagem é só
 * da assinatura do JWT: rápida, e suficiente pra redirecionar quem não tem
 * sessão sem carregar a página inteira. A verificação que vale é
 * `getSession()`, dentro de cada página e rota, porque ela confirma a sessão
 * contra o banco e pega sessão revogada e papel alterado.
 *
 * Públicos, porque são o funil de entrada de quem ainda não tem conta:
 * /pai (busca) e /motorista/cadastro.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const publico =
    pathname.startsWith("/motorista/cadastro") || pathname === "/pai";

  if (!publico) {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = await getSessionEdge(token);

    if (!session) {
      const entrar = new URL("/entrar", request.url);
      entrar.searchParams.set("redirect", pathname);
      return NextResponse.redirect(entrar);
    }

    const roleEsperado = pathname.startsWith("/pai")
      ? "PAI"
      : pathname.startsWith("/motorista")
      ? "MOTORISTA"
      : "ADMIN";

    if (session.role !== roleEsperado) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // Cabeçalhos de segurança saíram daqui — agora vêm de next.config.js
  // (headers()), que cobre toda rota, não só as que passam por este
  // matcher. Ver comentário lá.
  return NextResponse.next();
}

export const config = {
  matcher: ["/pai/:path*", "/motorista/:path*", "/admin/:path*"],
};
