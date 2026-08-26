import { NextResponse } from "next/server";
import { exigirPapel } from "../../../../../../lib/auth";
import { marcarSaquePago } from "../../../../../../lib/saques";

/** POST /api/admin/saques/[id]/marcar-pago — admin confirma que já fez o Pix manual. */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await exigirPapel("ADMIN");
  if (!session) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const { id } = await params;
  const resultado = await marcarSaquePago(id);
  if (!resultado.ok) {
    return NextResponse.json({ error: resultado.erro }, { status: 400 });
  }

  return NextResponse.json(resultado);
}
