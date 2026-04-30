import { useEffect, useRef } from "react";
import api from "../api";

// API base URL is handled by the centralized api utility
const POLL_INTERVAL_MS = 30 * 60 * 1000; // 30 min
const SHOWN_KEY = "igniteNotifShown"; // { [tag]: "YYYY-MM-DD" }

function getShownMap() {
  try {
    return JSON.parse(localStorage.getItem(SHOWN_KEY) || "{}");
  } catch {
    return {};
  }
}

function markShown(tag) {
  const map = getShownMap();
  map[tag] = new Date().toDateString();
  localStorage.setItem(SHOWN_KEY, JSON.stringify(map));
}

function alreadyShownToday(tag) {
  const map = getShownMap();
  return map[tag] === new Date().toDateString();
}

async function showNotification({ title, body, action, tag }) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  if (navigator.serviceWorker && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: "show-notification",
      title,
      body,
      action,
      tag,
    });
  } else if (navigator.serviceWorker && navigator.serviceWorker.ready) {
    const reg = await navigator.serviceWorker.ready;
    reg.showNotification(title, {
      body,
      icon: "/logo192.png",
      badge: "/logo192.png",
      tag,
      data: { action },
      vibrate: [200, 100, 200],
    });
  } else {
    new Notification(title, { body, icon: "/logo192.png", tag });
  }
}

function PushNotification() {
  const pollRef = useRef(null);
  const scheduledRef = useRef(null);

  useEffect(() => {
    if (!("Notification" in window) || Notification.permission !== "granted") {
      return;
    }

    const checkReminders = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const res = await api.get("/reminder/check");
        const reminders = res.data?.reminders || [];
        for (const r of reminders) {
          const tag = `${r.type}-${new Date().toDateString()}`;
          if (r.priority === "high" || !alreadyShownToday(r.type)) {
            await showNotification({
              title: r.title,
              body: r.body,
              action: r.action,
              tag,
            });
            markShown(r.type);
          }
        }
      } catch (err) {
        // silent — server might be down
      }
    };

    const scheduleAtUserTime = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const res = await api.get("/reminder/settings");
        const { enabled, time } = res.data || {};
        if (!enabled || !time) return;

        const [hh, mm] = time.split(":").map(Number);
        const now = new Date();
        const next = new Date();
        next.setHours(hh, mm, 0, 0);
        if (next <= now) next.setDate(next.getDate() + 1);
        const delay = next - now;

        if (scheduledRef.current) clearTimeout(scheduledRef.current);
        scheduledRef.current = setTimeout(() => {
          checkReminders();
          scheduleAtUserTime();
        }, delay);
      } catch {
        // silent
      }
    };

    checkReminders();
    scheduleAtUserTime();
    pollRef.current = setInterval(checkReminders, POLL_INTERVAL_MS);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (scheduledRef.current) clearTimeout(scheduledRef.current);
    };
  }, []);

  return null;
}

export default PushNotification;
