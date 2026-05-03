var cacheName = 'v2:static';

self.addEventListener('install', function(e) { e.waitUntil(
		caches.open(cacheName).then(function(cache) {
			return cache.addAll([
				'./root.js',
				'./console.js',
				'./geofire.min.js',
				'./html2canvas.min.js',
				'//fonts.gstatic.com/s/abel/v6/brdGGFwqYJxjg2CD1E9o7g.woff2',
				'//fonts.gstatic.com/s/robotocondensed/v17/ieVl2ZhZI2eCN5jzbjEETS9weq8-19K7DQk6YvM.woff2'
			]).then(function() {
				self.skipWaiting();
			});
		})
	);
});

self.addEventListener('activate', function(e) { e.waitUntil(
		caches.keys().then(function(cacheNames) {
			return Promise.all(cacheNames.map(function(name) {
				if(name != cacheName)
					return caches.delete(name);
			}));
		}).then(function() {
			return self.clients.claim();
		})
	);
});

self.addEventListener('fetch', function(event) {
	if(event.request.mode == 'navigate') {
		event.respondWith(fetch(event.request).catch(function() {
			return caches.match(event.request);
		}));
		return;
	}
	event.respondWith(
			caches.match(event.request).then(function(response) {
					if (response) {
							return response;
					}
					return fetch(event.request);
			})
	);
});
