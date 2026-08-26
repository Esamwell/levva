"use client";

import { useEffect, useState } from "react";
import { Download, X, Share } from "lucide-react";

const CHAVE_DISPENSADO = "mova_install_dispensado";
const DIAS_ATE_MOSTRAR_DE_NOVO = 14;

function jaDispensadoRecentemente(): boolean {
  try {
    const valor = localStorage.getItem(CHAVE_DISPENSADO);
    if (!valor) return false;
    const dias = (Date.now() - Number(valor)) / (1000 * 60 * 60 * 24);
    return dias < DIAS_ATE_MOSTRAR_DE_NOVO;
  } catch {
    return false;
  }
}

function marcarDispensado() {
  try {
    localStorage.setItem(CHAVE_DISPENSADO, String(Date.now()));
  } catch {
    // Sem localStorage (modo privado etc.): só não insiste na próxima visita
    // dentro da mesma aba — não é crítico.
  }
}

function jaInstalado(): boolean {
  const standaloneDisplay = window.matchMedia?.("(display-mode: standalone)").matches;
  const standaloneIOS = (navigator as unknown as { standalone?: boolean }).standalone === true;
  return Boolean(standaloneDisplay || standaloneIOS);
}

function ehIOS(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallPrompt() {
  const [deferredEvent, setDeferredEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [modo, setModo] = useState<"android" | "ios" | null>(null);
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    if (jaInstalado() || jaDispensadoRecentemente()) return;

    function aoFicarInstalavel(e: Event) {
      e.preventDefault();
      setDeferredEvent(e as BeforeInstallPromptEvent);
      setModo("android");
      setVisivel(true);
    }
    window.addEventListener("beforeinstallprompt", aoFicarInstalavel);

    // iOS não dispara beforeinstallprompt — não tem como saber se "dá pra
    // instalar", só oferecemos a instrução. Espera um pouco pra não competir
    // com o primeiro carregamento da página.
    let temporizador: ReturnType<typeof setTimeout> | undefined;
    if (ehIOS()) {
      temporizador = setTimeout(() => {
        setModo("ios");
        setVisivel(true);
      }, 4000);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", aoFicarInstalavel);
      if (temporizador) clearTimeout(temporizador);
    };
  }, []);

  async function instalar() {
    if (!deferredEvent) return;
    await deferredEvent.prompt();
    await deferredEvent.userChoice;
    // Aceitando ou recusando, some — se aceitou não precisa mais, se
    // recusou é a resposta dele.
    setVisivel(false);
    marcarDispensado();
  }

  function dispensar() {
    setVisivel(false);
    marcarDispensado();
  }

  if (!visivel || !modo) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] px-4 pb-4 sm:bottom-4 sm:left-4 sm:right-auto sm:max-w-sm sm:px-0">
      <div className="flex items-start gap-3 rounded-2xl border border-cream-line bg-white p-4 shadow-2xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/mova-mark.png" alt="" className="h-8 w-8 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-navy">Instale o app da Mova</p>
          {modo === "android" ? (
            <>
              <p className="mt-0.5 text-xs text-ink-soft">
                Acesso rápido direto da tela inicial, sem precisar abrir o navegador.
              </p>
              <button
                onClick={instalar}
                className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-amber px-4 py-2 text-xs font-bold text-navy"
              >
                <Download className="h-3.5 w-3.5" />
                Instalar
              </button>
            </>
          ) : (
            <p className="mt-0.5 text-xs text-ink-soft">
              Toque em <Share className="mb-0.5 inline h-3.5 w-3.5" /> e depois em{" "}
              <strong className="text-navy">"Adicionar à Tela de Início"</strong>.
            </p>
          )}
        </div>
        <button
          onClick={dispensar}
          aria-label="Dispensar"
          className="shrink-0 rounded-full p-1 text-ink-soft hover:bg-cream hover:text-navy"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
