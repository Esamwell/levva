import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "../../../../../lib/db";
import { exigirPapel } from "../../../../../lib/auth";

const schema = z.object({
  // Só dígitos, 11 (CPF) ou 14 (CNPJ) — mesmo formato que o Asaas exige.
  cpfCnpj: z
    .string()
    .trim()
    .transform((v) => v.replace(/\D/g, ""))
    .refine((v) => v.length === 11 || v.length === 14, "CPF precisa ter 11 dígitos, CNPJ 14."),
});

/** PUT /api/admin/pais/[id] — hoje só atualiza o CPF/CNPJ, exigido pelo Asaas pra gerar cobrança. */
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await exigirPapel("ADMIN");
  if (!session) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const { id } = await params;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const pai = await db.pai.findUnique({ where: { id }, select: { id: true } });
  if (!pai) {
    return NextResponse.json({ error: "Responsável não encontrado." }, { status: 404 });
  }

  await db.pai.update({ where: { id }, data: { cpfCnpj: parsed.data.cpfCnpj } });

  return NextResponse.json({ ok: true });
}
