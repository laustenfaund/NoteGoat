// Minimal app-shell cache so the installed page has something to show
// offline and so browsers recognize this as a real installable PWA.
// This only caches the static shell, never any of your module/record data
// or your Anthropic/Google keys — those live only in localStorage.
const CACHE = 'note-goat-hosted-shell-v6';
const ASSETS = ['./', './index.html', './manifest.json', './icons/icon-192.png', './icons/icon-512.png',
  '../fonts/inter-latin-400-normal.woff2', '../fonts/inter-latin-500-normal.woff2', '../fonts/inter-latin-600-normal.woff2',
  '../fonts/inter-latin-700-normal.woff2', '../fonts/ibm-plex-mono-latin-400-normal.woff2', '../fonts/ibm-plex-mono-latin-500-normal.woff2'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    // Only this build's old caches: the plain and hosted builds share one
    // origin, so deleting every other cache would wipe the other build's.
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE && k.startsWith('note-goat-hosted-shell-')).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

// Network first, so updates (including security fixes) reach installed
// copies on the next open; the cached copy is only used when offline.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(
    fetch(event.request, { cache: 'no-cache' })
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(event.request, { ignoreSearch: true }))
  );
});
