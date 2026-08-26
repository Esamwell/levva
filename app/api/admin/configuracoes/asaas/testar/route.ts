import { NextResponse } from "next/server";
import { exigirPapel } from "../../../../../../lib/auth";
import { testarConexaoAsaas } from "../../../../../../lib/asaas";

/** POST — valida a chave configurada chamando a API do Asaas de verdade. */
export async function POST() {
  const session = await exigirPapel("ADMIN");
  if (!session) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const resultado = await testarConexaoAsaas();
  if (!resultado.ok) {
    return NextResponse.json({ error: resultado.erro }, { status: 400 });
  }

  return NextResponse.json(resultado);
}
