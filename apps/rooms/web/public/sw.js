// Minimal offline-first service worker for Rooms.
// The app is local-first, so caching the shell lets it open with no network.
//
// CACHE is stamped with the build version at export time (scripts/stamp-sw.mjs).
// That makes this file byte-different on every deploy, which is what lets the
// browser detect a new worker — a static cache name would pin users to a stale
// build forever. The new worker waits (no skipWaiting on install) until the
// page tells it to take over, so AppUpdater controls *when* the reload happens.
const CACHE = "rooms-__BUILD_VERSION__";

const PRECACHE = [
  "/",
  "/manifest.webmanifest",
  "/icon.svg",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// AppUpdater posts this once the user has agreed (or on refocus) to apply an
// update — the waiting worker activates and the page reloads on controllerchange.
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // never touch relay/websocket

  // version.json must always reflect the deployed build — never serve a cached copy.
  if (url.pathname === "/version.json") return;

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put("/", copy));
          return res;
        })
        .catch(() => caches.match("/").then((r) => r || caches.match(req))),
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(
      (cached) =>
        cached ||
        fetch(req).then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        }),
    ),
  );
});
