/**
 * Upload de arquivos (documentos do motorista, fotos de veículo).
 *
 * Padrão: salva em disco local, em public/uploads — funciona direto na
 * VPS sem custo nenhum, mas some se a pasta não for persistida por
 * volume Docker. Se quiser trocar por S3/Cloudflare R2 depois, troque só
 * a função `salvarArquivo` abaixo — o contrato (recebe File, devolve URL)
 * não muda, então nenhuma outra parte do app precisa saber a diferença.
 */

import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const EXTENSOES_PERMITIDAS = [".pdf", ".jpg", ".jpeg", ".png", ".webp"];
const TAMANHO_MAX_BYTES = 10 * 1024 * 1024; // 10MB

export async function salvarArquivo(
  file: File,
  categoria: string
): Promise<{ url: string }> {
  const ext = path.extname(file.name).toLowerCase();
  if (!EXTENSOES_PERMITIDAS.includes(ext)) {
    throw new Error(`Tipo de arquivo não permitido: ${ext}`);
  }
  if (file.size > TAMANHO_MAX_BYTES) {
    throw new Error("Arquivo maior que 10MB.");
  }

  const nomeArquivo = `${categoria}-${randomUUID()}${ext}`;
  const dir = path.join(UPLOAD_DIR, categoria);
  await mkdir(dir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, nomeArquivo), buffer);

  return { url: `/uploads/${categoria}/${nomeArquivo}` };

  // --- Trocar por S3/R2 na VPS, se preferir não depender do disco local:
  // const client = new S3Client({ region, credentials, endpoint });
  // await client.send(new PutObjectCommand({ Bucket, Key: nomeArquivo, Body: buffer }));
  // return { url: `${process.env.CDN_URL}/${nomeArquivo}` };
}
