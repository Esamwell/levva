import { NextResponse } from "next/server";
import { db } from "../../../lib/db";

/** GET /api/escolas?q=texto — autocomplete de escolas por nome. */
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q") ?? "";
  const escolas = await db.escola.findMany({
    where: q ? { nome: { contains: q, mode: "insensitive" } } : {},
    take: 8,
    orderBy: { nome: "asc" },
  });
  return NextResponse.json({ escolas });
}
