const CACHE_NAME = 'prepnext-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});

// Improved Push notification listener
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  console.log('Push received:', data);

  // Handle Firebase FCM payload structure
  // When 'notification' field is used in admin messaging.send(), 
  // sometimes Firebase auto-shows it if SW is standard, 
  // but with custom SW we handle it here:
  const payload = data.notification || data; // Handle both direct or nested
  
  const title = payload.title || 'New Notification';
  const options = {
    body: payload.body || 'You have a new update.',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    data: {
      url: data.data?.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.openWindow(url)
  );
});
