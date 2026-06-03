// Service Worker minimal para permitir instalação PWA

self.addEventListener("install", (e) => {
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (e) => {
  // Não interceptamos nada (cache bypassing) para manter o app sempre atualizado.
  // Apenas estar presente é suficiente para o navegador oferecer a instalação (PWA).
});
