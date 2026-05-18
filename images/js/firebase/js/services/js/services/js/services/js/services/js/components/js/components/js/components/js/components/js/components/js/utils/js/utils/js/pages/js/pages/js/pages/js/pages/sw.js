const CACHE_NAME = 'abella-joias-v2.1_production';
const ASSETS = [
  '/',
  '/index.html',
  '/produtos.html',
  '/carrinho.html',
  '/galvanicas.html',
  '/manifest.json',
  '/app.js',
  '/utils/helpers.js',
  '/utils/firebase-medusa.js',
  '/components/cart.js'
];

// Instalação do Worker e Limpeza Preventiva de Buffers
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Ativação e Eliminação Sistemática de Caches Legados/Antigos
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Estratégia Network-First com Fallback para Cache (Garante preços e estoques sempre atualizados)
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || e.request.url.includes('firebaseio.com')) return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(e.request, resClone);
        });
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});