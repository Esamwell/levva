import { NextResponse } from "next/server";
import { z } from "zod";
import { exigirPapel } from "../../../../../lib/auth";
import { listarConfiguracoesAsaas, salvarChaveAsaas } from "../../../../../lib/asaas";

/** GET — status dos dois ambientes (produção e sandbox), sem nunca devolver a chave inteira pro navegador. */
export async function GET() {
  const session = await exigirPapel("ADMIN");
  if (!session) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  return NextResponse.json({ ambientes: await listarConfiguracoesAsaas() });
}

const schema = z.object({
  ambiente: z.enum(["SANDBOX", "PRODUCAO"]),
  apiKey: z.string().trim().min(10),
});

/** PUT — admin salva/substitui a chave de um dos dois ambientes (não mexe em qual está ativo). */
export async function PUT(req: Request) {
  const session = await exigirPapel("ADMIN");
  if (!session) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await salvarChaveAsaas(parsed.data.ambiente, parsed.data.apiKey);

  return NextResponse.json({ ok: true });
}
