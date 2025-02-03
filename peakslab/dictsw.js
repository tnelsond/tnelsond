/*
let cache_name = 'peakslab 0.0.5';
let urls_to_cache = [
 '/index.html',
 '/dict.js',
 '/tdict3.db',
 '/jswasm/sqlite3.js',
 '/jswasm/sqlite3.wasm'];
self.addEventListener('install', (e) => {
 e.waitUntil(caches.open(cache_name).then((cache) => {
  return cache.addAll(urls_to_cache)
 }) )
})
*/
/*
self.addEventListener('fetch', (e) => {
 e.respondWith(caches.match(e.request).then((response) => {
  if(response)
   return response
  else
   return fetch(e.request)
 }) )
})*/

/*
self.addEventListener("fetch", (e) => {
  e.respondWith(
    (async () => {
      const r = await caches.match(e.request);
      console.log(`[Service Worker] Fetching resource: ${e.request.url}`);
      if (r) {
        return r;
      const response = await fetch(e.request);
      const cache = await caches.open(cache_name);
      console.log(`[Service Worker] Caching new resource: ${e.request.url}`);
      cache.put(e.request, response.clone());
      return response;
    })(),
  );
});
*/
