/**
 * Seed inicial de escolas em Salvador/Lauro de Freitas.
 * Sem isso a busca do pai (/api/busca) não encontra nada, porque o
 * match de escola depende de já existir um registro na tabela Escola.
 *
 * Coordenadas são aproximadas (centro do bairro) — ajustar depois com
 * o endereço exato de cada escola conforme forem sendo confirmadas.
 *
 * Rodar com: npm run db:seed
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const ESCOLAS = [
  { nome: "Colégio Salesiano", bairro: "Barra", lat: -13.0111, lng: -38.5217 },
  { nome: "Escola Sartre", bairro: "Pituba", lat: -13.0064, lng: -38.4650 },
  { nome: "Colégio Antônio Vieira", bairro: "Graça", lat: -12.9958, lng: -38.5147 },
  { nome: "Colégio Módulo", bairro: "Itaigara", lat: -12.9903, lng: -38.4581 },
  { nome: "Colégio Dendê da Serra", bairro: "Itaigara", lat: -12.9911, lng: -38.4600 },
  { nome: "Colégio Marista Vitória", bairro: "Vitória", lat: -13.0000, lng: -38.5219 },
  { nome: "Escola Parque", bairro: "Patamares", lat: -12.9611, lng: -38.3856 },
  { nome: "Colégio Nossa Senhora das Graças", bairro: "Graça", lat: -12.9964, lng: -38.5142 },
  { nome: "Colégio da Polícia Militar", bairro: "Cabula", lat: -12.9539, lng: -38.4400 },
  { nome: "Colégio Integrado de Lauro de Freitas", bairro: "Centro", lat: -12.8944, lng: -38.3272 },
];

async function main() {
  for (const escola of ESCOLAS) {
    const existente = await db.escola.findFirst({ where: { nome: escola.nome } });
    if (existente) continue;
    await db.escola.create({
      data: { ...escola, cidade: escola.bairro === "Centro" ? "Lauro de Freitas" : "Salvador" },
    });
  }
  console.log(`Seed concluído: ${ESCOLAS.length} escolas verificadas/criadas.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
