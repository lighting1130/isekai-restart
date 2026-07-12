// 异世界重开模拟器 - Service Worker
// 采用 cache-first 策略：优先读缓存，保证离线也能正常打开游戏。
// 每次发布更新时，把 CACHE_NAME 的版本号改一下，就能让浏览器换上新缓存。
const CACHE_NAME = "isekai-restart-v15";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-512-maskable.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // 只处理本站的 GET 请求，其他一律走网络
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          // 顺手把新请求也存进缓存，方便下次离线使用
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => {
          // 网络也不通、缓存也没有时，如果是导航请求就退回首页
          if (event.request.mode === "navigate") return caches.match("./index.html");
        });
    })
  );
});
