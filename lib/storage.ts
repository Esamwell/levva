/**
 * Upload e leitura de documentos do motorista (CNH, curso, antecedentes, CRLV).
 *
 * IMPORTANTE: estes arquivos NÃO ficam em public/. Certidão de antecedentes e
 * CNH são dado pessoal — antecedentes é dado sensível pela LGPD — e tudo que
 * o Next.js serve de public/ é público de verdade, sem checagem de sessão.
 * Por isso gravamos fora da árvore servida e entregamos os arquivos só através
 * de /api/documentos, que confere quem está pedindo antes de responder.
 *
 * O caminho é configurável por UPLOAD_DIR; no container ele aponta pra um
 * volume Docker, então os documentos sobrevivem a rebuild.
 *
 * Trocar por S3/R2 depois é mexer só em `salvarArquivo` e `lerArquivo` —
 * o resto do app só conhece a URL devolvida.
 */

import { writeFile, mkdir, readFile, stat } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads");

const TAMANHO_MAX_PADRAO_BYTES = 10 * 1024 * 1024; // 10MB
/** Vídeo do perfil pode ser maior que documento/foto — ver client_max_body_size no nginx. */
const TAMANHO_MAX_POR_CATEGORIA: Record<string, number> = {
  video: 40 * 1024 * 1024, // 40MB
};

/** Extensão -> tipos MIME aceitos pra ela. */
const TIPOS_PERMITIDOS: Record<string, string[]> = {
  ".pdf": ["application/pdf"],
  ".jpg": ["image/jpeg"],
  ".jpeg": ["image/jpeg"],
  ".png": ["image/png"],
  ".webp": ["image/webp"],
  ".mp4": ["video/mp4"],
};

export const CATEGORIAS_VALIDAS = ["cnh", "curso-transporte", "antecedentes", "crlv", "rosto", "galeria", "video"];

// Documento pessoal (CNH, antecedentes...) é dado sensível — servido só pra
// dono/admin via /api/documentos. Foto/vídeo de perfil é material que o
// motorista quer que a família veja: público, servido por /api/midia, sem
// checar sessão. Ver salvarArquivo() e as duas rotas de leitura.
const CATEGORIAS_PUBLICAS = new Set(["galeria", "video"]);
export function categoriaEhPublica(categoria: string): boolean {
  return CATEGORIAS_PUBLICAS.has(categoria);
}

/** Assinatura binária de cada formato, conferida no início do arquivo. */
const ASSINATURAS: Array<{ tipo: string; bytes: number[]; offset?: number }> = [
  { tipo: "application/pdf", bytes: [0x25, 0x50, 0x44, 0x46] }, // %PDF
  { tipo: "image/jpeg", bytes: [0xff, 0xd8, 0xff] },
  { tipo: "image/png", bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { tipo: "image/webp", bytes: [0x57, 0x45, 0x42, 0x50], offset: 8 }, // "WEBP" no offset 8
  { tipo: "video/mp4", bytes: [0x66, 0x74, 0x79, 0x70], offset: 4 }, // "ftyp" no offset 4
];

function conferirAssinatura(buffer: Buffer, tipoEsperado: string): boolean {
  const assinatura = ASSINATURAS.find((a) => a.tipo === tipoEsperado);
  if (!assinatura) return false;
  const offset = assinatura.offset ?? 0;
  if (buffer.length < offset + assinatura.bytes.length) return false;
  return assinatura.bytes.every((b, i) => buffer[offset + i] === b);
}

export type ArquivoSalvo = { url: string; caminhoRelativo: string };

/**
 * Grava o arquivo e devolve a URL de leitura (que passa pelo controle de acesso).
 * Valida três coisas: extensão, tipo declarado e assinatura binária real —
 * a última impede subir um executável renomeado pra .pdf.
 */
export async function salvarArquivo(file: File, categoria: string): Promise<ArquivoSalvo> {
  if (!CATEGORIAS_VALIDAS.includes(categoria)) {
    throw new Error("Categoria inválida.");
  }

  const ext = path.extname(file.name).toLowerCase();
  const tiposDaExtensao = TIPOS_PERMITIDOS[ext];
  if (!tiposDaExtensao) {
    throw new Error(`Tipo de arquivo não permitido: ${ext || "sem extensão"}`);
  }
  const limiteBytes = TAMANHO_MAX_POR_CATEGORIA[categoria] ?? TAMANHO_MAX_PADRAO_BYTES;
  if (file.size > limiteBytes) {
    throw new Error(`Arquivo maior que ${Math.round(limiteBytes / (1024 * 1024))}MB.`);
  }
  if (file.size === 0) {
    throw new Error("Arquivo vazio.");
  }
  if (!tiposDaExtensao.includes(file.type)) {
    throw new Error("O conteúdo do arquivo não corresponde à extensão.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!conferirAssinatura(buffer, file.type)) {
    throw new Error("O arquivo parece corrompido ou não é do tipo que diz ser.");
  }

  const nomeArquivo = `${categoria}-${randomUUID()}${ext}`;
  const dir = path.join(UPLOAD_DIR, categoria);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, nomeArquivo), buffer);

  const caminhoRelativo = `${categoria}/${nomeArquivo}`;
  const rota = categoriaEhPublica(categoria) ? "/api/midia" : "/api/documentos";
  return { url: `${rota}/${caminhoRelativo}`, caminhoRelativo };
}

export type ArquivoLido = { buffer: Buffer; tipo: string };

/**
 * Lê um documento já gravado. Só deve ser chamada depois de autorizar quem pede.
 * Resolve o caminho e confirma que ele continua dentro de UPLOAD_DIR — sem isso,
 * um "../../etc/passwd" no nome sairia da pasta.
 */
export async function lerArquivo(segmentos: string[]): Promise<ArquivoLido | null> {
  if (segmentos.length !== 2) return null;
  const [categoria, nome] = segmentos;

  if (!CATEGORIAS_VALIDAS.includes(categoria)) return null;
  if (!/^[A-Za-z0-9._-]+$/.test(nome)) return null;

  const alvo = path.resolve(UPLOAD_DIR, categoria, nome);
  const raiz = path.resolve(UPLOAD_DIR);
  if (alvo !== raiz && !alvo.startsWith(raiz + path.sep)) return null;

  try {
    const info = await stat(alvo);
    if (!info.isFile()) return null;
  } catch {
    return null;
  }

  const ext = path.extname(nome).toLowerCase();
  const tipo = TIPOS_PERMITIDOS[ext]?.[0];
  if (!tipo) return null;

  return { buffer: await readFile(alvo), tipo };
}

/** Extrai "categoria/arquivo" de uma URL gravada no banco. */
export function segmentosDaUrl(url: string | null | undefined): string[] | null {
  if (!url) return null;
  const prefixo = "/api/documentos/";
  if (!url.startsWith(prefixo)) return null;
  return url.slice(prefixo.length).split("/");
}
