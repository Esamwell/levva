import Link from "next/link";
import { ArrowLeft, Check, ShieldCheck, Search, Star, LifeBuoy, MapPin, CreditCard, Ban } from "lucide-react";
import { Logo } from "../../components/logo";
import AnimatedContent from "../../components/AnimatedContent";

const BENEFICIOS = [
  {
    icon: ShieldCheck,
    titulo: "Motoristas 100% verificados",
    texto: "CNH, curso de transporte escolar e antecedentes criminais checados antes de qualquer motorista aparecer na busca.",
  },
  {
    icon: Search,
    titulo: "Busca gratuita, sem cadastro",
    texto: "Digite seu endereço e a escola do seu filho e veja quem atende sua região na hora, sem precisar criar conta.",
  },
  {
    icon: Star,
    titulo: "Fotos reais e avaliações",
    texto: "Foto do veículo e do motorista, nota e comentários de outras famílias da sua região, escolas atendidas e faixa de preço, sem letra miúda.",
  },
  {
    icon: CreditCard,
    titulo: "Pagamento organizado",
    texto: "Pague direto pela Mova (Pix, boleto ou cartão), com cobrança recorrente no ciclo combinado. Nada de combinar por fora.",
  },
  {
    icon: LifeBuoy,
    titulo: "Suporte direto",
    texto: "Chamado pela plataforma quando precisar, sem depender de achar o contato certo do motorista.",
  },
  {
    icon: Ban,
    titulo: "Sem fidelidade",
    texto: "Não gostou do motorista ou mudou de bairro? Busque outro quando quiser, sem multa nem contrato de permanência com a Mova.",
  },
  {
    icon: MapPin,
    titulo: "Rastreamento ao vivo",
    texto: "Acompanhe a van no horário da rota, com total transparência sobre onde seu filho está.",
    emBreve: true,
  },
];

const FAQ = [
  {
    pergunta: "É mesmo de graça pra mim?",
    resposta:
      "Sim. Buscar, comparar e solicitar contato com um motorista não custa nada pra família. A Mova cobra uma taxa do motorista sobre o valor do contrato fechado, não de você.",
  },
  {
    pergunta: "Preciso criar conta pra buscar?",
    resposta: "Não. A busca é livre. A conta só entra na hora de solicitar contato com um motorista, pra você acompanhar o andamento depois.",
  },
  {
    pergunta: "Como funciona o pagamento do transporte?",
    resposta:
      "Direto pela Mova, via Pix, boleto ou cartão, no ciclo combinado com o motorista (mensal, trimestral, semestral ou anual). Você recebe o link de pagamento por e-mail a cada cobrança.",
  },
  {
    pergunta: "E se eu não gostar do motorista escolhido?",
    resposta: "Você pode buscar outro transportador verificado a qualquer momento, sem fidelidade nem multa.",
  },
];

export default function ParaFamiliasPage() {
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
          <span className="font-mono text-xs uppercase tracking-widest text-sage">Para famílias</span>
          <h1 className="mt-3 max-w-2xl font-serif text-4xl leading-tight text-navy md:text-5xl">
            Transporte escolar verificado, sem custo pra você.
          </h1>
          <p className="mt-4 max-w-xl text-ink-soft">
            Busca gratuita, sem cadastro obrigatório. Compare transportadores da sua região com CNH, curso e
            antecedentes checados, e feche direto com quem passar mais confiança.
          </p>
          <Link
            href="/pai"
            className="mt-8 inline-flex items-center justify-center rounded-full bg-navy px-6 py-3 text-sm font-bold text-white hover:bg-navy/90"
          >
            Buscar transporte →
          </Link>
        </AnimatedContent>

        <AnimatedContent distance={20} duration={0.6} className="mt-16">
          <h2 className="font-serif text-2xl text-navy">Como funciona</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              { n: "1", t: "Você busca", d: "Digite seu endereço e a escola do seu filho. Sem cadastro, sem complicação." },
              { n: "2", t: "Você compara", d: "Veja quem atende sua região, com fotos reais, avaliações e faixa de preço." },
              { n: "3", t: "Você solicita contato", d: "A Mova encaminha direto pro transportador escolhido, sem intermediário burocrático." },
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
          <h2 className="font-serif text-2xl text-navy">O que você tem, sem pagar nada por isso</h2>
          <p className="mt-1 text-sm text-ink-soft">Incluindo o que já está no ar e o que está a caminho.</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {BENEFICIOS.map((b) => (
              <div
                key={b.titulo}
                className={
                  "flex gap-3.5 rounded-2xl border bg-white p-5" +
                  (b.emBreve ? " border-dashed border-amber" : " border-cream-line")
                }
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-soft/40 text-navy">
                  <b.icon className="h-4 w-4" strokeWidth={1.75} />
                </div>
                <div>
                  <p className="flex items-center gap-2 font-semibold text-navy">
                    {b.titulo}
                    {b.emBreve && (
                      <span className="rounded-full bg-amber px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-navy">
                        Em breve
                      </span>
                    )}
                  </p>
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
          <h2 className="font-serif text-3xl">Pronto pra encontrar o transporte certo?</h2>
          <p className="mx-auto mt-2 max-w-md text-white/70">
            Busque por endereço e escola e veja os transportadores verificados da sua região agora mesmo.
          </p>
          <Link
            href="/pai"
            className="mt-6 inline-flex items-center justify-center rounded-full bg-amber px-6 py-3 text-sm font-bold text-navy hover:bg-amber/90"
          >
            Buscar transporte →
          </Link>
        </AnimatedContent>
      </main>
    </div>
  );
}
