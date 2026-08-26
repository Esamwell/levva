/**
 * Termos de Uso — redação inicial, alinhada às regras de negócio já
 * implementadas no sistema (comissão, cadastro gratuito, verificação
 * documental). NÃO é um documento revisado por advogado ainda — em
 * especial a cláusula de não-desvio (item 4 de motoristas) precisa de
 * revisão jurídica antes de ser tratada como exigível na prática: a
 * validade desse tipo de cláusula varia, e um texto que controle demais
 * a atuação do motorista pode reforçar a leitura de vínculo trabalhista
 * (CLT) em vez de parceria comercial — o oposto do que se quer aqui.
 */
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "../../components/logo";
import { TAXA_MOVA_PERCENTUAL } from "../../lib/financeiro";
import { TERMOS_VERSAO_ATUAL } from "../../lib/termos";

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-cream-line bg-white px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link href="/" className="flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-navy">
            <ArrowLeft className="h-4 w-4" /> Site
          </Link>
          <Logo on="light" size="sm" />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <h1 className="font-serif text-4xl text-navy">Termos de Uso</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Versão {TERMOS_VERSAO_ATUAL} · válida a partir de 26 de agosto de 2026
        </p>

        <section id="motoristas" className="mt-10 scroll-mt-20">
          <h2 className="font-serif text-2xl text-navy">Para motoristas e transportadores</h2>
          <div className="mt-4 space-y-4 text-sm leading-relaxed text-ink-soft">
            <p>
              <strong className="text-navy">1. Cadastro e listagem gratuitos.</strong> Não cobramos mensalidade
              pra você ter perfil na Mova. Cadastro, listagem nas buscas e uso do painel não têm custo.
            </p>
            <p>
              <strong className="text-navy">2. Comissão sobre contrato fechado.</strong> A Mova cobra uma taxa de{" "}
              {TAXA_MOVA_PERCENTUAL}% sobre o valor combinado em cada contrato de transporte fechado através da
              plataforma, gerada no momento em que você registra o fechamento no painel. Você escolhe, a cada
              contrato, se absorve essa taxa ou repassa pro responsável — essa decisão é sua.
            </p>
            <p>
              <strong className="text-navy">3. Verificação documental.</strong> CNH válida, curso de transporte
              escolar e certidão de antecedentes criminais são exigidos e conferidos pela nossa equipe antes da
              aprovação do seu perfil. Documentos vencidos ou substituídos precisam ser reenviados e passam por
              nova conferência — enquanto isso, seu perfil pode ficar fora das buscas.
            </p>
            <p>
              <strong className="text-navy">4. Uso de boa fé da plataforma.</strong> As famílias que entram em
              contato com você pela Mova chegaram até seu perfil por causa da verificação, das avaliações e da
              visibilidade que a plataforma oferece. Direcionar sistematicamente esses contatos pra fechamento e
              pagamento fora da Mova, com o objetivo de evitar a comissão devida, é uso de má fé da plataforma e
              pode levar à suspensão ou ao cancelamento do seu cadastro.
            </p>
            <p>
              <strong className="text-navy">5. Serviços extras.</strong> Destaque nas buscas e outros serviços
              avulsos são opcionais, cobrados à parte, e só valem enquanto estiverem ativos.
            </p>
            <p>
              <strong className="text-navy">6. Papel da Mova.</strong> A Mova é uma plataforma de intermediação:
              conecta você a famílias interessadas, mas o contrato de transporte escolar é um acordo direto entre
              você e a família. A Mova não é parte desse contrato e não responde pela execução do serviço de
              transporte.
            </p>
            <p>
              <strong className="text-navy">7. Dados pessoais.</strong> Seus dados e documentos são usados só pra
              operar a plataforma (verificação, busca, contato com famílias, cobrança da comissão) e tratados
              conforme a LGPD.
            </p>
          </div>
        </section>

        <section id="familias" className="mt-12 scroll-mt-20 border-t border-cream-line pt-10">
          <h2 className="font-serif text-2xl text-navy">Para famílias (pais e responsáveis)</h2>
          <div className="mt-4 space-y-4 text-sm leading-relaxed text-ink-soft">
            <p>
              <strong className="text-navy">1. Uso gratuito.</strong> Buscar, comparar e solicitar contato com
              transportadores verificados não tem nenhum custo pra sua família.
            </p>
            <p>
              <strong className="text-navy">2. Papel da Mova.</strong> A Mova conecta você a motoristas
              verificados documentalmente, mas a contratação do transporte escolar é um acordo direto entre você
              e o motorista escolhido. A Mova não é parte desse contrato e não responde pela execução do serviço
              de transporte — a escolha final e o acompanhamento da relação com o motorista são seus.
            </p>
            <p>
              <strong className="text-navy">3. Dados pessoais.</strong> Os dados que você informa (endereço,
              contato, dados do seu filho ou filha, escola) são usados só pra viabilizar a conexão com
              transportadores e o acompanhamento das suas solicitações, conforme a LGPD.
            </p>
            <p>
              <strong className="text-navy">4. Avaliações.</strong> Ao avaliar um motorista na plataforma, você
              confirma que está relatando uma experiência real de contratação através da Mova.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
