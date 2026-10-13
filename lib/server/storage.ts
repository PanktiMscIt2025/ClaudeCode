import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

/**
 * Uploaded ZIPs live in the database (SubmissionFile). The ZIP reader needs a file, so this writes the bytes to a
 * private temp directory under a fixed server-chosen name, runs `fn`, and always deletes the directory.
 */
export async function withTempZip<T>(data: Uint8Array, fn: (zipPath: string) => Promise<T>): Promise<T> {
  const dir = await mkdtemp(path.join(tmpdir(), "assignai-zip-"));
  try {
    const file = path.join(dir, "upload.zip");
    await writeFile(file, data, { mode: 0o600 });
    return await fn(file);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
