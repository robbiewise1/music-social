"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function ResetPasswordForm() {
  const router = useRouter();
  const [verified, setVerified] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    createClient()
      .auth.getSession()
      .then(({ data: { session } }) => {
        if (session) setVerified(true);
        else setVerifyError("Invalid or missing reset link. Request a new one.");
      });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setSubmitting(true);
    setError(null);

    const { error } = await createClient().auth.updateUser({ password });
    if (error) {
      setError(error.message);
      setSubmitting(false);
    } else {
      setSuccess(true);
      setTimeout(() => router.push("/feed"), 1500);
    }
  }

  if (verifyError) {
    return (
      <>
        <p className="text-sm text-red-600 mb-4">{verifyError}</p>
        <a href="/forgot-password" className="text-sm text-[var(--color-text)] underline underline-offset-2">
          Request a new link
        </a>
      </>
    );
  }

  if (!verified) {
    return <p className="text-sm text-[var(--color-text-muted)]">Verifying link…</p>;
  }

  if (success) {
    return (
      <p className="text-sm text-[var(--color-text)]">
        Password updated! Redirecting…
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-[var(--color-text)] mb-1"
        >
          New password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          required
          className="w-full rounded-lg border border-[var(--color-accent)]/18 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        />
      </div>
      <div>
        <label
          htmlFor="confirm"
          className="block text-sm font-medium text-[var(--color-text)] mb-1"
        >
          Confirm password
        </label>
        <input
          id="confirm"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
          required
          className="w-full rounded-lg border border-[var(--color-accent)]/18 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-full bg-[var(--color-primary)] py-2.5 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-50 transition-colors mt-2"
      >
        {submitting ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-[var(--color-text)] mb-8">
          Set new password
        </h1>
        <Suspense fallback={<p className="text-sm text-[var(--color-text-muted)]">Loading…</p>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </main>
  );
}
