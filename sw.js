var cacheName = 'v1:static';

self.addEventListener('install', function(e) { e.waitUntil(
		caches.open(cacheName).then(function(cache) {
			return cache.addAll([
				'./script.js',
				'./geofire.min.js',
				'./html2canvas.min.js',
				'./qrcode.min.js',
				'//fonts.gstatic.com/s/abel/v6/brdGGFwqYJxjg2CD1E9o7g.woff2',
				'//fonts.gstatic.com/s/robotocondensed/v17/ieVl2ZhZI2eCN5jzbjEETS9weq8-19K7DQk6YvM.woff2'
			]).then(function() {
				self.skipWaiting();
			});
		})
	);
});

self.addEventListener('fetch', function(event) {
	event.respondWith(
			caches.match(event.request).then(function(response) {
					if (response) {
							return response;
					}
					return fetch(event.request);
			})
	);
});
