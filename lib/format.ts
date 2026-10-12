export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" });
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

/** Human "due" label relative to now, e.g. "Due in 5 days", "Due today", "Closed 3 days ago". */
export function dueLabel(iso: string, now = Date.now()): { text: string; urgent: boolean; closed: boolean } {
  const days = Math.ceil((new Date(iso).getTime() - now) / 86_400_000);
  if (days < 0) return { text: `Closed ${-days} day${days === -1 ? "" : "s"} ago`, urgent: false, closed: true };
  if (days === 0) return { text: "Due today", urgent: true, closed: false };
  if (days === 1) return { text: "Due tomorrow", urgent: true, closed: false };
  return { text: `Due in ${days} days`, urgent: days <= 3, closed: false };
}

export function percent(value: number, max: number): number {
  return max ? Math.round((value / max) * 1000) / 10 : 0;
}
