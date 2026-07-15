"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useRef } from "react";

export function UserSearchInput() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      router.replace(`/search?${params.toString()}`);
    }, 300);
  }

  return (
    <input
      type="text"
      defaultValue={searchParams.get("q") ?? ""}
      onChange={handleChange}
      placeholder="Search by username or name…"
      autoFocus
      className="w-full rounded-lg border border-[var(--color-accent)]/18 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
    />
  );
}
