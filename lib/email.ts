/**
 * Envio de e-mail transacional (redefinição de senha, avisos de aprovação).
 *
 * Usa SMTP comum, que funciona com qualquer provedor — Gmail, Zoho, Brevo,
 * Amazon SES, o servidor da própria hospedagem. As credenciais ficam no .env.
 *
 * Sem SMTP configurado, o e-mail não é enviado: a mensagem cai no log do
 * servidor com um aviso bem visível. Isso deixa testar o fluxo inteiro em
 * desenvolvimento, mas em produção significa que ninguém recupera senha —
 * por isso o aviso é gritado, e não silencioso como estava o envio antigo.
 */

import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

let transporterCache: Transporter | null = null;

export function smtpConfigurado(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function transporter(): Transporter {
  if (transporterCache) return transporterCache;

  const porta = Number(process.env.SMTP_PORT ?? 587);
  transporterCache = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: porta,
    // 465 é TLS implícito; 587 e 25 sobem por STARTTLS.
    secure: porta === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporterCache;
}

export type Mensagem = {
  para: string;
  assunto: string;
  texto: string;
  html: string;
};

export async function enviarEmail(msg: Mensagem): Promise<void> {
  if (!smtpConfigurado()) {
    console.warn(
      [
        "",
        "════════════════════════════════════════════════════════════════",
        " SMTP NÃO CONFIGURADO — o e-mail abaixo NÃO foi enviado.",
        " Defina SMTP_HOST, SMTP_USER e SMTP_PASS no .env.",
        "────────────────────────────────────────────────────────────────",
        ` Para:    ${msg.para}`,
        ` Assunto: ${msg.assunto}`,
        "",
        msg.texto,
        "════════════════════════════════════════════════════════════════",
        "",
      ].join("\n")
    );
    return;
  }

  await transporter().sendMail({
    from: process.env.SMTP_FROM ?? `Mova <${process.env.SMTP_USER}>`,
    to: msg.para,
    subject: msg.assunto,
    text: msg.texto,
    html: msg.html,
  });
}

/** URL pública do app, usada pra montar links dentro dos e-mails. */
export function urlBase(): string {
  return (process.env.APP_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}

// ---------------------------------------------------------------------------
// Modelos de mensagem
// ---------------------------------------------------------------------------

function moldura(titulo: string, corpo: string): string {
  return `<!doctype html>
<html lang="pt-BR"><body style="margin:0;padding:32px 16px;background:#F5F5F5;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#111111">
  <div style="max-width:520px;margin:0 auto;background:#fff;border:1px solid #E5E5E5;border-radius:20px;padding:32px">
    <div style="font-size:22px;font-weight:700;color:#111111">mova</div>
    <h1 style="font-size:20px;color:#111111;margin:24px 0 0">${titulo}</h1>
    ${corpo}
  </div>
  <p style="max-width:520px;margin:16px auto 0;font-size:12px;color:#8A8A8A;text-align:center">
    Mova · transporte escolar · #vaidemova
  </p>
</body></html>`;
}

function botao(href: string, texto: string): string {
  return `<a href="${href}" style="display:inline-block;margin:24px 0 0;background:#FEDB1A;color:#111111;font-weight:700;font-size:14px;text-decoration:none;padding:12px 24px;border-radius:999px">${texto}</a>`;
}

/**
 * Todo texto abaixo que vem de campo digitado por usuário (nome, motivo de
 * reprovação, assunto de chamado...) passa por aqui antes de entrar no HTML
 * do e-mail — sem isso, um nome como `<img src=x onerror=...>` ia direto
 * pro corpo da mensagem que a equipe abre no cliente de e-mail.
 */
function escaparHtml(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function emailRecuperacaoSenha(params: {
  nome: string;
  link: string;
  minutos: number;
}): Omit<Mensagem, "para"> {
  const { nome, link, minutos } = params;

  return {
    assunto: "Redefinir sua senha na Mova",
    texto:
      `Olá, ${nome}.\n\n` +
      `Você pediu para redefinir sua senha na Mova. Abra o link abaixo para escolher uma nova:\n\n` +
      `${link}\n\n` +
      `O link vale por ${minutos} minutos e só pode ser usado uma vez.\n\n` +
      `Se não foi você que pediu, ignore este e-mail. Sua senha continua a mesma.`,
    html: moldura(
      "Redefinir sua senha",
      `<p style="font-size:15px;line-height:1.6;color:#6B6B6B;margin:16px 0 0">
         Olá, ${escaparHtml(nome)}. Você pediu para redefinir sua senha na Mova.
         Clique no botão abaixo para escolher uma nova.
       </p>
       ${botao(link, "Escolher nova senha")}
       <p style="font-size:13px;line-height:1.6;color:#8A8A8A;margin:24px 0 0">
         O link vale por ${minutos} minutos e só funciona uma vez.
         Se não foi você que pediu, ignore este e-mail. Sua senha continua a mesma.
       </p>`
    ),
  };
}

export function emailMotoristaAprovado(params: {
  nome: string;
  link: string;
}): Omit<Mensagem, "para"> {
  return {
    assunto: "Seu cadastro na Mova foi aprovado",
    texto:
      `Olá, ${params.nome}.\n\n` +
      `Seus documentos foram conferidos e seu cadastro está aprovado. ` +
      `A partir de agora você aparece nas buscas dos pais e recebe leads pelo painel:\n\n` +
      `${params.link}`,
    html: moldura(
      "Cadastro aprovado",
      `<p style="font-size:15px;line-height:1.6;color:#6B6B6B;margin:16px 0 0">
         Olá, ${escaparHtml(params.nome)}. Seus documentos foram conferidos e seu cadastro está aprovado.
         A partir de agora você aparece nas buscas dos pais e recebe leads direto no painel.
       </p>
       ${botao(params.link, "Abrir meu painel")}`
    ),
  };
}

export function emailMotoristaReprovado(params: {
  nome: string;
  motivo: string;
  dataLimite: string;
}): Omit<Mensagem, "para"> {
  return {
    assunto: "Sobre seu cadastro na Mova",
    texto:
      `Olá, ${params.nome}.\n\n` +
      `Revisamos seu cadastro e ele não pôde ser aprovado agora. Motivo:\n\n` +
      `${params.motivo}\n\n` +
      `Corrija o que foi apontado. A partir de ${params.dataLimite} você pode solicitar uma nova análise direto no seu painel, em "Meu perfil".`,
    html: moldura(
      "Sobre seu cadastro",
      `<p style="font-size:15px;line-height:1.6;color:#6B6B6B;margin:16px 0 0">
         Olá, ${escaparHtml(params.nome)}. Revisamos seu cadastro e ele não pôde ser aprovado agora.
       </p>
       <p style="font-size:15px;line-height:1.6;color:#111111;background:#FFF6D6;border-left:3px solid #FEDB1A;border-radius:0 10px 10px 0;padding:14px 16px;margin:16px 0 0">
         ${escaparHtml(params.motivo)}
       </p>
       <p style="font-size:13px;line-height:1.6;color:#8A8A8A;margin:20px 0 0">
         Corrija o que foi apontado. A partir de <strong>${escaparHtml(params.dataLimite)}</strong> você pode solicitar
         uma nova análise direto no seu painel, em "Meu perfil".
       </p>`
    ),
  };
}

export function emailMotoristaReenviouCadastro(params: {
  motoristaNome: string;
  link: string;
}): Omit<Mensagem, "para"> {
  return {
    assunto: `${params.motoristaNome} solicitou uma nova análise`,
    texto: `${params.motoristaNome} corrigiu o cadastro e pediu uma nova análise. Reveja em: ${params.link}`,
    html: moldura(
      "Nova análise solicitada",
      `<p style="font-size:15px;line-height:1.6;color:#6B6B6B;margin:16px 0 0">
         <strong>${escaparHtml(params.motoristaNome)}</strong> corrigiu o cadastro depois de reprovado e pediu uma nova análise.
       </p>
       <a href="${params.link}" style="display:inline-block;margin-top:20px;padding:12px 24px;background:#111111;color:#FEDB1A;text-decoration:none;border-radius:999px;font-weight:600;font-size:14px">
         Ver cadastro
       </a>`
    ),
  };
}

export function emailNovoLeadAdmin(params: {
  paiNome: string;
  motoristaNome: string;
  filhoNome: string;
  escolaNome: string;
  link: string;
}): Omit<Mensagem, "para"> {
  return {
    assunto: `Novo lead: ${params.paiNome} → ${params.motoristaNome}`,
    texto:
      `Novo lead aguardando repasse manual.\n\n` +
      `Pai: ${params.paiNome}\n` +
      `Motorista: ${params.motoristaNome}\n` +
      `Criança: ${params.filhoNome} (${params.escolaNome})\n\n` +
      `Abrir o painel: ${params.link}`,
    html: moldura(
      "Novo lead aguardando repasse",
      `<table style="width:100%;font-size:14px;color:#6B6B6B;margin:16px 0 0;border-collapse:collapse">
         <tr><td style="padding:6px 0;color:#8A8A8A">Pai</td><td style="padding:6px 0;color:#111111;font-weight:600">${escaparHtml(params.paiNome)}</td></tr>
         <tr><td style="padding:6px 0;color:#8A8A8A">Motorista</td><td style="padding:6px 0;color:#111111;font-weight:600">${escaparHtml(params.motoristaNome)}</td></tr>
         <tr><td style="padding:6px 0;color:#8A8A8A">Criança</td><td style="padding:6px 0;color:#111111;font-weight:600">${escaparHtml(params.filhoNome)}</td></tr>
         <tr><td style="padding:6px 0;color:#8A8A8A">Escola</td><td style="padding:6px 0;color:#111111;font-weight:600">${escaparHtml(params.escolaNome)}</td></tr>
       </table>
       ${botao(params.link, "Abrir o painel")}`
    ),
  };
}

export function emailExtraPendenteAdmin(params: {
  motoristaNome: string;
  servico: string;
  valorFormatado: string;
  link: string;
}): Omit<Mensagem, "para"> {
  return {
    assunto: `${params.motoristaNome} contratou ${params.servico}`,
    texto:
      `${params.motoristaNome} contratou ${params.servico} (${params.valorFormatado}) e está aguardando a ` +
      `confirmação do pagamento pra ativar.\n\n` +
      `Abrir o painel: ${params.link}`,
    html: moldura(
      "Extra aguardando confirmação",
      `<table style="width:100%;font-size:14px;color:#6B6B6B;margin:16px 0 0;border-collapse:collapse">
         <tr><td style="padding:6px 0;color:#8A8A8A">Motorista</td><td style="padding:6px 0;color:#111111;font-weight:600">${escaparHtml(params.motoristaNome)}</td></tr>
         <tr><td style="padding:6px 0;color:#8A8A8A">Serviço</td><td style="padding:6px 0;color:#111111;font-weight:600">${escaparHtml(params.servico)}</td></tr>
         <tr><td style="padding:6px 0;color:#8A8A8A">Valor</td><td style="padding:6px 0;color:#111111;font-weight:600">${escaparHtml(params.valorFormatado)}</td></tr>
       </table>
       ${botao(params.link, "Confirmar pagamento")}`
    ),
  };
}

export function emailExtraConfirmado(params: {
  nome: string;
  servico: string;
  link: string;
}): Omit<Mensagem, "para"> {
  return {
    assunto: `${params.servico} está ativo`,
    texto:
      `Olá, ${params.nome}.\n\n` +
      `Confirmamos seu pagamento e ${params.servico} já está ativo no seu perfil.\n\n` +
      `${params.link}`,
    html: moldura(
      `${escaparHtml(params.servico)} ativado`,
      `<p style="font-size:15px;line-height:1.6;color:#6B6B6B;margin:16px 0 0">
         Olá, ${escaparHtml(params.nome)}. Confirmamos seu pagamento e ${escaparHtml(params.servico)} já está ativo no seu perfil.
       </p>
       ${botao(params.link, "Ver meu perfil")}`
    ),
  };
}

export function emailNovoTicketAdmin(params: {
  autorNome: string;
  assunto: string;
  link: string;
}): Omit<Mensagem, "para"> {
  return {
    assunto: `Novo chamado: ${params.autorNome}`,
    texto:
      `Novo chamado de suporte aguardando resposta.\n\n` +
      `De: ${params.autorNome}\n` +
      `Assunto: ${params.assunto}\n\n` +
      `Abrir o painel: ${params.link}`,
    html: moldura(
      "Novo chamado de suporte",
      `<table style="width:100%;font-size:14px;color:#6B6B6B;margin:16px 0 0;border-collapse:collapse">
         <tr><td style="padding:6px 0;color:#8A8A8A">De</td><td style="padding:6px 0;color:#111111;font-weight:600">${escaparHtml(params.autorNome)}</td></tr>
         <tr><td style="padding:6px 0;color:#8A8A8A">Assunto</td><td style="padding:6px 0;color:#111111;font-weight:600">${escaparHtml(params.assunto)}</td></tr>
       </table>
       ${botao(params.link, "Responder chamado")}`
    ),
  };
}

export function emailCobrancaGerada(params: {
  paiNome: string;
  motoristaNome: string;
  valorFormatado: string;
  vencimentoFormatado: string;
  link: string;
}): Omit<Mensagem, "para"> {
  return {
    assunto: `Cobrança do transporte de ${params.motoristaNome}`,
    texto:
      `Olá, ${params.paiNome}.\n\n` +
      `Segue o link de pagamento do transporte escolar com ${params.motoristaNome}: ${params.valorFormatado}, ` +
      `vencimento em ${params.vencimentoFormatado}.\n\n` +
      `Pagar: ${params.link}\n\n` +
      `Você pode pagar por Pix, boleto ou cartão.`,
    html: moldura(
      "Cobrança do transporte escolar",
      `<p style="font-size:15px;line-height:1.6;color:#6B6B6B;margin:16px 0 0">
         Olá, ${escaparHtml(params.paiNome)}. Segue o link de pagamento do transporte com
         <strong>${escaparHtml(params.motoristaNome)}</strong>.
       </p>
       <table style="width:100%;font-size:14px;color:#6B6B6B;margin:16px 0 0;border-collapse:collapse">
         <tr><td style="padding:6px 0;color:#8A8A8A">Valor</td><td style="padding:6px 0;color:#111111;font-weight:600">${escaparHtml(params.valorFormatado)}</td></tr>
         <tr><td style="padding:6px 0;color:#8A8A8A">Vencimento</td><td style="padding:6px 0;color:#111111;font-weight:600">${escaparHtml(params.vencimentoFormatado)}</td></tr>
       </table>
       ${botao(params.link, "Pagar agora")}
       <p style="font-size:13px;line-height:1.6;color:#8A8A8A;margin:20px 0 0">
         Pix, boleto ou cartão: escolha na própria página de pagamento.
       </p>`
    ),
  };
}

export function emailSaqueSolicitadoAdmin(params: {
  motoristaNome: string;
  valorFormatado: string;
  link: string;
}): Omit<Mensagem, "para"> {
  return {
    assunto: `${params.motoristaNome} pediu saque de ${params.valorFormatado}`,
    texto:
      `${params.motoristaNome} solicitou saque de ${params.valorFormatado}. Faz o Pix manual e dá baixa no painel.\n\n` +
      `Abrir o painel: ${params.link}`,
    html: moldura(
      "Saque solicitado",
      `<table style="width:100%;font-size:14px;color:#6B6B6B;margin:16px 0 0;border-collapse:collapse">
         <tr><td style="padding:6px 0;color:#8A8A8A">Motorista</td><td style="padding:6px 0;color:#111111;font-weight:600">${escaparHtml(params.motoristaNome)}</td></tr>
         <tr><td style="padding:6px 0;color:#8A8A8A">Valor</td><td style="padding:6px 0;color:#111111;font-weight:600">${escaparHtml(params.valorFormatado)}</td></tr>
       </table>
       <p style="font-size:13px;line-height:1.6;color:#8A8A8A;margin:16px 0 0">
         Faz o Pix manual pro motorista e depois marca como pago no painel.
       </p>
       ${botao(params.link, "Ver saques pendentes")}`
    ),
  };
}

export function emailSaquePago(params: { nome: string; valorFormatado: string }): Omit<Mensagem, "para"> {
  return {
    assunto: `Saque de ${params.valorFormatado} confirmado`,
    texto: `Olá, ${params.nome}.\n\nSeu saque de ${params.valorFormatado} foi pago via Pix. Confere na sua conta.`,
    html: moldura(
      "Saque confirmado",
      `<p style="font-size:15px;line-height:1.6;color:#6B6B6B;margin:16px 0 0">
         Olá, ${escaparHtml(params.nome)}. Seu saque de <strong>${escaparHtml(params.valorFormatado)}</strong> foi
         pago via Pix. Confere na sua conta.
       </p>`
    ),
  };
}

export function emailNovaMensagemLead(params: {
  destinatarioNome: string;
  remetenteNome: string;
  filhoNome: string;
  link: string;
}): Omit<Mensagem, "para"> {
  return {
    assunto: `Nova mensagem de ${params.remetenteNome}`,
    texto:
      `Olá, ${params.destinatarioNome}.\n\n` +
      `${params.remetenteNome} te mandou uma mensagem sobre o transporte de ${params.filhoNome}.\n\n` +
      `Ver e responder: ${params.link}`,
    html: moldura(
      "Nova mensagem",
      `<p style="font-size:15px;line-height:1.6;color:#6B6B6B;margin:16px 0 0">
         Olá, ${escaparHtml(params.destinatarioNome)}. <strong>${escaparHtml(params.remetenteNome)}</strong> te
         mandou uma mensagem sobre o transporte de ${escaparHtml(params.filhoNome)}.
       </p>
       ${botao(params.link, "Ver e responder")}`
    ),
  };
}

