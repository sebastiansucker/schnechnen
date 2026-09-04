/**
 * Service Worker für Schnechnen: Cache-First für den App-Shell (HTML/CSS/JS/Icons),
 * Network-Only für die Leaderboard-API (/api/*), damit Highscores nie veraltet sind.
 *
 * Versionierung: CACHE_VERSION muss bei jedem Deployment erhöht werden. Alte Caches
 * werden beim `activate`-Event automatisch gelöscht, damit iOS/Chrome nicht auf einer
 * alten Version hängen bleiben.
 */
const CACHE_VERSION = 'v1';
const CACHE_NAME = `schnechnen-${CACHE_VERSION}`;

// Alle Pfade sind relativ, damit der Service Worker sowohl auf GitHub Pages
// (Unterpfad) als auch auf dem NAS (Root-Pfad) funktioniert.
const APP_SHELL = [
    './',
    './index.html',
    './style.css',
    './manifest.webmanifest',
    './leaderboard-config.js',
    './weighting.js',
    './leaderboard.js',
    './game-logic.js',
    './script.js',
    './leaderboard-screen.js',
    './favicon.ico',
    './favicon.svg',
    './icon-maskable.svg',
    './apple-touch-icon.png',
    'https://cdn.jsdelivr.net/npm/chart.js@4.5.1/dist/chart.umd.min.js'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            // Einzeln cachen statt addAll(), damit ein einzelner fehlschlagender
            // Request (z.B. CDN offline) nicht die komplette Installation blockiert.
            return Promise.all(
                APP_SHELL.map((url) => cache.add(url).catch((err) => {
                    console.warn('[SW] Konnte nicht gecacht werden:', url, err);
                }))
            );
        }).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => Promise.all(
            keys
                .filter((key) => key.startsWith('schnechnen-') && key !== CACHE_NAME)
                .map((key) => caches.delete(key))
        )).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    if (request.method !== 'GET') return;

    const url = new URL(request.url);

    // Leaderboard-API immer frisch aus dem Netzwerk holen, nie aus dem Cache.
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(fetch(request));
        return;
    }

    // App-Shell: Cache-First mit Netzwerk-Fallback (und Auffrischen des Caches).
    event.respondWith(
        caches.match(request).then((cached) => {
            const networkFetch = fetch(request).then((response) => {
                if (response && response.ok) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
                }
                return response;
            }).catch(() => cached);

            return cached || networkFetch;
        })
    );
});

// Erlaubt der Seite, einen wartenden Service Worker sofort zu aktivieren
// (z.B. nach Klick auf "Neu laden" im Update-Hinweis).
self.addEventListener('message', (event) => {
    if (event.data === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
