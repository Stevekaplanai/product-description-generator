// Service Worker for ProductDescriptions.io
// Implements caching strategies for better performance

const CACHE_NAME = 'productdescriptions-v1';
const API_CACHE_NAME = 'productdescriptions-api-v1';

// Files to cache on install
const urlsToCache = [
    '/',
    '/app.html',
    '/bulk.html',
    '/privacy.html',
    '/terms.html',
    '/refund.html',
    '/performance-config.js',
    '/images/og-preview.png',
    '/images/twitter-card.png',
    '/images/logo-512.png',
    '/images/favicon-32.png'
];

// Install event - cache static assets
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache.map(url => new Request(url, {cache: 'no-cache'})));
            })
            .catch(err => console.error('Cache install error:', err))
    );
    self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests and critical API endpoints
    if (request.method !== 'GET') {
        return;
    }
    
    // Skip caching for critical generation endpoints
    if (url.pathname === '/api/generate-description' || 
        url.pathname === '/api/generate-video' ||
        url.pathname === '/api/analyze-image') {
        return;
    }
    
    // API calls - Network first, cache fallback
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(
            fetch(request)
                .then(response => {
                    // Don't cache non-successful responses
                    if (!response || response.status !== 200) {
                        return response;
                    }
                    
                    // Clone the response
                    const responseToCache = response.clone();
                    
                    caches.open(API_CACHE_NAME)
                        .then(cache => {
                            cache.put(request, responseToCache);
                        });
                    
                    return response;
                })
                .catch(() => {
                    // Network failed, try cache
                    return caches.match(request);
                })
        );
        return;
    }
    
    // Static assets - Cache first, network fallback
    if (url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/)) {
        event.respondWith(
            caches.match(request)
                .then(response => {
                    if (response) {
                        return response;
                    }
                    
                    return fetch(request).then(response => {
                        // Don't cache non-successful responses
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        
                        const responseToCache = response.clone();
                        
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(request, responseToCache);
                            });
                        
                        return response;
                    });
                })
        );
        return;
    }
    
    // HTML pages - Network first, cache fallback
    if (request.headers.get('accept').includes('text/html')) {
        event.respondWith(
            fetch(request)
                .then(response => {
                    const responseToCache = response.clone();
                    
                    caches.open(CACHE_NAME)
                        .then(cache => {
                            cache.put(request, responseToCache);
                        });
                    
                    return response;
                })
                .catch(() => {
                    return caches.match(request)
                        .then(response => {
                            if (response) {
                                return response;
                            }
                            // Fallback to home page if offline
                            return caches.match('/');
                        });
                })
        );
        return;
    }
    
    // Default - try cache first
    event.respondWith(
        caches.match(request)
            .then(response => {
                return response || fetch(request);
            })
    );
});

// Background sync for offline form submissions
self.addEventListener('sync', event => {
    if (event.tag === 'sync-descriptions') {
        event.waitUntil(syncDescriptions());
    }
});

async function syncDescriptions() {
    // Get pending descriptions from IndexedDB
    // This would be implemented with IndexedDB for offline support
    console.log('Syncing offline descriptions...');
}