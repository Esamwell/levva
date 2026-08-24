import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionEdge, SESSION_COOKIE_NAME } from "./lib/auth";

/**
 * Protege /pai, /motorista (exceto /motorista/cadastro) e /admin por sessão
 * + papel. O cadastro é o ponto de entrada de motorista novo, ainda sem
 * conta, então fica público.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Busca do pai e cadastro de motorista são o funil de entrada —
  // ninguém tem sessão ainda nesse ponto, então ficam públicos.
  const publico =
    pathname.startsWith("/motorista/cadastro") || pathname === "/pai";

  const protegido =
    !publico &&
    (pathname.startsWith("/pai") ||
      pathname.startsWith("/motorista") ||
      pathname.startsWith("/admin"));

  if (!protegido) return NextResponse.next();

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

  return NextResponse.next();
}

export const config = {
  matcher: ["/pai/:path*", "/motorista/:path*", "/admin/:path*"],
};
