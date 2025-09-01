// Simple service worker for caching
const CACHE_NAME = 'communitylink-v1';
const STATIC_CACHE = 'static-v1';
const API_CACHE = 'api-v1';

// Files to cache immediately
const STATIC_FILES = [
  '/',
  '/index.html',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/logo.png',
  '/favicon.ico'
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .catch((error) => {
        console.error('Failed to cache static files:', error);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== API_CACHE) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - handle requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleAPIRequest(request));
    return;
  }

  // Handle static file requests
  if (request.method === 'GET') {
    event.respondWith(handleStaticRequest(request));
    return;
  }

  // Pass through other requests
  event.respondWith(fetch(request));
});

// Simple API request handling without timeout
async function handleAPIRequest(request) {
  try {
    // Try network first
    const response = await fetch(request);
    
    if (response.ok) {
      // Cache successful responses
      try {
        const cache = await caches.open(API_CACHE);
        const responseClone = response.clone();
        await cache.put(request, responseClone);
      } catch (cacheError) {
        console.warn('Failed to cache API response:', cacheError);
      }
    }
    
    return response;
  } catch (error) {
    console.log('Network request failed, trying cache:', error);
    
    // If network fails, try cache
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
    
    // If no cache, return error
    return new Response('Network error', { status: 503 });
  }
}

// Simple static file handling
async function handleStaticRequest(request) {
  try {
    const cache = await caches.open(STATIC_CACHE);
    
    // Check cache first
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If not in cache, fetch from network
    try {
      const response = await fetch(request);
      if (response.ok) {
        try {
          await cache.put(request, response.clone());
        } catch (cacheError) {
          console.warn('Failed to cache static file:', cacheError);
        }
      }
      return response;
    } catch (error) {
      console.error('Static file fetch failed:', error);
      return new Response('Offline', { status: 503 });
    }
  } catch (error) {
    console.error('Static request handling failed:', error);
    return new Response('Service unavailable', { status: 503 });
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Handle background sync tasks
  console.log('Performing background sync...');
  
  // You can add offline action handling here
  // For example, syncing form submissions when back online
}

// Push notification handling
self.addEventListener('push', (event) => {
  if (event.data) {
    try {
      const data = event.data.json();
      const options = {
        body: data.body,
        icon: '/logo.png',
        badge: '/logo.png',
        vibrate: [100, 50, 100],
        data: {
          dateOfArrival: Date.now(),
          primaryKey: 1
        }
      };
      
      event.waitUntil(
        self.registration.showNotification(data.title, options)
      );
    } catch (error) {
      console.error('Push notification error:', error);
    }
  }
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/')
  );
});

// Message handling from main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
