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

// Fetch event - handle API requests only
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleAPIRequest(request));
    return;
  }

  // Pass through all other requests
  event.respondWith(fetch(request));
});

// Simple API request handling
async function handleAPIRequest(request) {
  try {
    // Try network first
    const response = await fetch(request);
    
    // Only cache successful GET requests
    if (response.ok && request.method === 'GET') {
      try {
        const cache = await caches.open(API_CACHE);
        const responseClone = response.clone();
        await cache.put(request, responseClone);
      } catch (cacheError) {
        // Ignore cache errors silently
        console.warn('Cache error (ignored):', cacheError);
      }
    }
    
    return response;
  } catch (error) {
    console.log('Network request failed, trying cache:', error);
    
    // If network fails, try cache for GET requests only
    if (request.method === 'GET') {
      try {
        const cache = await caches.open(API_CACHE);
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
          console.log('Serving API response from cache:', url.pathname);
          return cachedResponse;
        }
      } catch (cacheError) {
        console.error('Cache lookup failed:', cacheError);
      }
    }
    
    // If no cache or not a GET request, return error
    return new Response('Network error', { status: 503 });
  }
}
