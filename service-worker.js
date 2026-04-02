const CACHE_NAME = 'cine-search-v2';

const urlsToCache = [
  './',
  'index.html',
  'sobre.html',
  'contato.html',
  'css/style.css',
  'js/javascript.js',
  'icons/icon-512x512.png',
  'cineSearch.png'
];

// INSTALAÇÃO
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache aberto');
        return cache.addAll(urlsToCache);
      })
  );
});

// ATIVAÇÃO (🔥 limpa cache antigo)
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
});

// FETCH (antecipa requisições e serve do cache se offline)
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .catch(() => caches.match(event.request))
  );
});