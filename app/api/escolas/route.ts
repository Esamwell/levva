import { NextResponse } from "next/server";
import { db } from "../../../lib/db";
import { normalizarBusca } from "../../../lib/texto";

/** GET /api/escolas?q=texto — autocomplete de escolas por nome, sem sensibilidade a acento. */
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q") ?? "";

  if (!q.trim()) {
    const escolas = await db.escola.findMany({ take: 8, orderBy: { nome: "asc" } });
    return NextResponse.json({ escolas });
  }

  const termo = normalizarBusca(q);
  const todas = await db.escola.findMany({ orderBy: { nome: "asc" } });
  const escolas = todas.filter((e) => normalizarBusca(e.nome).includes(termo)).slice(0, 8);
  return NextResponse.json({ escolas });
}
