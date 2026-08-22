// FC Mierda Service Worker for Web Push Notifications

self.addEventListener('install', function (event) {
  // Activate worker immediately
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  // Claim active clients immediately
  event.waitUntil(self.clients.claim());
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
