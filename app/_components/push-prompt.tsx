"use client";

import { useEffect, useState } from "react";
import { savePushSubscription } from "@/app/actions/push";

export function PushPrompt() {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    if (typeof Notification === "undefined") return;

    // On iOS, only works when installed as a PWA
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    if (isIOS && !(navigator as unknown as { standalone?: boolean }).standalone) return;

    if (Notification.permission !== "default") return;

    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        if (!sub) setShow(true);
      });
    });
  }, []);

  async function enable() {
    setLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setShow(false);
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      });

      const json = sub.toJSON();
      await savePushSubscription({
        endpoint: json.endpoint!,
        p256dh: json.keys!.p256dh,
        auth: json.keys!.auth,
      });

      setShow(false);
    } catch {
      // user declined or browser error
    } finally {
      setLoading(false);
    }
  }

  if (!show) return null;

  return (
    <div className="mb-6 flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
      <p className="text-sm text-zinc-600">Get a daily reminder to post your song</p>
      <div className="flex items-center gap-3">
        <button
          onClick={() => setShow(false)}
          className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
        >
          Not now
        </button>
        <button
          onClick={enable}
          disabled={loading}
          className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-medium text-white hover:bg-zinc-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "..." : "Enable"}
        </button>
      </div>
    </div>
  );
}
