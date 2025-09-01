// Service Worker for Performance Optimization
const CACHE_NAME = 'charism-cache-v2';
const STATIC_CACHE = 'charism-static-v2';
const API_CACHE = 'charism-api-v2';

// Files to cache immediately
const STATIC_FILES = [
  '/',
  '/index.html',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/logo.png',
  '/favicon.ico',
  '/manifest.json'
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
      .then(() => {
        console.log('Static files cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Failed to cache static files:', error);
        // Continue installation even if caching fails
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== API_CACHE) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker activated');
        return self.clients.claim();
      })
      .catch((error) => {
        console.error('Error during activation:', error);
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache when possible
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle static file requests
  if (request.method === 'GET') {
    event.respondWith(handleStaticRequest(request));
    return;
  }

  // For other requests, use network first
  event.respondWith(fetch(request));
});

// Handle API requests with improved caching strategy
async function handleApiRequest(request) {
  const url = new URL(request.url);
  
  // Don't cache certain API endpoints
  const noCacheEndpoints = [
    '/api/auth/login',
    '/api/auth/logout',
    '/api/health',
    '/api/status',
    '/api/auth/register'
  ];
  
  if (noCacheEndpoints.some(endpoint => url.pathname.includes(endpoint))) {
    try {
      return await fetch(request);
    } catch (error) {
      console.error('API request failed:', error);
      return new Response('Network error', { status: 503 });
    }
  }

  try {
    // Try network first with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(request, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (response.ok) {
      // Only cache successful responses
      try {
        const cache = await caches.open(API_CACHE);
        const responseClone = response.clone();
        await cache.put(request, responseClone);
      } catch (cacheError) {
        console.warn('Failed to cache API response:', cacheError);
        // Continue without caching
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

// Handle static file requests with improved cache first strategy
async function handleStaticRequest(request) {
  try {
    const cache = await caches.open(STATIC_CACHE);
    
    // Check cache first
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      // Update cache in background without blocking
      fetch(request).then((response) => {
        if (response.ok) {
          cache.put(request, response).catch(() => {
            // Ignore cache update errors
          });
        }
      }).catch(() => {
        // Ignore fetch errors for background updates
      });
      
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
      
      // Return offline page if available
      try {
        const offlineResponse = await cache.match('/offline.html');
        if (offlineResponse) {
          return offlineResponse;
        }
      } catch (cacheError) {
        console.error('Offline page lookup failed:', cacheError);
      }
      
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
