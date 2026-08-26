/**
 * Service worker mínimo, só pro necessário pra virar PWA instalável:
 *
 *   1. Assets estáticos (JS/CSS com hash, fontes, ícones) ficam em cache
 *      "stale-while-revalidate" — responde rápido do cache e atualiza em
 *      segundo plano. São arquivos com hash no nome, então cache antigo
 *      nunca é servido por engano depois de um deploy.
 *   2. Navegação (páginas) é sempre "network-first": o app depende de
 *      sessão/banco ao vivo (busca, dashboards, login), então cache
 *      agressivo mostraria dado errado. Cache aqui é só um fallback pra
 *      quando a rede cai no meio do uso.
 *   3. POST/PATCH/DELETE (toda mutação) passa direto, nunca intercepta —
 *      não faz sentido cachear nem tentar "offline-first" numa escrita.
 *   4. Sem rede e sem cache: mensagem simples em vez do erro feio do
 *      navegador.
 */

const CACHE_ESTATICO = "mova-estatico-v1";
const CACHE_PAGINAS = "mova-paginas-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((chaves) =>
      Promise.all(
        chaves
          .filter((chave) => chave !== CACHE_ESTATICO && chave !== CACHE_PAGINAS)
          .map((chave) => caches.delete(chave))
      )
    )
  );
  self.clients.claim();
});

function ehAssetEstatico(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/_next/image") ||
    /\.(png|jpg|jpeg|webp|svg|ico|woff2?)$/.test(url.pathname)
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return; // mutação: nunca intercepta

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // fontes do Google etc: direto

  if (ehAssetEstatico(url)) {
    event.respondWith(
      caches.open(CACHE_ESTATICO).then(async (cache) => {
        const emCache = await cache.match(request);
        const buscaRede = fetch(request)
          .then((resposta) => {
            if (resposta.ok) cache.put(request, resposta.clone());
            return resposta;
          })
          .catch(() => emCache);
        return emCache || buscaRede;
      })
    );
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((resposta) => {
          caches.open(CACHE_PAGINAS).then((cache) => cache.put(request, resposta.clone()));
          return resposta;
        })
        .catch(async () => {
          const cache = await caches.open(CACHE_PAGINAS);
          const emCache = await cache.match(request);
          return (
            emCache ||
            new Response(
              `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
               <meta name="viewport" content="width=device-width, initial-scale=1">
               <title>Mova · Sem conexão</title>
               <style>
                 body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;
                      background:#FEDB1A;color:#111;font-family:-apple-system,Segoe UI,Roboto,sans-serif;
                      text-align:center;padding:24px}
                 div{max-width:320px}
                 h1{font-size:22px;margin:0 0 8px}
                 p{font-size:14px;color:#333;margin:0}
               </style></head>
               <body><div><h1>Sem conexão</h1>
               <p>Não deu pra carregar essa página. Confira sua internet e tenta de novo.</p>
               </div></body></html>`,
              { headers: { "Content-Type": "text/html; charset=utf-8" } }
            )
          );
        })
    );
  }
});
