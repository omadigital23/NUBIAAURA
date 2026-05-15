const VERSION = '2026-05-15';
const CORE_CACHE = `nubia-aura-core-${VERSION}`;
const RUNTIME_CACHE = `nubia-aura-runtime-${VERSION}`;
const IMAGE_CACHE = `nubia-aura-images-${VERSION}`;

const CORE_ASSETS = [
  '/fr',
  '/offline.html',
  '/manifest.json',
  '/favicon.ico',
  '/apple-touch-icon.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/maskable-192x192.png',
  '/icons/maskable-512x512.png',
];

const STATIC_ASSET_PATTERN = /\.(?:css|js|mjs|png|jpg|jpeg|gif|webp|avif|svg|ico|woff2?|ttf|otf)$/i;

async function cacheCoreAssets() {
  const cache = await caches.open(CORE_CACHE);

  await Promise.all(
    CORE_ASSETS.map(async (asset) => {
      try {
        const request = new Request(asset, { cache: 'reload' });
        const response = await fetch(request);
        if (isCacheable(response)) {
          await cache.put(request, response);
        }
      } catch {
        // A single failed preload must not block the service worker install.
      }
    })
  );
}

function isCacheable(response) {
  return response && (response.ok || response.type === 'opaque');
}

async function putInCache(cacheName, request, response) {
  if (!isCacheable(response)) return;

  try {
    const cache = await caches.open(cacheName);
    await cache.put(request, response.clone());
  } catch {
    // Ignore quota and opaque-response cache failures.
  }
}

async function cacheFirst(request, cacheName = RUNTIME_CACHE) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  await putInCache(cacheName, request, response);
  return response;
}

async function staleWhileRevalidate(request, cacheName = RUNTIME_CACHE) {
  const cached = await caches.match(request);
  const fetchPromise = fetch(request)
    .then(async (response) => {
      await putInCache(cacheName, request, response);
      return response;
    })
    .catch(() => cached);

  return cached || fetchPromise;
}

async function networkFirst(request, fallbackUrl) {
  try {
    const response = await fetch(request);
    await putInCache(RUNTIME_CACHE, request, response);
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;

    if (fallbackUrl) {
      return caches.match(fallbackUrl);
    }

    return undefined;
  }
}

async function navigationResponse(event) {
  try {
    const preload = await event.preloadResponse;
    if (preload) {
      await putInCache(RUNTIME_CACHE, event.request, preload);
      return preload;
    }
  } catch {
    // Continue with normal navigation handling.
  }

  const response = await networkFirst(event.request, '/offline.html');
  return response || caches.match('/offline.html');
}

self.addEventListener('install', (event) => {
  event.waitUntil(cacheCoreAssets().then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      if ('navigationPreload' in self.registration) {
        await self.registration.navigationPreload.enable();
      }

      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter((cacheName) => ![CORE_CACHE, RUNTIME_CACHE, IMAGE_CACHE].includes(cacheName))
          .map((cacheName) => caches.delete(cacheName))
      );

      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const isHttpRequest = url.protocol === 'http:' || url.protocol === 'https:';
  if (!isHttpRequest) return;

  const isSameOrigin = url.origin === self.location.origin;
  if (isSameOrigin && url.pathname.startsWith('/api/')) return;
  if (isSameOrigin && url.searchParams.has('_rsc')) return;

  if (request.mode === 'navigate') {
    event.respondWith(navigationResponse(event));
    return;
  }

  if (request.destination === 'image') {
    event.respondWith(staleWhileRevalidate(request, IMAGE_CACHE));
    return;
  }

  if (isSameOrigin && (url.pathname.startsWith('/_next/static/') || STATIC_ASSET_PATTERN.test(url.pathname))) {
    event.respondWith(cacheFirst(request, RUNTIME_CACHE));
    return;
  }

  if (isSameOrigin) {
    event.respondWith(networkFirst(request));
  }
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-cart') {
    event.waitUntil(Promise.resolve());
  }
});

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data = {};
  try {
    data = event.data.json();
  } catch {
    data = { title: 'Nubia Aura', body: event.data.text() };
  }

  const options = {
    body: data.body || '',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: data.tag || 'nubia-notification',
    data: data.data || {},
    actions: data.actions || [],
    vibrate: [100, 50, 100],
  };

  event.waitUntil(self.registration.showNotification(data.title || 'Nubia Aura', options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/fr';
  const absoluteUrl = new URL(targetUrl, self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url === absoluteUrl && 'focus' in client) {
          return client.focus();
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(absoluteUrl);
      }

      return undefined;
    })
  );
});
