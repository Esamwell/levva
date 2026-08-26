import Link from "next/link";
import { Check, Star, Bus } from "lucide-react";
import { MobileNav } from "./mobile-nav";
import CountUp from "../components/CountUp";
import AnimatedContent from "../components/AnimatedContent";
import SpotlightCard from "../components/SpotlightCard";
import Magnet from "../components/Magnet";
import ShinyText from "../components/ShinyText";
import GlassSurface from "../components/GlassSurface";
import { Logo } from "../components/logo";

/**
 * Landing page da Mova — porta da versão estática (levva-landing.html)
 * pro Next.js/Tailwind, usando os tokens definidos em tailwind.config.ts.
 *
 * Pra alterações rápidas de copy/estrutura, edite aqui. Pra alterações de
 * identidade visual (cor, tipografia), edite tailwind.config.ts primeiro —
 * ele é a fonte única de verdade e reflete em todo o app.
 */
export default function LandingPage() {
  return (
    <main>
      {/* NAV — vidro fosco fixo: translúcido + blur, pra não "quebrar" em cima
          do conteúdo ao rolar a página (antes era transparente sem fundo). */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between border-b border-black/10 bg-amber/85 px-[6vw] py-4 shadow-[0_1px_24px_rgba(0,0,0,0.08)] backdrop-blur-xl backdrop-saturate-150">
        <Logo on="light" size="md" />
        <div className="hidden md:flex items-center gap-9">
          <a href="#rota" className="text-sm text-navy/80 hover:text-navy">Como funciona</a>
          <a href="#quem-somos" className="text-sm text-navy/80 hover:text-navy">Quem somos</a>
          <a href="#motoristas" className="text-sm text-navy/80 hover:text-navy">Para motoristas</a>
          <Link href="/entrar" className="text-sm text-navy/80 hover:text-navy">Entrar</Link>
          <Magnet padding={40} magnetStrength={4}>
            <Link
              href="/pai"
              className="inline-flex items-center justify-center rounded-full bg-navy px-5 py-2.5 text-sm font-bold leading-none text-white transition hover:-translate-y-0.5"
            >
              Buscar transporte
            </Link>
          </Magnet>
        </div>
        <MobileNav />
      </nav>

      {/* HERO */}
      <header className="relative overflow-hidden bg-amber px-[6vw] pb-28 pt-40 text-navy">
        {/* Fundo decorativo: a rota até a escola, em opacidade bem baixa —
            ecoa o pin + van da logo e a seção de "paradas" mais abaixo,
            sem competir com o conteúdo por cima. */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <svg
            viewBox="0 0 1200 600"
            preserveAspectRatio="xMidYMid slice"
            className="h-full w-full"
          >
            <path
              d="M 40 480 C 280 380, 480 520, 720 300 C 860 200, 1000 260, 1160 150"
              fill="none"
              stroke="#111111"
              strokeOpacity="0.09"
              strokeWidth="3"
              strokeDasharray="2 14"
              strokeLinecap="round"
            />
            {/* Pontos calculados sobre a curva de verdade (fórmula de Bézier em
                t = 0, 0.5 e 1 de cada trecho) — antes eram aproximados a olho
                e ficavam soltos da linha. Curva mantida no meio do hero, longe
                do badge no topo e dos números embaixo. */}
            {[
              [40, 480],
              [380, 435],
              [720, 300],
              [932.5, 228.75],
              [1160, 150],
            ].map(([cx, cy]) => (
              <g key={cx}>
                <circle cx={cx} cy={cy} r="9" fill="none" stroke="#111111" strokeOpacity="0.14" strokeWidth="2" />
                <circle cx={cx} cy={cy} r="3" fill="#111111" fillOpacity="0.16" />
              </g>
            ))}
          </svg>
          <Bus
            className="absolute -right-6 top-16 h-24 w-24 text-navy/[0.07] sm:h-40 sm:w-40 md:h-52 md:w-52"
            strokeWidth={1.25}
          />
          <Bus
            className="absolute bottom-0 left-[8%] hidden h-24 w-24 -rotate-6 text-navy/[0.06] sm:block"
            strokeWidth={1.25}
          />
        </div>

        <div className="relative mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <GlassSurface
              width="fit-content"
              height={34}
              borderRadius={999}
              className="mb-6 gap-2 px-3.5 font-mono text-xs tracking-wide text-navy"
              brightness={95}
              opacity={0.5}
              backgroundOpacity={0.16}
            >
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-navy" />
              {/* Texto curto no celular pra caber numa linha só sem estourar a tela. */}
              <span className="whitespace-nowrap sm:hidden">SALVADOR · EM BREVE</span>
              <span className="hidden whitespace-nowrap sm:inline">
                SALVADOR &amp; LAURO DE FREITAS · CHEGANDO EM BREVE
              </span>
            </GlassSurface>
            <h1 className="font-serif text-5xl leading-[1.06] md:text-6xl">
              O trajeto mais importante do dia, em{" "}
              <ShinyText
                text="boas mãos"
                className="font-serif"
                color="#111111"
                shineColor="#FFFFFF"
                spread={80}
                speed={2.5}
              />
              .
            </h1>
            <p className="mt-6 max-w-md text-[17px] leading-relaxed text-navy/75">
              A Mova conecta famílias a transportadores escolares 100% verificados:
              CNH, curso e antecedentes checados antes de qualquer criança entrar na van.
            </p>
            <div className="mt-11 flex gap-8">
              <div>
                <div className="font-serif text-3xl">
                  <CountUp to={100} duration={1.4} />%
                </div>
                <div className="text-xs text-navy/60">motoristas verificados</div>
              </div>
              <div>
                <div className="font-serif text-3xl">0</div>
                <div className="text-xs text-navy/60">custo pra família</div>
              </div>
              <div>
                <div className="font-serif text-3xl">SSA</div>
                <div className="text-xs text-navy/60">bairro por bairro</div>
              </div>
            </div>
          </div>

          {/* Search card — conecta com a busca real em /pai */}
          <form
            action="/pai"
            className="rounded-[20px] bg-white p-2 shadow-2xl"
          >
            <div className="rounded-2xl bg-cream p-6">
              <div className="mb-4 font-mono text-[11px] uppercase tracking-wide text-ink-soft">
                Encontre o transporte do seu filho
              </div>
              <input
                name="endereco"
                placeholder="Seu endereço, em Salvador"
                className="mb-2.5 w-full rounded-xl border border-cream-line bg-white px-3.5 py-3 text-sm leading-normal outline-none focus:border-amber"
              />
              <input
                name="escola"
                placeholder="Nome da escola"
                className="mb-2.5 w-full rounded-xl border border-cream-line bg-white px-3.5 py-3 text-sm leading-normal outline-none focus:border-amber"
              />
              <button
                type="submit"
                className="mt-2 flex w-full items-center justify-center rounded-xl bg-navy py-3.5 text-sm font-bold leading-none text-white transition hover:bg-[#0C1730]"
              >
                Ver transportadores da minha região →
              </button>
              <div className="mt-3 text-center text-xs text-ink-soft">
                Gratuito para famílias ·{" "}
                <strong className="text-sage">lançamento no seu bairro em breve</strong>
              </div>
            </div>
          </form>
        </div>
      </header>

      {/* TRUST STRIP */}
      <div className="border-b border-cream-line bg-white px-[6vw] py-8">
        <AnimatedContent distance={30} duration={0.6} className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-7">
          {[
            "CNH categoria adequada, conferida",
            "Curso de transporte escolar em dia",
            "Antecedentes verificados",
            "Documentação do veículo em dia",
          ].map((item) => (
            <div key={item} className="flex items-center gap-2.5 text-sm font-medium text-ink-soft">
              <Check className="h-4 w-4 shrink-0 text-sage" strokeWidth={2.5} />
              {item}
            </div>
          ))}
        </AnimatedContent>
      </div>

      {/* ROTA / COMO FUNCIONA */}
      <section id="rota" className="bg-cream px-[6vw] py-28">
        <div className="mx-auto max-w-6xl">
          <AnimatedContent distance={24} duration={0.6}>
            <div className="mb-3.5 font-mono text-xs uppercase tracking-widest text-sage">
              A rota até o transporte certo
            </div>
            <h2 className="max-w-xl font-serif text-4xl leading-tight md:text-5xl">
              Do endereço de casa até o portão da escola, em quatro paradas.
            </h2>
          </AnimatedContent>

          <div className="relative mt-16 space-y-14 border-l-2 border-dashed border-sage/70 pl-9">
            {[
              ["Parada 01", "Você busca", "Digite seu endereço e a escola do seu filho. Sem cadastro, sem complicação."],
              ["Parada 02", "Você compara transportadores verificados", "Veja quem atende sua região e sua escola, com foto do veículo, do motorista, avaliações e faixa de preço."],
              ["Parada 03", "A Mova faz a ponte", "Solicite contato e a gente encaminha direto pro transportador escolhido, sem intermediário burocrático."],
              ["Parada 04", "Fechou, e agora é rotina", "Combine os detalhes direto com o transportador e avalie o serviço depois, pra ajudar outras famílias da sua região."],
            ].map(([tag, title, desc], i) => (
              <AnimatedContent key={tag} distance={24} duration={0.6} delay={i * 0.12} className="relative">
                <div className="absolute -left-[47px] top-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-sage bg-cream">
                  <span className="h-1.5 w-1.5 rounded-full bg-sage" />
                </div>
                <div className="mb-1.5 font-mono text-[11px] uppercase tracking-wide text-sage">{tag}</div>
                <h3 className="font-serif text-2xl">{title}</h3>
                <p className="mt-1.5 max-w-md text-sm leading-relaxed text-ink-soft">{desc}</p>
              </AnimatedContent>
            ))}
          </div>
        </div>
      </section>

      {/* QUEM SOMOS */}
      <section id="quem-somos" className="bg-white px-[6vw] py-28">
        <AnimatedContent
          distance={24}
          duration={0.6}
          className="mx-auto grid max-w-6xl items-center gap-16 lg:grid-cols-[1.05fr_0.95fr]"
        >
          <div>
            <div className="mb-3.5 font-mono text-xs uppercase tracking-widest text-sage">Quem somos</div>
            <h2 className="max-w-lg font-serif text-4xl leading-tight text-navy md:text-5xl">
              Nascemos da vontade de trazer segurança pras nossas crianças.
            </h2>
            <p className="mt-5 max-w-md leading-relaxed text-ink-soft">
              A Mova nasceu de uma pergunta que todo pai e mãe já se fez: quem está
              dirigindo a van do meu filho? Documento vencido, motorista sem
              antecedentes verificados, van sem seguro: histórias que a gente ouviu
              demais pra ficar de braços cruzados.
            </p>
            <p className="mt-4 max-w-md leading-relaxed text-ink-soft">
              Por isso criamos um jeito simples de verificar quem transporta as
              crianças de Salvador: CNH, curso de transporte escolar e antecedentes
              criminais checados antes de qualquer motorista aparecer numa busca. Sem
              comissão escondida, sem letra miúda. Só a tranquilidade de saber que
              seu filho está em boas mãos.
            </p>
          </div>

          <div className="flex justify-center lg:justify-end">
            <div className="flex h-44 w-44 items-center justify-center rounded-full bg-amber/10 sm:h-56 sm:w-56 lg:h-64 lg:w-64">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/mova-mark.png" alt="Mova" className="h-28 w-auto sm:h-36 lg:h-40" />
            </div>
          </div>
        </AnimatedContent>
      </section>

      {/* SHOWCASE */}
      <section id="motoristas" className="bg-amber px-[6vw] py-28 text-navy">
        <div className="mx-auto grid max-w-6xl items-center gap-16 lg:grid-cols-[0.95fr_1.05fr]">
          <AnimatedContent distance={24} duration={0.6}>
            <div className="mb-3.5 font-mono text-xs uppercase tracking-widest text-navy/70">
              Confiança à primeira vista
            </div>
            <h2 className="max-w-lg font-serif text-4xl leading-tight md:text-5xl">
              Um perfil que já responde a pergunta de todo pai: "posso confiar?"
            </h2>
            <p className="mt-4 max-w-md text-navy/70">
              Cada transportador aprovado na Mova mostra exatamente o que uma
              família precisa ver antes de decidir.
            </p>
            <ul className="mt-8 space-y-4">
              {[
                "Foto real do veículo e do motorista",
                "Selo de verificação documental",
                "Avaliações de outras famílias da região",
                "Escolas atendidas e faixa de preço, sem letra miúda",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-navy/85">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-navy" strokeWidth={2.5} />
                  {item}
                </li>
              ))}
            </ul>
          </AnimatedContent>

          {/* Driver card mockup */}
          <SpotlightCard
            spotlightColor="rgba(17, 17, 17, 0.12)"
            className="rounded-[20px] bg-white text-ink shadow-2xl"
          >
            <div className="relative h-44 bg-navy">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/marcos-andrade.jpg"
                alt="Marcos Andrade, motorista verificado da Mova, em frente à van escolar"
                className="h-full w-full object-cover"
              />
              <div className="absolute right-3.5 top-3.5 flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-sage shadow">
                <Check className="h-3.5 w-3.5" strokeWidth={3} /> Verificado
              </div>
            </div>
            <div className="p-6">
              <div className="font-serif text-xl">Marcos Andrade</div>
              <div className="mb-3.5 mt-1 flex items-center gap-1 text-sm">
                <span className="flex text-amber">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-amber" />
                  ))}
                </span>
                <span className="text-ink-soft">4.9 (38 avaliações)</span>
              </div>
              <div className="mb-4 flex flex-wrap gap-2">
                {["Monitor a bordo", "Ar-condicionado", "8 anos de experiência"].map((c) => (
                  <span key={c} className="rounded-full bg-sage-soft px-3 py-1 text-xs font-semibold text-sage">
                    {c}
                  </span>
                ))}
              </div>
              <div className="mb-4 text-sm text-ink-soft">
                <strong className="text-ink">Atende:</strong> Colégio Salesiano, Escola Sartre (Pituba, Itaigara)
              </div>
              <div className="flex items-center justify-between border-t border-cream-line pt-4">
                <div className="font-mono text-xs text-ink-soft">
                  a partir de<br /><strong className="font-sans text-base text-ink">R$ 420/mês</strong>
                </div>
                <div className="inline-flex items-center justify-center rounded-full bg-navy px-4.5 py-2.5 text-xs font-bold leading-none text-white">Ver perfil</div>
              </div>
            </div>
          </SpotlightCard>
        </div>
      </section>

      {/* DUAL CTA */}
      <section className="bg-white px-[6vw] py-28">
        <AnimatedContent distance={24} duration={0.6} className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2">
          <div className="rounded-[20px] bg-amber p-11 text-navy">
            <span className="mb-4 block font-mono text-xs uppercase tracking-wide text-navy/70">Para famílias</span>
            <h3 className="max-w-xs font-serif text-3xl">Encontre transporte verificado, sem custo.</h3>
            <p className="my-4 max-w-xs text-sm text-navy/75">
              Busque por endereço e escola, compare transportadores da sua
              região e feche direto, sem taxa, sem letrinha miúda.
            </p>
            <Link href="/pai" className="inline-flex items-center justify-center gap-2 rounded-full bg-navy px-5.5 py-3.5 text-sm font-bold leading-none text-white">
              Buscar transporte →
            </Link>
          </div>
          <div className="rounded-[20px] bg-navy p-11 text-white">
            <span className="mb-4 block font-mono text-xs uppercase tracking-wide text-sage-soft">Para transportadores</span>
            <h3 className="max-w-xs font-serif text-3xl">Seja encontrado pelas famílias certas.</h3>
            <p className="my-4 max-w-xs text-sm text-white/70">
              Crie seu perfil verificado e receba pedidos de famílias da sua
              região. Planos a partir de R$ 49/mês, sem comissão por indicação.
            </p>
            <Link href="/motorista" className="inline-flex items-center justify-center gap-2 rounded-full bg-amber px-5.5 py-3.5 text-sm font-bold leading-none text-navy">
              Cadastrar meu veículo →
            </Link>
          </div>
        </AnimatedContent>
      </section>

      {/* MARCA — logo completa, sem recorte, num único lugar de destaque */}
      <section className="bg-white px-[6vw] py-20 text-center">
        <AnimatedContent distance={16} duration={0.6} className="mx-auto flex max-w-xs flex-col items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/mova-logo-full.png" alt="Mova · #vaidemova" className="h-auto w-40" />
        </AnimatedContent>
      </section>

      {/* FOOTER */}
      <footer id="waitlist" className="bg-navy px-[6vw] pb-10 pt-24 text-white">
        <AnimatedContent distance={20} duration={0.6} className="mx-auto mb-10 max-w-xl border-b border-white/10 pb-16 text-center">
          <h2 className="font-serif text-4xl">Seja um dos primeiros em Salvador.</h2>
          <p className="mt-3.5 text-white/70">
            Estamos abrindo por bairro. Deixe seu e-mail e avisamos assim que a Mova chegar na sua região.
          </p>
          <form className="mx-auto mt-7 flex max-w-md flex-col gap-2.5 sm:flex-row">
            <input
              type="email"
              placeholder="seu@email.com"
              className="flex-1 rounded-full border border-white/15 bg-white/[0.07] px-4.5 py-3.5 text-sm leading-normal text-white outline-none placeholder:text-white/40"
            />
            <button className="inline-flex items-center justify-center whitespace-nowrap rounded-full bg-amber px-6 py-3.5 text-sm font-bold leading-none text-navy">
              Entrar na lista
            </button>
          </form>
        </AnimatedContent>
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <Logo on="dark" size="sm" />
          <div className="flex items-center gap-6 text-sm text-white/60">
            <a href="#rota">Como funciona</a>
            <a href="#quem-somos">Quem somos</a>
            <a href="#motoristas">Para motoristas</a>
            <a href="#">Instagram</a>
            <span className="font-mono text-xs text-amber-soft">#vaidemova</span>
          </div>
          <div className="text-xs text-white/40">© 2026 Mova · Salvador, BA</div>
        </div>
      </footer>
    </main>
  );
}
