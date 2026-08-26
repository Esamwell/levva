/**
 * Fonte única do texto dos Termos de Uso — usado pela página pública
 * (/termos) e pelo modal de aceite no cadastro (components/termos-modal.tsx).
 * Editar aqui muda nos dois lugares.
 *
 * Redação inicial, alinhada às regras de negócio já implementadas
 * (comissão, cadastro gratuito, verificação documental). NÃO é um
 * documento revisado por advogado ainda — em especial a cláusula de
 * boa fé/não-desvio (item 4 de motoristas) precisa de revisão jurídica
 * antes de ser tratada como exigível na prática: a validade desse tipo
 * de cláusula varia, e um texto que controle demais a atuação do
 * motorista pode reforçar a leitura de vínculo trabalhista (CLT) em vez
 * de parceria comercial — o oposto do que se quer aqui.
 */
import { TAXA_MOVA_PERCENTUAL } from "./financeiro";

export type ClausulaTermos = { titulo: string; texto: React.ReactNode };

export const TERMOS_MOTORISTA: ClausulaTermos[] = [
  {
    titulo: "1. Cadastro e listagem gratuitos.",
    texto: "Não cobramos mensalidade pra você ter perfil na Mova. Cadastro, listagem nas buscas e uso do painel não têm custo.",
  },
  {
    titulo: "2. Comissão sobre contrato fechado.",
    texto: `A Mova cobra uma taxa de ${TAXA_MOVA_PERCENTUAL}% sobre o valor combinado em cada contrato de transporte fechado através da plataforma, gerada no momento em que você registra o fechamento no painel. Você escolhe, a cada contrato, se absorve essa taxa ou repassa pro responsável — essa decisão é sua.`,
  },
  {
    titulo: "3. Verificação documental.",
    texto: "CNH válida, curso de transporte escolar e certidão de antecedentes criminais são exigidos e conferidos pela nossa equipe antes da aprovação do seu perfil. Documentos vencidos ou substituídos precisam ser reenviados e passam por nova conferência — enquanto isso, seu perfil pode ficar fora das buscas.",
  },
  {
    titulo: "4. Uso de boa fé da plataforma.",
    texto: "As famílias que entram em contato com você pela Mova chegaram até seu perfil por causa da verificação, das avaliações e da visibilidade que a plataforma oferece. Direcionar sistematicamente esses contatos pra fechamento e pagamento fora da Mova, com o objetivo de evitar a comissão devida, é uso de má fé da plataforma e pode levar à suspensão ou ao cancelamento do seu cadastro.",
  },
  {
    titulo: "5. Serviços extras.",
    texto: "Destaque nas buscas e outros serviços avulsos são opcionais, cobrados à parte, e só valem enquanto estiverem ativos.",
  },
  {
    titulo: "6. Papel da Mova.",
    texto: "A Mova é uma plataforma de intermediação: conecta você a famílias interessadas, mas o contrato de transporte escolar é um acordo direto entre você e a família. A Mova não é parte desse contrato e não responde pela execução do serviço de transporte.",
  },
  {
    titulo: "7. Dados pessoais.",
    texto: "Seus dados e documentos são usados só pra operar a plataforma (verificação, busca, contato com famílias, cobrança da comissão) e tratados conforme a LGPD.",
  },
];

export const TERMOS_FAMILIAS: ClausulaTermos[] = [
  {
    titulo: "1. Uso gratuito.",
    texto: "Buscar, comparar e solicitar contato com transportadores verificados não tem nenhum custo pra sua família.",
  },
  {
    titulo: "2. Papel da Mova.",
    texto: "A Mova conecta você a motoristas verificados documentalmente, mas a contratação do transporte escolar é um acordo direto entre você e o motorista escolhido. A Mova não é parte desse contrato e não responde pela execução do serviço de transporte — a escolha final e o acompanhamento da relação com o motorista são seus.",
  },
  {
    titulo: "3. Dados pessoais.",
    texto: "Os dados que você informa (endereço, contato, dados do seu filho ou filha, escola) são usados só pra viabilizar a conexão com transportadores e o acompanhamento das suas solicitações, conforme a LGPD.",
  },
  {
    titulo: "4. Avaliações.",
    texto: "Ao avaliar um motorista na plataforma, você confirma que está relatando uma experiência real de contratação através da Mova.",
  },
];
