import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

// Private file storage outside public/: never served directly, only through authorized routes.
export const storageRoot = () => path.resolve(/* turbopackIgnore: true */ process.cwd(), process.env.STORAGE_DIR || "storage");

export async function saveSubmissionZip(data: Uint8Array): Promise<string> {
  const dir = path.join(storageRoot(), "submissions");
  await mkdir(dir, { recursive: true, mode: 0o700 });
  // Random server-chosen name: the uploaded file name is never used as a path.
  const file = path.join(dir, `${randomUUID()}.zip`);
  await writeFile(file, data, { mode: 0o600 });
  return file;
}

/** Resolve a stored path and refuse anything outside the storage root. */
export function safeStoredPath(stored: string): string | null {
  const full = path.resolve(stored);
  return full.startsWith(storageRoot() + path.sep) ? full : null;
}

export async function deleteStored(stored: string | null | undefined) {
  const full = stored && safeStoredPath(stored);
  if (full) await rm(full, { force: true });
}
