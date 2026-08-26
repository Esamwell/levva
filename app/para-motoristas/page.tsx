import Link from "next/link";
import { ArrowLeft, Check, Wallet, UserCheck, Inbox, Sparkles, LifeBuoy, Users } from "lucide-react";
import { Logo } from "../../components/logo";
import AnimatedContent from "../../components/AnimatedContent";
import { TAXA_MOVA_PERCENTUAL, DESTAQUE_PRECO_CENTAVOS } from "../../lib/financeiro";

function formatarReais(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const BENEFICIOS = [
  {
    icon: UserCheck,
    titulo: "Perfil verificado",
    texto: "Selo de documentação conferida — é isso que faz uma família nova confiar em você antes de conhecer pessoalmente.",
  },
  {
    icon: Inbox,
    titulo: "Leads organizados",
    texto: "Famílias interessadas chegam direto no seu painel, com escola, endereço e status de cada conversa — sem depender só do WhatsApp.",
  },
  {
    icon: Wallet,
    titulo: "Controle financeiro",
    texto: "Cada contrato fechado com valor, taxa e próximo vencimento, num painel só — em vez de caderno ou planilha solta.",
  },
  {
    icon: Users,
    titulo: "Seus alunos num só lugar",
    texto: "Quem você transporta hoje, de qual escola, e o contato do responsável, sempre à mão.",
  },
  {
    icon: LifeBuoy,
    titulo: "Suporte direto",
    texto: "Chamado pela plataforma quando precisar — sem depender de achar o contato certo.",
  },
  {
    icon: Sparkles,
    titulo: "Destaque opcional",
    texto: `Por ${formatarReais(DESTAQUE_PRECO_CENTAVOS)}/mês, apareça no topo da busca com um selo — só quem quiser.`,
  },
];

const FAQ = [
  {
    pergunta: "Por que não combinar direto com a família e pular a taxa?",
    resposta:
      "Pode — ninguém te prende. Mas o perfil que trouxe aquela família até você continua ativo, atraindo leads novos toda semana, com verificação, avaliações e um painel organizando tudo. A taxa é o custo de ter esse sistema trabalhando pra você o tempo todo, não só na hora do primeiro contato.",
  },
  {
    pergunta: "Quem escolhe se eu absorvo a taxa ou repasso pro responsável?",
    resposta: "Você, contrato a contrato, na hora de fechar. Dá pra trocar de ideia a cada família.",
  },
  {
    pergunta: "Tem fidelidade ou multa pra sair?",
    resposta: "Não. Sem mensalidade, sem contrato de permanência — você usa enquanto fizer sentido pra você.",
  },
  {
    pergunta: "O que ainda está por vir?",
    resposta:
      "Cobrança automática dos responsáveis e rastreamento em tempo real estão no radar, mas ainda não estão no ar — quando estiverem, avisamos por aqui.",
  },
];

export default function ParaMotoristasPage() {
  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-cream-line bg-white px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link href="/" className="flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-navy">
            <ArrowLeft className="h-4 w-4" /> Site
          </Link>
          <Logo on="light" size="sm" />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
        <AnimatedContent distance={20} duration={0.6}>
          <span className="font-mono text-xs uppercase tracking-widest text-sage">Para motoristas</span>
          <h1 className="mt-3 max-w-2xl font-serif text-4xl leading-tight text-navy md:text-5xl">
            Sem mensalidade. Você só paga quando fecha.
          </h1>
          <p className="mt-4 max-w-xl text-ink-soft">
            Cadastro e listagem grátis. A Mova só ganha uma taxa de {TAXA_MOVA_PERCENTUAL}% em cima do valor
            combinado, e só quando um contrato fecha de verdade — sem cobrar nada de quem ainda está começando.
          </p>
          <Link
            href="/motorista/cadastro"
            className="mt-8 inline-flex items-center justify-center rounded-full bg-navy px-6 py-3 text-sm font-bold text-white hover:bg-navy/90"
          >
            Cadastrar meu veículo →
          </Link>
        </AnimatedContent>

        <AnimatedContent distance={20} duration={0.6} className="mt-16">
          <h2 className="font-serif text-2xl text-navy">Como funciona a taxa</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              { n: "1", t: "Cadastro grátis", d: "Envie seus documentos e seu perfil entra na fila de verificação. Sem custo nenhum." },
              { n: "2", t: "Você recebe leads", d: "Famílias da sua região encontram seu perfil e pedem contato direto pelo painel." },
              {
                n: "3",
                t: `Só ${TAXA_MOVA_PERCENTUAL}% quando fecha`,
                d: "Ao fechar, você informa o valor combinado e escolhe se absorve a taxa ou repassa pro responsável.",
              },
            ].map((s) => (
              <div key={s.n} className="rounded-2xl border border-cream-line bg-white p-5">
                <span className="font-mono text-2xl text-amber-600">{s.n}</span>
                <p className="mt-2 font-semibold text-navy">{s.t}</p>
                <p className="mt-1 text-sm text-ink-soft">{s.d}</p>
              </div>
            ))}
          </div>
        </AnimatedContent>

        <AnimatedContent distance={20} duration={0.6} className="mt-16">
          <h2 className="font-serif text-2xl text-navy">O que você tem, sem custo nenhum extra</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {BENEFICIOS.map((b) => (
              <div key={b.titulo} className="flex gap-3.5 rounded-2xl border border-cream-line bg-white p-5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-soft/40 text-navy">
                  <b.icon className="h-4 w-4" strokeWidth={1.75} />
                </div>
                <div>
                  <p className="font-semibold text-navy">{b.titulo}</p>
                  <p className="mt-0.5 text-sm text-ink-soft">{b.texto}</p>
                </div>
              </div>
            ))}
          </div>
        </AnimatedContent>

        <AnimatedContent distance={20} duration={0.6} className="mt-16">
          <h2 className="font-serif text-2xl text-navy">Perguntas frequentes</h2>
          <div className="mt-6 space-y-4">
            {FAQ.map((f) => (
              <div key={f.pergunta} className="rounded-2xl border border-cream-line bg-white p-5">
                <p className="flex items-start gap-2 font-semibold text-navy">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-sage" strokeWidth={2.5} />
                  {f.pergunta}
                </p>
                <p className="mt-1.5 pl-6 text-sm text-ink-soft">{f.resposta}</p>
              </div>
            ))}
          </div>
        </AnimatedContent>

        <AnimatedContent distance={20} duration={0.6} className="mt-16 rounded-[20px] bg-navy p-10 text-center text-white">
          <h2 className="font-serif text-3xl">Pronto pra começar?</h2>
          <p className="mx-auto mt-2 max-w-md text-white/70">
            Leva uns 5 minutos. Nossa equipe confere seus documentos e libera seu perfil pras famílias da sua região.
          </p>
          <Link
            href="/motorista/cadastro"
            className="mt-6 inline-flex items-center justify-center rounded-full bg-amber px-6 py-3 text-sm font-bold text-navy hover:bg-amber/90"
          >
            Cadastrar meu veículo →
          </Link>
        </AnimatedContent>
      </main>
    </div>
  );
}
