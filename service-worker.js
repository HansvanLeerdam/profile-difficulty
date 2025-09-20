const CACHE_NAME = "profile-difficulty-cache-v1";
const urlsToCache = [
  "/profile-difficulty/index.html",
  "/profile-difficulty/styles.css",
  "/profile-difficulty/app.js",
  "/profile-difficulty/manifest.json",
  "/profile-difficulty/logo.png",
  "/profile-difficulty/profile-difficulty.ico",
  "/profile-difficulty/icons/icon-192.png",
  "/profile-difficulty/icons/icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
