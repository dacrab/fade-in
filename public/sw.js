// FadeIn service worker — network-first for navigations with an offline
// fallback cache. Bump CACHE_VERSION on breaking releases so `activate`
// purges the previous cache.
const CACHE_VERSION = "fadein-v2"
const OFFLINE_URL = "/"
const PRECACHE = ["/", "/manifest.json", "/favicon.svg"]

self.addEventListener("install", (event) => {
	event.waitUntil(
		caches
			.open(CACHE_VERSION)
			.then((cache) => cache.addAll(PRECACHE))
			.then(() => self.skipWaiting()),
	)
})

self.addEventListener("activate", (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) => Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))))
			.then(() => self.clients.claim()),
	)
})

self.addEventListener("fetch", (event) => {
	const { request } = event
	const url = new URL(request.url)

	// Only handle same-origin GETs; leave API, Convex and cross-origin (fonts,
	// map tiles, images) requests to the network.
	if (request.method !== "GET" || url.origin !== self.location.origin) return
	if (url.pathname.startsWith("/api")) return

	event.respondWith(
		fetch(request)
			.then((response) => {
				if (response.ok && response.type === "basic") {
					const copy = response.clone()
					event.waitUntil(caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy)))
				}
				return response
			})
			.catch(async () => {
				const cached = await caches.match(request)
				if (cached) return cached
				const offline = await caches.match(OFFLINE_URL)
				return offline ?? Response.error()
			}),
	)
})
