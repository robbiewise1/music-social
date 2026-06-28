"use client";

import { useEffect, useState } from "react";
import { savePushSubscription, deletePushSubscription } from "@/app/actions/push";

type Status = "loading" | "unsupported" | "denied" | "subscribed" | "unsubscribed";

export function NotificationToggle() {
  const [status, setStatus] = useState<Status>("loading");
  const [working, setWorking] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || typeof Notification === "undefined") {
      setStatus("unsupported");
      return;
    }
    // iOS requires standalone (PWA) mode
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    if (isIOS && !(navigator as unknown as { standalone?: boolean }).standalone) {
      setStatus("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setStatus("denied");
      return;
    }
    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        setStatus(sub ? "subscribed" : "unsubscribed");
      });
    });
  }, []);

  async function subscribe() {
    setWorking(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      // Unsubscribe first so we get a fresh subscription with the current VAPID key
      const existing = await reg.pushManager.getSubscription();
      if (existing) await existing.unsubscribe();

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      });
      const json = sub.toJSON();
      const result = await savePushSubscription({
        endpoint: json.endpoint!,
        p256dh: json.keys!.p256dh,
        auth: json.keys!.auth,
      });
      if (result?.error) {
        console.error("Failed to save push subscription:", result.error);
      } else {
        setStatus("subscribed");
      }
    } catch (err) {
      console.error("Push subscription error:", err);
    } finally {
      setWorking(false);
    }
  }

  async function unsubscribe() {
    setWorking(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await deletePushSubscription(sub.endpoint);
        await sub.unsubscribe();
      }
      setStatus("unsubscribed");
    } catch (err) {
      console.error("Unsubscribe error:", err);
    } finally {
      setWorking(false);
    }
  }

  if (status === "loading" || status === "unsupported") return null;

  return (
    <div className="flex items-center justify-between rounded-xl border border-zinc-200 px-4 py-3">
      <div>
        <p className="text-sm font-medium text-zinc-900">Daily reminders</p>
        <p className="text-xs text-zinc-400">
          {status === "denied"
            ? "Blocked — enable in browser settings"
            : status === "subscribed"
            ? "You'll be notified at 10am each day"
            : "Get notified when a new prompt drops"}
        </p>
      </div>
      {status !== "denied" && (
        <button
          onClick={status === "subscribed" ? unsubscribe : subscribe}
          disabled={working}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
            status === "subscribed"
              ? "border border-zinc-300 text-zinc-600 hover:border-zinc-400"
              : "bg-zinc-900 text-white hover:bg-zinc-700"
          }`}
        >
          {working ? "..." : status === "subscribed" ? "Turn off" : "Enable"}
        </button>
      )}
    </div>
  );
}
