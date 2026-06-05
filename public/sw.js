// public/sw.js

self.addEventListener('push', (event) => {
  if (!event.data) {
    console.log('Push event but no data');
    return;
  }

  const data = event.data.json();
  const title = data.title || 'FC Mierda Update';
  const options = {
    body: data.body,
    icon: '/logo-fcmierda.png', // Ensure this icon exists in /public
    badge: '/logo-fcmierda.png', // Ensure this badge icon exists in /public
    data: {
      url: data.url || '/fixtures'
    }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});