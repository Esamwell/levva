import { NextResponse } from "next/server";
import { salvarArquivo, CATEGORIAS_VALIDAS } from "../../../lib/storage";
import { getSession } from "../../../lib/auth";
import { db } from "../../../lib/db";

/**
 * POST /api/upload — multipart/form-data com os campos "file" e "categoria".
 *
 * Exige sessão de motorista. Antes desta checagem existir, a rota aceitava
 * arquivo de qualquer pessoa da internet, sem limite de quantidade: enchia
 * o disco da VPS e transformava o servidor em hospedagem de arquivo alheio.
 *
 * Por isso o cadastro cria a conta primeiro e sobe os documentos depois —
 * quando já existe sessão pra amarrar cada arquivo ao dono dele.
 *
 * O arquivo salvo é gravado direto no registro do motorista; o cliente não
 * precisa devolver a URL depois, e ninguém consegue apontar o documento de
 * um motorista para o cadastro de outro.
 */

/** Campo do Motorista que cada categoria preenche (exceto crlv e galeria, tratadas à parte). */
const CAMPO_POR_CATEGORIA: Record<string, string> = {
  cnh: "cnhDocUrl",
  "curso-transporte": "cursoDocUrl",
  antecedentes: "antecedentesDocUrl",
  rosto: "fotoRosto",
  video: "videoUrl",
};

// Atualizar um desses três depois de já aprovado (ou reprovado) manda o
// cadastro de volta pra fila do admin — documento novo precisa ser
// conferido de novo antes de continuar valendo como aprovação.
const CATEGORIAS_DOC_OFICIAL = new Set(["cnh", "curso-transporte", "antecedentes"]);

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "MOTORISTA") {
    return NextResponse.json({ error: "Sem sessão de motorista." }, { status: 401 });
  }

  const motorista = await db.motorista.findUnique({
    where: { userId: session.userId },
    select: { id: true, statusAprovacao: true },
  });
  if (!motorista) {
    return NextResponse.json({ error: "Perfil de motorista não encontrado." }, { status: 404 });
  }

  const form = await req.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ error: "Envio inválido." }, { status: 400 });
  }

  const file = form.get("file");
  const categoria = form.get("categoria");

  if (!(file instanceof File) || typeof categoria !== "string") {
    return NextResponse.json({ error: "Envie 'file' e 'categoria'." }, { status: 400 });
  }
  if (!CATEGORIAS_VALIDAS.includes(categoria)) {
    return NextResponse.json({ error: "Categoria inválida." }, { status: 400 });
  }

  let url: string;
  try {
    ({ url } = await salvarArquivo(file, categoria));
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Falha no upload." },
      { status: 400 }
    );
  }

  // CRLV vale pelos veículos; galeria acumula (não substitui); as demais
  // categorias são um campo só, sobrescrito.
  if (categoria === "crlv") {
    await db.veiculo.updateMany({
      where: { motoristaId: motorista.id },
      data: { fotoUrl: url },
    });
  } else if (categoria === "galeria") {
    await db.motorista.update({
      where: { id: motorista.id },
      data: { fotos: { push: url } },
    });
  } else {
    const campo = CAMPO_POR_CATEGORIA[categoria];
    const dadosExtra =
      CATEGORIAS_DOC_OFICIAL.has(categoria) && motorista.statusAprovacao !== "PENDENTE"
        ? { statusAprovacao: "PENDENTE" as const, cursoTransporte: false, antecedentesOk: false }
        : {};
    await db.motorista.update({
      where: { id: motorista.id },
      data: { [campo]: url, ...dadosExtra },
    });
  }

  return NextResponse.json({ url }, { status: 201 });
}
