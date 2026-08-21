const CACHE_NAME = 'ga-entregas-v2';
const ASSETS = [
    './',
    './index.html',
    './icon-192.png',
    './logo.png',
    './manifest.json'
];

// Instala o service worker e pré-cacheia os arquivos essenciais
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
    );
    self.skipWaiting();
});

// Ativa e limpa caches antigos
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME)
                    .map((key) => caches.delete(key))
            );
        })
    );
    self.clients.claim();
});

// Intercepta requisições: tenta rede primeiro, se falhar usa cache (network-first)
self.addEventListener('fetch', (event) => {
    // Ignora requisições que não são GET
    if (event.request.method !== 'GET') return;

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Salva cópia no cache para uso offline
                const responseClone = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseClone);
                });
                return response;
            })
            .catch(() => {
                // Se offline, tenta devolver do cache
                return caches.match(event.request);
            })
    );
});
