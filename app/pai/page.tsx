/**
 * Busca de transporte — porta de entrada do pai, e a única página de /pai
 * que é pública (ver middleware.ts). Buscar continua sem cadastro.
 *
 * Server Component fino: lê a sessão e passa adiante se já existe conta
 * logada. Isso muda o formulário de contato — quem já entrou não precisa
 * digitar nome, e-mail e senha de novo.
 */

import { getSession } from "../../lib/auth";
import BuscaClient from "./busca-client";

export default async function PaiBuscaPage() {
  const session = await getSession();
  return <BuscaClient jaLogado={session?.role === "PAI"} />;
}
