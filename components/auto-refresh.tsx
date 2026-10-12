"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Re-fetch server data on an interval while `active` (e.g. while a background job runs). */
export function AutoRefresh({ active, ms = 2500 }: { active: boolean; ms?: number }) {
  const router = useRouter();
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => router.refresh(), ms);
    return () => clearInterval(t);
  }, [active, ms, router]);
  return null;
}
