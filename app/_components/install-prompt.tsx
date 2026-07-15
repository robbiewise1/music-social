"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type Platform = "ios" | "android";

function ShareIcon() {
  return (
    <svg
      className="inline-block w-4 h-4 text-blue-500 mx-0.5 align-middle"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}

export function InstallPrompt() {
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [show, setShow] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    if (isStandalone) return;

    if (localStorage.getItem("pwa-install-dismissed")) return;

    const ua = navigator.userAgent;
    const isIOS = /iphone|ipad|ipod/i.test(ua);
    const isChromeiOS = /CriOS/i.test(ua);

    if (isIOS && !isChromeiOS) {
      setPlatform("ios");
      setShow(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setPlatform("android");
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  function dismiss() {
    localStorage.setItem("pwa-install-dismissed", "1");
    setShow(false);
  }

  async function install() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setShow(false);
  }

  if (!show || !platform) return null;

  if (platform === "ios") {
    return (
      <div className="mb-6 rounded-2xl border border-[var(--color-accent)]/18 bg-[var(--color-surface-tint)] p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-[var(--color-text)]">
            Add Music Club to your Home Screen
          </p>
          <button
            onClick={dismiss}
            aria-label="Dismiss"
            className="text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors leading-none mt-0.5 flex-shrink-0"
          >
            ✕
          </button>
        </div>
        <p className="mt-2 text-xs text-[var(--color-text-muted)]">Tap these 4 buttons in order:</p>
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <Chip>
            <DotsIcon />
            <span>···</span>
          </Chip>
          <Arrow />
          <Chip>
            <ShareIcon />
            <span>Share</span>
          </Chip>
          <Arrow />
          <Chip>
            <PlusIcon />
            <span>Add to Home Screen</span>
          </Chip>
          <Arrow />
          <Chip>
            <span>Add</span>
          </Chip>
        </div>
        <p className="mt-3 text-xs text-[var(--color-text-muted)]">
          The <span className="font-medium text-[var(--color-text-muted)]">···</span> button is at the bottom of Safari, next to the address bar.
        </p>
      </div>
    );
  }

  return (
    <div className="mb-6 flex items-center justify-between rounded-xl border border-[var(--color-accent)]/18 bg-[var(--color-surface-tint)] px-4 py-3">
      <p className="text-sm text-[var(--color-text-muted)]">Add Music Club to your Home Screen</p>
      <div className="flex items-center gap-3">
        <button
          onClick={dismiss}
          className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
        >
          Not now
        </button>
        <button
          onClick={install}
          className="rounded-full bg-[var(--color-primary)] px-3 py-1 text-xs font-medium text-white hover:bg-[var(--color-primary-hover)] transition-colors"
        >
          Add
        </button>
      </div>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-lg border border-[var(--color-accent)]/25 bg-[var(--color-surface)] px-2 py-1 text-xs font-medium text-[var(--color-text)] shadow-sm">
      {children}
    </span>
  );
}

function Arrow() {
  return <span className="text-[var(--color-text-muted)] text-xs">→</span>;
}

function DotsIcon() {
  return (
    <svg
      className="inline-block w-3 h-3 text-[var(--color-text-muted)]"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <circle cx="5" cy="12" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="19" cy="12" r="2" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      className="inline-block w-3 h-3 text-[var(--color-text-muted)]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      aria-hidden
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
