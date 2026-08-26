import { NextResponse } from "next/server";
import { db } from "../../../../../../lib/db";
import { exigirPapel } from "../../../../../../lib/auth";
import { enviarEmail, emailMotoristaAprovado, urlBase } from "../../../../../../lib/email";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await exigirPapel("ADMIN");
  if (!session) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const { id } = await params;

  const motorista = await db.motorista.findUnique({
    where: { id },
    include: { user: { select: { nome: true, email: true } } },
  });
  if (!motorista) {
    return NextResponse.json({ error: "Motorista não encontrado." }, { status: 404 });
  }

  // Aprovar significa que o admin conferiu os três documentos de fato —
  // é isso, sozinho, que libera o motorista pra aparecer nas buscas.
  // Sem mensalidade envolvida (modelo antigo aposentado).
  await db.motorista.update({
    where: { id },
    data: {
      statusAprovacao: "APROVADO",
      antecedentesOk: true,
      cursoTransporte: true,
      motivoReprovacao: null,
      reprovadoEm: null,
    },
  });

  try {
    await enviarEmail({
      para: motorista.user.email,
      ...emailMotoristaAprovado({
        nome: motorista.user.nome,
        link: `${urlBase()}/motorista`,
      }),
    });
  } catch (err) {
    console.error("Motorista aprovado, mas falha ao enviar o e-mail:", err);
  }

  return NextResponse.json({ ok: true });
}
