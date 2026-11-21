const CACHE_NAME = 'vixora-pwa-v4';
const ASSETS = [
  '/',
  '/manifest.json',
  '/icon-192.jpg',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg',
  '/favicon.ico'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS).catch((err) => console.log('Asset cache warning:', err)))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => 
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  
  const url = new URL(event.request.url);
  if (
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/@') ||
    url.pathname.startsWith('/node_modules') ||
    url.pathname.endsWith('.tsx') ||
    url.pathname.endsWith('.ts') ||
    url.hostname.includes('googleapis') ||
    url.hostname.includes('firestore')
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request, { cache: event.request.mode === 'navigate' ? 'no-store' : 'default' })
      .then((response) => {
        if (response && response.status === 200 && response.type === 'basic' && event.request.mode !== 'navigate') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
        });
      })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const title = event.data.title || '🚀 Vixora New Feature Update!';
    const options = {
      body: event.data.body || 'Open Vixora to see what was newly updated!',
      icon: '/icon-192.jpg',
      badge: '/icon-192.jpg',
      vibrate: [200, 100, 200, 100, 200],
      tag: 'vixora-update-' + Date.now(),
      renotify: true,
      data: event.data.data || {}
    };
    self.registration.showNotification(title, options);
  }
});

self.addEventListener('push', (event) => {
  let payload = { title: '🚀 Vixora Feature Update Advert!', message: 'A new feature update announcement was released on Vixora.' };
  try {
    if (event.data) {
      payload = event.data.json();
    }
  } catch (e) {
    if (event.data) payload.message = event.data.text();
  }

  const title = payload.title || payload.notification?.title || '🚀 Vixora New Feature Update!';
  const options = {
    body: payload.message || payload.body || payload.notification?.body || 'Open Vixora Studio to check out the new feature!',
    icon: '/icon-192.jpg',
    badge: '/icon-192.jpg',
    vibrate: [200, 100, 200, 100, 200],
    data: payload
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
