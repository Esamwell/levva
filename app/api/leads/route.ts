import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "../../../lib/db";
import { geocodeEndereco } from "../../../lib/geo";
import { normalizarTelefone } from "../../../lib/auth";

/**
 * POST /api/leads
 * Cria um lead quando o pai solicita contato com um transportador.
 * Sem cadastro obrigatório pro pai (é gratuito e sem fricção, conforme o
 * plano de negócio) — então esse endpoint cria o User+Pai+Filho na hora,
 * a partir dos dados do formulário de contato, se ainda não existirem.
 *
 * Fase 1: fica com status AGUARDANDO até o admin repassar manualmente.
 */
const leadSchema = z.object({
  nomePai: z.string().min(2),
  telefonePai: z.string().min(10),
  enderecoPai: z.string().min(4),
  nomeFilho: z.string().min(2),
  escolaId: z.string(),
  motoristaId: z.string(),
});

export async function POST(req: Request) {
  const parsed = leadSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;
  const telefone = normalizarTelefone(data.telefonePai);

  const ponto = await geocodeEndereco(data.enderecoPai);
  if (!ponto) {
    return NextResponse.json(
      { error: "Não conseguimos localizar esse endereço." },
      { status: 422 }
    );
  }

  const lead = await db.$transaction(async (tx) => {
    let user = await tx.user.findUnique({ where: { telefone }, include: { pai: true } });

    if (!user) {
      user = await tx.user.create({
        data: {
          role: "PAI",
          nome: data.nomePai,
          telefone,
          pai: { create: { endereco: data.enderecoPai, lat: ponto.lat, lng: ponto.lng } },
        },
        include: { pai: true },
      });
    }
    if (!user.pai) {
      // usuário existia mas ainda não tinha perfil de pai — não deveria
      // acontecer em uso normal, mas cobre o caso de telefone reaproveitado
      throw new Error("Telefone já cadastrado com outro papel.");
    }

    const filho = await tx.filho.create({
      data: { paiId: user.pai.id, nome: data.nomeFilho, escolaId: data.escolaId },
    });

    return tx.lead.create({
      data: {
        paiId: user.pai.id,
        filhoId: filho.id,
        motoristaId: data.motoristaId,
        status: "AGUARDANDO",
      },
    });
  });

  // TODO: notificar admin (WhatsApp/e-mail) que há um novo lead aguardando repasse

  return NextResponse.json({ ok: true, leadId: lead.id }, { status: 201 });
}
