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
         Olá, ${nome}. Você pediu para redefinir sua senha na Mova.
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
         Olá, ${params.nome}. Seus documentos foram conferidos e seu cadastro está aprovado.
         A partir de agora você aparece nas buscas dos pais e recebe leads direto no painel.
       </p>
       ${botao(params.link, "Abrir meu painel")}`
    ),
  };
}

export function emailMotoristaReprovado(params: {
  nome: string;
  motivo: string;
}): Omit<Mensagem, "para"> {
  return {
    assunto: "Sobre seu cadastro na Mova",
    texto:
      `Olá, ${params.nome}.\n\n` +
      `Revisamos seu cadastro e ele não pôde ser aprovado agora. Motivo:\n\n` +
      `${params.motivo}\n\n` +
      `Você pode corrigir o que foi apontado e responder este e-mail para uma nova análise.`,
    html: moldura(
      "Sobre seu cadastro",
      `<p style="font-size:15px;line-height:1.6;color:#6B6B6B;margin:16px 0 0">
         Olá, ${params.nome}. Revisamos seu cadastro e ele não pôde ser aprovado agora.
       </p>
       <p style="font-size:15px;line-height:1.6;color:#111111;background:#FFF6D6;border-left:3px solid #FEDB1A;border-radius:0 10px 10px 0;padding:14px 16px;margin:16px 0 0">
         ${params.motivo}
       </p>
       <p style="font-size:13px;line-height:1.6;color:#8A8A8A;margin:20px 0 0">
         Corrija o que foi apontado e responda este e-mail para uma nova análise.
       </p>`
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
         <tr><td style="padding:6px 0;color:#8A8A8A">Pai</td><td style="padding:6px 0;color:#111111;font-weight:600">${params.paiNome}</td></tr>
         <tr><td style="padding:6px 0;color:#8A8A8A">Motorista</td><td style="padding:6px 0;color:#111111;font-weight:600">${params.motoristaNome}</td></tr>
         <tr><td style="padding:6px 0;color:#8A8A8A">Criança</td><td style="padding:6px 0;color:#111111;font-weight:600">${params.filhoNome}</td></tr>
         <tr><td style="padding:6px 0;color:#8A8A8A">Escola</td><td style="padding:6px 0;color:#111111;font-weight:600">${params.escolaNome}</td></tr>
       </table>
       ${botao(params.link, "Abrir o painel")}`
    ),
  };
}
