// FC Mierda Service Worker for Web Push Notifications & Fast Asset Caching

const CACHE_NAME = 'fcmierda-static-v1';
const PRECACHE_ASSETS = [
  '/FCMierda-team-logo.png',
  '/manifest.json',
  '/favicon.ico',
];

self.addEventListener('install', function (event) {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(PRECACHE_ASSETS).catch(function () {
        // ignore non-critical precache fails
      });
    })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (cacheNames) {
      return Promise.all(
        cacheNames
          .filter(function (name) {
            return name !== CACHE_NAME;
          })
          .map(function (name) {
            return caches.delete(name);
          })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

// Cache-first for static image/font assets, network-only for APIs & pages
self.addEventListener('fetch', function (event) {
  const url = new URL(event.request.url);
  
  // Never intercept API, CMS, or non-GET requests
  if (
    event.request.method !== 'GET' ||
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/cms')
  ) {
    return;
  }

  // Cache static image and font extensions
  if (
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.webp') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.ico')
  ) {
    event.respondWith(
      caches.match(event.request).then(function (cachedResponse) {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then(function (networkResponse) {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then(function (cache) {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        });
      })
    );
  }
});

self.addEventListener('push', function (event) {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (err) {
      data = { body: event.data.text() };
    }
  }

  const title = data.title || 'FC Mierda ⚽';
  const options = {
    body: data.body || 'New match update available on FC Mierda!',
    icon: data.icon || '/FCMierda-team-logo.png',
    badge: data.badge || '/FCMierda-team-logo.png',
    vibrate: [150, 50, 150],
    tag: 'fcmierda-update-' + Date.now(),
    renotify: true,
    data: {
      url: data.url || '/fixtures#next-game',
      dateOfArrival: Date.now(),
    },
  };

  event.waitUntil(
    self.registration.showNotification(title, options).catch(function (err) {
      console.error('showNotification failed:', err);
    })
  );
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  const targetUrl =
    event.notification.data && event.notification.data.url
      ? event.notification.data.url
      : '/fixtures#next-game';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(function (clientList) {
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url && 'focus' in client) {
            if ('navigate' in client) {
              client.navigate(targetUrl);
            }
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});
