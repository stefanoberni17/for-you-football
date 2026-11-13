// Service Worker — For You Football
// Minimal SW for push notifications (no offline caching for now)

// Aggiornamento: il SW nuovo si attiva subito e prende le finestre aperte,
// così AppResume (ricarica al cambio build) trova sempre l'ultima versione.
self.addEventListener('install', () => { self.skipWaiting(); });
self.addEventListener('activate', (event) => { event.waitUntil(self.clients.claim()); });

self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  const title = data.title || 'For You Football';
  const options = {
    body: data.body || '',
    // Logo FYF (13/11). Niente badge: Android lo disegna come sagoma bianca e un'icona piena diventa un quadrato;
    // un badge vero va fatto a una tinta su sfondo trasparente.
    icon: '/brand/app-icona-192.png',
    data: {
      url: data.url || '/',
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Focus existing window if available
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Otherwise open new window
      return clients.openWindow(url);
    })
  );
});
