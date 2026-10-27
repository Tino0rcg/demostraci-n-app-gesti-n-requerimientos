self.addEventListener('push', function (event) {
  if (event.data) {
    try {
      const data = event.data.json();
      const options = {
        body: data.body || 'Tienes una nueva actualización en tu requerimiento.',
        icon: data.icon || '/logo-online-system.png',
        badge: '/logo-online-system.png',
        vibrate: [100, 50, 100],
        data: {
          dateOfArrival: Date.now(),
          url: data.url || '/dashboard'
        }
      };
      event.waitUntil(self.registration.showNotification(data.title || 'OnlineDesk', options));
    } catch (e) {
      const text = event.data.text();
      event.waitUntil(
        self.registration.showNotification('OnlineDesk', {
          body: text,
          icon: '/logo-online-system.png',
          data: { url: '/dashboard' }
        })
      );
    }
  }
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const urlToOpen = (event.notification.data && event.notification.data.url) ? event.notification.data.url : '/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
