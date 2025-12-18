// Service Worker for NUBIA AURA PWA
const CACHE_NAME = 'nubia-aura-v1';

// Assets to cache immediately
const STATIC_ASSETS = [
    '/',
    '/fr',
    '/en',
    '/offline.html',
    '/manifest.json',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating...');
    event.waitUntil(
        caches.keys()
            .then((keys) => {
                return Promise.all(
                    keys
                        .filter((key) => key !== CACHE_NAME)
                        .map((key) => {
                            console.log('[SW] Removing old cache:', key);
                            return caches.delete(key);
                        })
                );
            })
            .then(() => self.clients.claim())
    );
});

// Fetch event - Network first, fallback to cache
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') return;

    // Skip API requests (don't cache)
    if (url.pathname.startsWith('/api/')) return;

    // Skip external requests
    if (url.origin !== self.location.origin) return;

    // For navigation requests, use Network First strategy
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    // Cache the new page
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, responseClone);
                    });
                    return response;
                })
                .catch(() => {
                    // Return cached page or offline page
                    return caches.match(request)
                        .then((cached) => cached || caches.match('/offline.html'));
                })
        );
        return;
    }

    // For static assets (images, CSS, JS), use Cache First strategy
    if (
        url.pathname.match(/\.(png|jpg|jpeg|gif|webp|svg|ico|css|js|woff2?)$/) ||
        url.pathname.startsWith('/_next/')
    ) {
        event.respondWith(
            caches.match(request)
                .then((cached) => {
                    if (cached) {
                        // Update cache in background
                        fetch(request).then((response) => {
                            caches.open(CACHE_NAME).then((cache) => {
                                cache.put(request, response);
                            });
                        });
                        return cached;
                    }

                    // Not in cache, fetch and cache
                    return fetch(request).then((response) => {
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(request, responseClone);
                        });
                        return response;
                    });
                })
        );
        return;
    }

    // Default: Network first with cache fallback
    event.respondWith(
        fetch(request)
            .then((response) => {
                const responseClone = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(request, responseClone);
                });
                return response;
            })
            .catch(() => caches.match(request))
    );
});

// Background sync for cart operations
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-cart') {
        console.log('[SW] Syncing cart...');
        // Cart sync logic would go here
    }
});

// Push notifications
self.addEventListener('push', (event) => {
    if (!event.data) return;

    const data = event.data.json();
    const options = {
        body: data.body || '',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: data.tag || 'nubia-notification',
        data: data.data || {},
        actions: data.actions || [],
        vibrate: [100, 50, 100],
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'NUBIA AURA', options)
    );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const url = event.notification.data?.url || '/';

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clients) => {
                // Focus existing window if available
                for (const client of clients) {
                    if (client.url === url && 'focus' in client) {
                        return client.focus();
                    }
                }
                // Open new window
                if (self.clients.openWindow) {
                    return self.clients.openWindow(url);
                }
            })
    );
});
