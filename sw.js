// HTML-страница — сеть в приоритете (чтобы обновления реально подхватывались), статика — из кэша мгновенно, офлайн работает через fallback на кэш
var CACHE = 'oktyabr-v5';
var SHELL = ['./', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png', 'fonts/lato-light.woff2', 'fonts/lato-bold.woff2'];
self.addEventListener('install', function (e) {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function (c) { return Promise.all(SHELL.map(function (u) { return c.add(new Request(u, { cache: 'reload' })).catch(function () {}); })); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var r = e.request;
  if (r.method !== 'GET') return;
  var u = new URL(r.url);
  if (u.origin !== location.origin) return;
  if (u.pathname.indexOf('version.json') !== -1) return;
  var isNav = r.mode === 'navigate' || (r.headers.get('accept') || '').indexOf('text/html') !== -1;
  if (isNav) {
    e.respondWith(
      fetch(r, { cache: 'no-store' }).then(function (res) {
        if (res && res.ok) { caches.open(CACHE).then(function (c) { c.put(r, res.clone()); }); }
        return res;
      }).catch(function () {
        return caches.open(CACHE).then(function (c) { return c.match(r, { ignoreSearch: true }).then(function (hit) { return hit || c.match('./'); }); });
      })
    );
    return;
  }
  e.respondWith(caches.open(CACHE).then(function (c) {
    return c.match(r, { ignoreSearch: true }).then(function (hit) {
      var net = fetch(r, { cache: 'no-store' }).then(function (res) {
        if (res && res.ok) c.put(r, res.clone());
        return res;
      }).catch(function () { return hit || c.match('./'); });
      return hit || net;
    });
  }));
});
