import { NextResponse } from "next/server";
import { db } from "../../../../lib/db";
import { exigirPapel } from "../../../../lib/auth";
import { enviarEmail, emailMotoristaReenviouCadastro, urlBase } from "../../../../lib/email";
import { dataElegivelReanalise } from "../../../../lib/aprovacao";

/**
 * POST /api/motorista/solicitar-reanalise — o próprio motorista reprovado
 * pede pra voltar pra fila de aprovação, sem precisar criar outra conta.
 * Só libera depois do prazo de espera (ver DIAS_ESPERA_REANALISE); antes
 * disso devolve quantos dias faltam pro painel mostrar certinho.
 */
export async function POST() {
  const session = await exigirPapel("MOTORISTA");
  if (!session) {
    return NextResponse.json({ error: "Sem sessão de motorista." }, { status: 401 });
  }

  const motorista = await db.motorista.findUnique({
    where: { userId: session.userId },
    include: { user: { select: { nome: true } } },
  });
  if (!motorista) {
    return NextResponse.json({ error: "Perfil de motorista não encontrado." }, { status: 404 });
  }

  if (motorista.statusAprovacao !== "REPROVADO") {
    return NextResponse.json({ error: "Seu cadastro não está reprovado." }, { status: 400 });
  }

  if (motorista.reprovadoEm) {
    const elegivelEm = dataElegivelReanalise(motorista.reprovadoEm);
    if (elegivelEm > new Date()) {
      return NextResponse.json(
        { error: `Você poderá solicitar uma nova análise a partir de ${elegivelEm.toLocaleDateString("pt-BR")}.` },
        { status: 400 }
      );
    }
  }

  await db.motorista.update({ where: { id: motorista.id }, data: { statusAprovacao: "PENDENTE" } });

  try {
    const admins = await db.user.findMany({ where: { role: "ADMIN" }, select: { email: true } });
    const conteudo = emailMotoristaReenviouCadastro({
      motoristaNome: motorista.user.nome,
      link: `${urlBase()}/admin/motoristas/${motorista.id}`,
    });
    await Promise.all(admins.map((a) => enviarEmail({ para: a.email, ...conteudo })));
  } catch (err) {
    console.error("Reanálise solicitada, mas falha ao avisar o admin:", err);
  }

  return NextResponse.json({ ok: true });
}
