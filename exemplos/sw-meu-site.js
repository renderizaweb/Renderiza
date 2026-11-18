// Só para o Meu site de exemplo (/exemplos/meu-site-fotografia): a foto que a pessoa envia fica no navegador dela
// (Cache Storage "rz-exemplo-meu-site", gravada pela página) e sai daqui, no endereço que o painel de verdade daria a
// ela (/api/publico/imagens/<conta>/...). Tudo o mais passa direto, sem mudança.
const CACHE = "rz-exemplo-meu-site";
const PASTA = "/api/publico/imagens/05cc0504-8c4f-440d-adc9-1d85d2130243/";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", evento => evento.waitUntil(self.clients.claim()));
self.addEventListener("fetch", evento => {
  const url = new URL(evento.request.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(PASTA)) return;
  evento.respondWith(caches.open(CACHE).then(c => c.match(url.pathname)).then(r => r || new Response("", { status: 404 })));
});
