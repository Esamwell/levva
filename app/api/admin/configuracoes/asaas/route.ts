import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "../../../../../lib/db";
import { exigirPapel } from "../../../../../lib/auth";
import { salvarConfigAsaas } from "../../../../../lib/asaas";

/** GET — status atual, sem nunca devolver a chave inteira pro navegador. */
export async function GET() {
  const session = await exigirPapel("ADMIN");
  if (!session) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const config = await db.configuracaoAsaas.findUnique({ where: { id: "asaas" } });

  return NextResponse.json({
    configurado: !!config?.apiKeyCifrada,
    ambiente: config?.ambiente ?? "SANDBOX",
    contaNome: config?.contaNome ?? null,
    contaEmail: config?.contaEmail ?? null,
    testadoEm: config?.testadoEm ?? null,
    atualizadoEm: config?.atualizadoEm ?? null,
  });
}

const schema = z.object({
  // Vazio/omitido = mantém a chave já salva (dá pra só trocar o ambiente).
  apiKey: z.string().trim().min(10).optional(),
  ambiente: z.enum(["SANDBOX", "PRODUCAO"]),
});

/** PUT — admin troca a chave e/ou o ambiente. */
export async function PUT(req: Request) {
  const session = await exigirPapel("ADMIN");
  if (!session) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await salvarConfigAsaas(parsed.data);

  return NextResponse.json({ ok: true });
}
