let cache_name = 'peakslab 0.0.8';
let urls_to_cache = [
 '/index.html',
 '/dict.js',
 '/tdict4.db.html',
 '/peakslab2.svg',
 '/chota.css',
 '/jswasm/dict.js?sqlite3.dir=jswasm&',
 '/jswasm/sqlite3.wasm'];

self.addEventListener('install', (e) => {
 console.log("[Service Worker] Trying to install");
 e.waitUntil(caches.open(cache_name).then((cache) => {
  return cache.addAll(urls_to_cache);
 }) )
})

/*
self.addEventListener('fetch', (e) => {
 e.respondWith(caches.match(e.request).then((response) => {
  if(response)
   return response
  else
   return fetch(e.request)
 }) )
})
*/

self.addEventListener("fetch", (e) => {
  e.respondWith(
    (async () => {
      const r = await caches.match(e.request);
      console.log(`[Service Worker] Fetching resource: ${e.request.url}`);
      if (r) {
        return r;
			}
      const response = await fetch(e.request);
      const cache = await caches.open(cache_name);
      console.log(`[Service Worker] Caching new resource: ${e.request.url}`);
      cache.put(e.request, response.clone());
      return response;
    })(),
  );
});
