// Callio service worker.
// - Shows "your agent is calling" and reminder notifications, and opens the right screen when tapped.
// - Makes Callio installable, and shows a friendly offline page instead of the browser's error when
//   there's no connection. Pages and API calls always go to the network first; nothing personal is cached.
const CACHE = "callio-shell-v1";
const OFFLINE = "/offline";
const SHELL = [OFFLINE, "/brand/icon-192.png", "/brand/apple-touch-icon.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;
  event.respondWith(fetch(event.request).catch(() => caches.match(OFFLINE)));
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "Callio", body: event.data ? event.data.text() : "" };
  }
  const title = data.title || "Callio";
  const calling = Boolean(data.url && data.url.startsWith("/call/"));
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || "",
      icon: "/brand/icon-192.png",
      badge: "/brand/icon-192.png",
      tag: data.tag || data.url || title,
      renotify: true,
      requireInteraction: calling,
      vibrate: calling ? [400, 200, 400, 200, 400, 1000, 400, 200, 400] : [200],
      actions: calling
        ? [
            { action: "answer", title: "Answer" },
            { action: "decline", title: "Decline" },
          ]
        : [],
      data: { url: data.url || "/app" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (event.action === "decline") return;
  const url = new URL(event.notification.data?.url || "/app", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const open = clients.find((c) => c.url.startsWith(self.location.origin));
      if (open) return open.navigate(url).then((c) => c && c.focus());
      return self.clients.openWindow(url);
    }),
  );
});
