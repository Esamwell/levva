import Link from "next/link";
import Image from "next/image";
import { Check, Star } from "lucide-react";
import { MobileNav } from "./mobile-nav";
import CountUp from "../components/CountUp";
import AnimatedContent from "../components/AnimatedContent";
import SpotlightCard from "../components/SpotlightCard";
import Magnet from "../components/Magnet";
import ShinyText from "../components/ShinyText";
import SplitFlapText from "../components/SplitFlapText";
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
          <Link href="/para-familias" className="text-sm text-navy/80 hover:text-navy">Para famílias</Link>
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
        {/* Fundo decorativo: a arte de rotas/casas/escolas da marca, em
            opacidade bem baixa, sem competir com o conteúdo por cima. */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <Image
            src="/hero-bg.jpg"
            alt=""
            fill
            priority
            className="object-cover opacity-[0.07]"
            sizes="100vw"
          />
        </div>

        <div className="relative mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="-ml-1 mb-7 overflow-x-auto">
              <SplitFlapText
                words={["SEGURANÇA", "PRATICIDADE", "#VAIDEMOVA"]}
                padTo={11}
                tileColor="#111111"
                textColor="#FEDB1A"
                fontSize={36}
                gap={6}
                tileRadius={7}
                flipDuration={0.09}
                stagger={0.045}
                cycleDelay={1800}
              />
            </div>
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
            <Link
              href="/para-motoristas"
              className="mt-8 inline-flex items-center justify-center gap-2 rounded-full border-2 border-navy px-5.5 py-3 text-sm font-bold leading-none text-navy hover:bg-navy hover:text-white"
            >
              Como funciona pra motoristas →
            </Link>
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
            <div className="flex flex-wrap items-center gap-4">
              <Link href="/pai" className="inline-flex items-center justify-center gap-2 rounded-full bg-navy px-5.5 py-3.5 text-sm font-bold leading-none text-white">
                Buscar transporte →
              </Link>
              <Link href="/para-familias" className="text-sm font-semibold text-navy/80 hover:text-navy hover:underline">
                Como funciona pra famílias
              </Link>
            </div>
          </div>
          <div className="rounded-[20px] bg-navy p-11 text-white">
            <span className="mb-4 block font-mono text-xs uppercase tracking-wide text-sage-soft">Para transportadores</span>
            <h3 className="max-w-xs font-serif text-3xl">Seja encontrado pelas famílias certas.</h3>
            <p className="my-4 max-w-xs text-sm text-white/70">
              Crie seu perfil verificado e receba pedidos de famílias da sua região.
              Sem mensalidade: você só paga quando fecha um contrato de verdade.
            </p>
            <Link href="/para-motoristas" className="inline-flex items-center justify-center gap-2 rounded-full bg-amber px-5.5 py-3.5 text-sm font-bold leading-none text-navy">
              Como funciona pra motoristas →
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
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 text-center sm:flex-row sm:flex-wrap sm:justify-between sm:text-left">
          <Logo on="dark" size="sm" />
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-white/60">
            <a href="#rota">Como funciona</a>
            <a href="#quem-somos">Quem somos</a>
            <Link href="/para-familias">Para famílias</Link>
            <a href="#motoristas">Para motoristas</a>
            <Link href="/termos">Termos de uso</Link>
            <a href="#">Instagram</a>
            <span className="font-mono text-xs text-amber-soft">#vaidemova</span>
          </div>
          <div className="text-xs text-white/40">© 2026 Mova · Salvador, BA</div>
        </div>
        <div className="mx-auto mt-6 max-w-6xl text-center text-[11px] text-white/30 sm:text-left">
          Mova é um produto da SA2 Marketing, agência de marketing e soluções digitais. CNPJ 58.648.834/0001-98.
        </div>
      </footer>
    </main>
  );
}
