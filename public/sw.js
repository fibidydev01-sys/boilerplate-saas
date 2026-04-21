/**
 * Service Worker — generic boilerplate PWA.
 *
 * Strategy: Network First, Cache Fallback.
 * Offline → serve /offline.html untuk navigation, serve cached asset untuk lainnya.
 *
 * ⚠️ CACHE_NAME di-bump manual setiap deploy baru biar client fetch asset fresh.
 *    Alternative: bind ke build timestamp / commit hash di build step.
 *
 * Catatan: file ini STATIC — tidak bisa baca env var / config TS.
 * Value di sini sengaja minimal & generik supaya universal.
 */

// Bump version setiap release baru untuk force cache invalidation
const CACHE_VERSION = "v1";
const CACHE_NAME = `app-cache-${CACHE_VERSION}`;
const OFFLINE_URL = "/offline.html";

// Minimal precache — cuma yang WAJIB ada saat offline.
// Icons & asset lain di-cache on-demand saat pertama kali di-fetch.
const PRECACHE_URLS = [
  "/",
  OFFLINE_URL,
  "/manifest.webmanifest",
];

// ---------- Install ----------
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .catch((error) => {
        console.error("[SW] Precache failed:", error);
      })
  );
  self.skipWaiting();
});

// ---------- Activate — bersihin cache lama ----------
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

// ---------- Helper: fetch dengan timeout ----------
function fetchWithTimeout(request, timeout = 5000) {
  return Promise.race([
    fetch(request),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Request timeout")), timeout)
    ),
  ]);
}

// ---------- Fetch handler ----------
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  // Supabase API — offline response JSON supaya client bisa handle graceful
  if (event.request.url.includes("supabase.co")) {
    event.respondWith(
      fetchWithTimeout(event.request, 5000).catch(
        () =>
          new Response(
            JSON.stringify({
              error: "offline",
              message: "No internet connection",
            }),
            {
              status: 503,
              statusText: "Service Unavailable",
              headers: { "Content-Type": "application/json" },
            }
          )
      )
    );
    return;
  }

  // Navigation requests (HTML pages) — network-first, fallback offline page
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetchWithTimeout(event.request, 5000)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clone);
            });
          }
          return response;
        })
        .catch(() =>
          caches
            .match(event.request)
            .then((cached) => cached ?? caches.match(OFFLINE_URL))
        )
    );
    return;
  }

  // Asset lain (JS, CSS, images) — network-first, fallback cache
  event.respondWith(
    fetchWithTimeout(event.request, 5000)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });
        }
        return response;
      })
      .catch(() =>
        caches.match(event.request).then(
          (cached) =>
            cached ??
            new Response("", { status: 200, statusText: "Offline" })
        )
      )
  );
});

// ---------- Push Notification ----------
self.addEventListener("push", (event) => {
  const data = event.data?.json() || {};
  const title = data.title || "Notification";
  const options = {
    body: data.body || "You have a new notification",
    icon: "/branding/icon-192.png",
    badge: "/branding/icon-72.png",
    vibrate: [200, 100, 200],
    tag: data.tag || "general",
    requireInteraction: false,
    data: {
      url: data.url || "/",
      timestamp: Date.now(),
    },
    actions: [
      { action: "open", title: "Open" },
      { action: "close", title: "Close" },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ---------- Notification Click ----------
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "close") return;

  const urlToOpen = event.notification.data?.url || "/";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url === urlToOpen && "focus" in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// ---------- Message handler (biar app bisa kontrol SW) ----------
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  if (event.data?.type === "CACHE_URLS" && Array.isArray(event.data.urls)) {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => cache.addAll(event.data.urls))
    );
  }
});