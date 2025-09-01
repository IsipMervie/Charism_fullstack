// TEMPORARILY DISABLED SERVICE WORKER - FIXING CACHE ERRORS
// Simple service worker for API caching only
const API_CACHE = 'api-v1';

// Install event - minimal setup
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== API_CACHE) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - DISABLED TEMPORARILY TO FIX ERRORS
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // TEMPORARILY DISABLE API CACHING - PASS THROUGH ALL REQUESTS
  if (url.pathname.startsWith('/api/')) {
    console.log('🔧 Service Worker: Passing through API request:', url.pathname);
    event.respondWith(fetch(request));
    return;
  }

  // Pass through all other requests
  event.respondWith(fetch(request));
});

// DISABLED - Simple API request handling
async function handleAPIRequest(request) {
  // TEMPORARILY DISABLED TO FIX CACHE ERRORS
  console.log('🔧 Service Worker: handleAPIRequest disabled');
  return fetch(request);
}
