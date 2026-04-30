/* Tejas service worker — handles notifications and click routing */
const APP_CACHE = "tejas-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data.type === "show-notification") {
    const { title, body, action, tag } = data;
    self.registration.showNotification(title, {
      body,
      icon: "/logo192.png",
      badge: "/logo192.png",
      tag: tag || "tejas-reminder",
      data: { action: action || "/dashboard" },
      requireInteraction: false,
      vibrate: [200, 100, 200],
    });
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.action) || "/dashboard";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          client.navigate(target);
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(target);
      }
    })
  );
});
