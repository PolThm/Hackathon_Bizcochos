const CACHE_NAME = 'routines-pwa-v1';
const STATIC_CACHE_NAME = 'routines-static-v1';
const DYNAMIC_CACHE_NAME = 'routines-dynamic-v1';

// Static resources to cache
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icons-192.png',
  '/icons-256.png',
  '/icons-512.png',
  '/sounds/beep-long.mp3',
  '/sounds/beep-short.mp3',
  '/sounds/beep-start.mp3',
  '/sounds/victory.mp3',
  '/sounds/timer-loop.mp3',
];

// Service worker installation
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE_NAME)
      .then((cache) => {
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Installation failed', error);
      }),
  );
});

// Service worker activation
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (
              cacheName !== STATIC_CACHE_NAME &&
              cacheName !== DYNAMIC_CACHE_NAME
            ) {
              return caches.delete(cacheName);
            }
          }),
        );
      })
      .then(() => {
        return self.clients.claim();
      }),
  );
});

// Cache strategy for requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignore non-HTTP requests
  if (!request.url.startsWith('http')) {
    return;
  }

  // Cache First strategy for static assets
  if (
    request.destination === 'image' ||
    request.destination === 'audio' ||
    request.destination === 'font' ||
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons-') ||
    url.pathname.startsWith('/sounds/')
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Network First strategy for HTML pages
  if (request.destination === 'document') {
    event.respondWith(networkFirst(request));
    return;
  }

  // Stale While Revalidate strategy for other requests
  event.respondWith(staleWhileRevalidate(request));
});

// Cache First strategy
async function cacheFirst(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('Cache First failed:', error);
    return new Response('Offline content not available', { status: 503 });
  }
}

// Network First strategy
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return an offline page for HTML pages
    if (request.destination === 'document') {
      return new Response(
        `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Offline - Routines</title>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                text-align: center; 
                padding: 50px; 
                background-color: #f5f5f5;
                margin: 0;
              }
              .container {
                max-width: 400px;
                margin: 0 auto;
                background: white;
                padding: 40px;
                border-radius: 12px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              }
              .offline { color: #666; margin: 20px 0; }
              h1 { color: #333; margin-bottom: 20px; }
              .icon { font-size: 48px; margin-bottom: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="icon">📱</div>
              <h1>You are offline</h1>
              <p class="offline">This page is not available offline.</p>
              <p>Check your internet connection and try again.</p>
            </div>
          </body>
        </html>
      `,
        {
          headers: { 'Content-Type': 'text/html' },
        },
      );
    }

    return new Response('Content not available offline', { status: 503 });
  }
}

// Stale While Revalidate strategy
async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE_NAME);
  const cachedResponse = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(() => cachedResponse);

  return cachedResponse || fetchPromise;
}

// Client message handling
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
