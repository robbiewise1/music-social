"use client";

import { useEffect, useState } from "react";
import { savePushSubscription } from "@/app/actions/push";
import { WaveformIcon } from "@/app/_components/music-icons";

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
      const result = await savePushSubscription({
        endpoint: json.endpoint!,
        p256dh: json.keys!.p256dh,
        auth: json.keys!.auth,
      });

      if (result?.error) {
        console.error("Failed to save push subscription:", result.error);
      }

      setShow(false);
    } catch (err) {
      console.error("Push subscription error:", err);
    } finally {
      setLoading(false);
    }
  }

  if (!show) return null;

  return (
    <div className="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-[var(--color-accent)]/25 bg-[var(--color-surface-tint)] px-4 py-3 shadow-[var(--shadow-soft)]">
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
          <WaveformIcon className="h-4 w-4" />
        </span>
        <p className="text-sm text-[var(--color-text)]">Get a daily reminder to post your song</p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={() => setShow(false)}
          className="rounded-md px-1.5 py-1 text-xs text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
        >
          Not now
        </button>
        <button
          onClick={enable}
          disabled={loading}
          className="rounded-full bg-[var(--color-primary)] px-3 py-1.5 text-xs font-medium text-white transition-all hover:bg-[var(--color-primary-hover)] active:scale-95 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
        >
          {loading ? "…" : "Enable"}
        </button>
      </div>
    </div>
  );
}
