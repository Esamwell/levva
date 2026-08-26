import { NextResponse } from "next/server";
import { z } from "zod";
import { exigirPapel } from "../../../../../../lib/auth";
import { ativarAmbienteAsaas } from "../../../../../../lib/asaas";

const schema = z.object({ ambiente: z.enum(["SANDBOX", "PRODUCAO"]) });

/** POST — troca qual ambiente (produção/sandbox) está ativo, sem pedir a chave de novo. */
export async function POST(req: Request) {
  const session = await exigirPapel("ADMIN");
  if (!session) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const resultado = await ativarAmbienteAsaas(parsed.data.ambiente);
  if (!resultado.ok) {
    return NextResponse.json({ error: resultado.erro }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
