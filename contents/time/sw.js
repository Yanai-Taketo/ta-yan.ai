// キャッシュ名
const CACHE_NAME = "ntp-cache-v1";

// キャッシュするファイルのリスト
const urlsToCache = [
  "index.html",
  "sw.js"
];

// Service Workerのインストール時に実行される処理
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// Service Workerのアクティブ化時に実行される処理
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// リクエストに対するレスポンスを取得する処理
function fetchAndCache(request) {
  return fetch(request)
    .then((response) => {
      // レスポンスをキャッシュに保存
      const responseToCache = response.clone();
      caches.open(CACHE_NAME).then((cache) => {
        cache.put(request, responseToCache);
      });
      return response;
    })
    .catch((error) => {
      console.log("Fetch failed; returning offline page instead.", error);

      // キャッシュからレスポンスを取得
      return caches.match(request).then((response) => {
        if (response) {
          return response;
        }
      });
    });
}

// リクエストに対するレスポンスを返す処理
self.addEventListener("fetch", (event) => {
  // NTPサーバーからの時刻取得リクエストに対するレスポンスをキャッシュから返す
  if (event.request.url === "https://worldtimeapi.org/api/ip") {
    event.respondWith(fetch(event.request));
    return;
  }

  // その他のリクエストに対するレスポンスを取得する
  event.respondWith(
    fetchAndCache(event.request)
  );
});