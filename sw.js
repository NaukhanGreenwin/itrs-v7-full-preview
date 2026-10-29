/* v7: the old site's service worker is retired. Returning visitors' browsers fetch this on their next update check;
   it deletes every cache the old worker made, unregisters itself and reloads open pages from the network. */
self.addEventListener('install', function () { self.skipWaiting() })
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.map(function (k) { return caches.delete(k) })) })
    .then(function () { return self.registration.unregister() })
    .then(function () { return self.clients.matchAll({ type: 'window' }) })
    .then(function (cs) { cs.forEach(function (c) { c.navigate(c.url) }) }))
})
