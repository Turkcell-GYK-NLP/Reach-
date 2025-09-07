const CACHE_NAME = 'reach-plus-v1';
const STATIC_CACHE = 'reach-plus-static-v1';

// Assets to cache for offline functionality
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
];

// Emergency data to cache
const emergencyData = {
  emergencyContacts: [
    { number: '112', title: 'Acil Çağrı Merkezi' },
    { number: '110', title: 'İtfaiye' },
    { number: '155', title: 'Polis' },
  ],
  safeAreas: [], // Gerçek veriler API'den gelecek
  offlineResponses: {
    'nereye gitmeliyim': 'En yakın güvenli toplanma alanları için konumunuzu paylaşın. Gerçek zamanlı verilerle size yardımcı olabilirim.',
    'operatör': 'Bölgenizde Turkcell genellikle en iyi kapsama alanına sahiptir. Acil durumda WiFi noktalarını arayın.',
    'acil': 'Acil durumlarda 112\'yi arayın. İnternet bağlantısı olmasa da cep telefonu şebekesi çalışıyorsa arama yapabilirsiniz.',
  }
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => {
        return cache.addAll(urlsToCache);
      }),
      caches.open(CACHE_NAME).then((cache) => {
        // Cache emergency data
        return cache.put('/offline-emergency-data', 
          new Response(JSON.stringify(emergencyData), {
            headers: { 'Content-Type': 'application/json' }
          })
        );
      })
    ])
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle static assets
  event.respondWith(
    caches.match(request).then((response) => {
      // Return cached version or fetch from network
      return response || fetch(request).catch(() => {
        // If offline and no cache, return offline page
        if (request.destination === 'document') {
          return caches.match('/');
        }
      });
    })
  );
});

// Handle API requests with fallback to cached data
async function handleApiRequest(request) {
  const url = new URL(request.url);
  
  try {
    // Try to fetch from network first
    const response = await fetch(request);
    
    // Cache successful responses
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    // Network failed, try to serve from cache
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Provide offline fallbacks for specific endpoints
    return getOfflineFallback(url.pathname, request);
  }
}

// Provide offline fallbacks for critical functionality
function getOfflineFallback(pathname, request) {
  const offlineData = {
    '/api/emergency-alerts': [],
    '/api/network-status': [
      { operator: 'Turkcell', coverage: 90, location: 'Genel' },
      { operator: 'Vodafone', coverage: 85, location: 'Genel' },
      { operator: 'Türk Telekom', coverage: 75, location: 'Genel' }
    ],
    '/api/insights': [
      {
        keyword: 'çevrimdışı',
        sentiment: 'neutral',
        count: 1,
        category: 'network',
        location: 'Genel'
      }
    ]
  };

  // Chat API offline handling
  if (pathname === '/api/chat' && request.method === 'POST') {
    return request.json().then(body => {
      const message = body.message.toLowerCase();
      
      // Find matching offline response
      let response = 'Üzgünüm, şu anda çevrimdışısınız. Acil durumlar için 112\'yi arayabilirsiniz.';
      
      for (const [key, value] of Object.entries(emergencyData.offlineResponses)) {
        if (message.includes(key)) {
          response = value;
          break;
        }
      }
      
      return new Response(JSON.stringify({
        userMessage: { message: body.message },
        botMessage: { message: response },
        aiResponse: { 
          message: response,
          suggestions: ['112\'yi nasıl ararım?', 'Güvenli alanlara nasıl giderim?', 'Acil çantamı hazırlayayım mı?'],
          actionItems: []
        }
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    });
  }

  if (pathname.startsWith('/api/safe-areas/')) {
    return new Response(JSON.stringify(emergencyData.safeAreas), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Return offline data if available
  if (offlineData[pathname]) {
    return new Response(JSON.stringify(offlineData[pathname]), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Default offline response
  return new Response(JSON.stringify({
    error: 'Bu özellik çevrimdışı kullanılamıyor',
    offline: true
  }), {
    status: 503,
    headers: { 'Content-Type': 'application/json' }
  });
}

// Background sync for when connection is restored
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  // Sync any pending data when connection is restored
  console.log('Background sync triggered - syncing data...');
  
  try {
    // Refresh critical data
    await fetch('/api/emergency-alerts');
    await fetch('/api/network-status');
    await fetch('/api/insights');
    
    console.log('Data sync completed');
  } catch (error) {
    console.error('Data sync failed:', error);
  }
}
