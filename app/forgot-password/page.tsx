"use client";

import { useActionState } from "react";
import Link from "next/link";
import { forgotPassword } from "@/app/actions/auth";

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState(forgotPassword, undefined);

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-[var(--color-text)] mb-2">
          Reset password
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] mb-8">
          Enter your email and we&apos;ll send you a reset link.
        </p>

        {state?.message ? (
          <div className="rounded-lg bg-[var(--color-surface-tint)] border border-[var(--color-accent)]/18 px-4 py-3 text-sm text-[var(--color-text)]">
            {state.message}
          </div>
        ) : (
          <form action={action} className="flex flex-col gap-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-[var(--color-text)] mb-1"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full rounded-lg border border-[var(--color-accent)]/18 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
            </div>
            {state?.error && (
              <p className="text-sm text-red-600">{state.error}</p>
            )}
            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-full bg-[var(--color-primary)] py-2.5 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-50 transition-colors mt-2"
            >
              {pending ? "Sending…" : "Send reset link"}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-[var(--color-text-muted)]">
          <Link href="/login" className="font-medium text-[var(--color-text)] hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
