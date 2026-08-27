"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Copy, Check, ExternalLink, CreditCard, QrCode, Barcode } from "lucide-react";

type Aba = "PIX" | "BOLETO" | "CARTAO";

type DadosPix = { encodedImage: string; payload: string };
type DadosBoleto = { identificationField: string; bankSlipUrl: string | null };

function BotaoCopiar({ texto }: { texto: string }) {
  const [copiado, setCopiado] = useState(false);
  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Clipboard pode falhar (permissão negada, contexto não seguro) — o
      // texto já está selecionável no campo ao lado, então não é bloqueante.
    }
  }
  return (
    <button
      type="button"
      onClick={copiar}
      className="flex shrink-0 items-center gap-1.5 rounded-full bg-navy px-3 py-1.5 text-xs font-semibold text-white hover:bg-navy/90"
    >
      {copiado ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copiado ? "Copiado" : "Copiar"}
    </button>
  );
}

export default function PagamentoClient({
  cobrancaId,
  paga,
  linkPagamento,
}: {
  cobrancaId: string;
  paga: boolean;
  linkPagamento: string | null;
}) {
  const [aba, setAba] = useState<Aba>("PIX");
  const [pix, setPix] = useState<DadosPix | null>(null);
  const [boleto, setBoleto] = useState<DadosBoleto | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Pix é a aba padrão — já busca o QR code ao abrir a página, sem esperar
  // o clique. Boleto e cartão só carregam se o pai trocar de aba.
  useEffect(() => {
    if (!paga) abrirAba("PIX");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (paga) {
    return (
      <div className="flex flex-col items-center gap-2 py-6 text-center">
        <CheckCircle2 className="h-10 w-10 text-sage" />
        <p className="font-serif text-lg text-navy">Pagamento confirmado</p>
        <p className="text-sm text-ink-soft">Obrigado! Já registramos o recebimento.</p>
      </div>
    );
  }

  async function abrirAba(nova: Aba) {
    setAba(nova);
    setErro(null);
    if (nova === "PIX" && !pix) {
      setCarregando(true);
      try {
        const res = await fetch(`/api/pagamentos/${cobrancaId}/pix`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Não deu pra gerar o Pix.");
        setPix(data);
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Não deu pra gerar o Pix.");
      } finally {
        setCarregando(false);
      }
    }
    if (nova === "BOLETO" && !boleto) {
      setCarregando(true);
      try {
        const res = await fetch(`/api/pagamentos/${cobrancaId}/boleto`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Não deu pra gerar o boleto.");
        setBoleto(data);
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Não deu pra gerar o boleto.");
      } finally {
        setCarregando(false);
      }
    }
  }

  const abaBtn = (valor: Aba, label: string, Icon: typeof QrCode) => (
    <button
      type="button"
      onClick={() => abrirAba(valor)}
      className={`flex flex-1 items-center justify-center gap-1.5 rounded-full py-2 text-xs font-semibold transition ${
        aba === valor ? "bg-navy text-white" : "border border-cream-line text-ink-soft hover:border-amber"
      }`}
    >
      <Icon className="h-3.5 w-3.5" /> {label}
    </button>
  );

  return (
    <div>
      <div className="flex gap-2">
        {abaBtn("PIX", "Pix", QrCode)}
        {abaBtn("BOLETO", "Boleto", Barcode)}
        {abaBtn("CARTAO", "Cartão", CreditCard)}
      </div>

      <div className="mt-4">
        {carregando && <p className="text-center text-sm text-ink-soft">Gerando...</p>}
        {erro && <p className="text-center text-sm text-red-600">{erro}</p>}

        {!carregando && aba === "PIX" && pix && (
          <div className="flex flex-col items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`data:image/png;base64,${pix.encodedImage}`}
              alt="QR code Pix"
              className="h-48 w-48 rounded-xl border border-cream-line"
            />
            <div className="flex w-full items-center gap-2">
              <input
                readOnly
                value={pix.payload}
                onFocus={(e) => e.target.select()}
                className="min-w-0 flex-1 truncate rounded-lg border border-cream-line px-3 py-2 text-xs text-ink-soft"
              />
              <BotaoCopiar texto={pix.payload} />
            </div>
            <p className="text-center text-xs text-ink-soft">Abra o app do seu banco e escaneie, ou cole o código.</p>
          </div>
        )}

        {!carregando && aba === "BOLETO" && boleto && (
          <div className="flex flex-col items-center gap-3">
            <div className="flex w-full items-center gap-2">
              <input
                readOnly
                value={boleto.identificationField}
                onFocus={(e) => e.target.select()}
                className="min-w-0 flex-1 truncate rounded-lg border border-cream-line px-3 py-2 text-xs text-ink-soft"
              />
              <BotaoCopiar texto={boleto.identificationField} />
            </div>
            {boleto.bankSlipUrl && (
              <a
                href={boleto.bankSlipUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-xs font-semibold text-navy hover:underline"
              >
                Baixar boleto em PDF <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        )}

        {aba === "CARTAO" && (
          <div className="flex flex-col items-center gap-3 py-2 text-center">
            <p className="text-xs text-ink-soft">
              Pagamento com cartão abre a página segura do Asaas. A Mova não guarda dado de cartão.
            </p>
            {linkPagamento && (
              <a
                href={linkPagamento}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded-full bg-navy px-4 py-2 text-xs font-semibold text-white hover:bg-navy/90"
              >
                Pagar com cartão <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
