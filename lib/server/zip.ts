import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import yauzl from "yauzl";
import { extractDocxText, extractPdfText } from "./text-extract";

// Safe ZIP handling. Entry paths are only ever used as labels, never as filesystem paths:
// accepted files are written into a fresh temp directory under random flat names, read, and deleted.

export class ZipRejected extends Error {}

const LIMITS = {
  maxEntries: 500,
  maxTotalBytes: 100 * 1024 * 1024, // total uncompressed
  maxFileBytes: 25 * 1024 * 1024,
  maxRatio: 100, // uncompressed/compressed per entry: zip-bomb guard
  maxDepth: 12,
};

const TEXT_EXT = new Set([
  "txt", "md", "csv", "sql", "py", "java", "js", "jsx", "ts", "tsx", "c", "h", "cpp", "hpp", "cc", "cs", "go", "rb", "php",
  "html", "htm", "css", "scss", "json", "xml", "yaml", "yml", "ini", "toml", "kt", "swift", "scala", "r", "m", "pl", "sh",
  "ipynb", "dart", "rs", "lua", "asm", "v", "vhd", "tex", "properties", "gradle",
]);
const DOC_EXT = new Set(["pdf", "docx"]);
const IMAGE_EXT = new Set(["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp"]);
const BLOCKED_EXT = new Set([
  "exe", "dll", "so", "dylib", "bat", "cmd", "com", "msi", "scr", "ps1", "vbs", "vbe", "jar", "apk", "app", "dmg", "iso", "bin",
  "zip", "rar", "7z", "tar", "gz", "tgz", "bz2", "xz", "lnk", "reg", "hta", "cpl", "class", "pyc", "o", "obj",
]);
const IGNORED = (name: string) => /(^|\/)(__MACOSX|\.git|node_modules|\.idea|\.vscode)\//.test(name) || /(^|\/)(\.DS_Store|Thumbs\.db|desktop\.ini)$/i.test(name);

const ext = (name: string) => (name.includes(".") ? name.slice(name.lastIndexOf(".") + 1).toLowerCase() : "");

export interface ZipScan {
  accepted: string[]; // entry names to read
  rejected: string[]; // "name: reason"
  images: string[];
  totalBytes: number;
}

function openZip(file: string): Promise<yauzl.ZipFile> {
  return new Promise((resolve, reject) =>
    yauzl.open(file, { lazyEntries: true, autoClose: false, validateEntrySizes: true, strictFileNames: false }, (err, zf) => (err ? reject(err) : resolve(zf))),
  );
}

/** Walk the central directory, apply every limit, and optionally hand accepted entries to `onEntry`. */
async function walk(file: string, onEntry?: (zf: yauzl.ZipFile, entry: yauzl.Entry) => Promise<void>): Promise<ZipScan> {
  let zf: yauzl.ZipFile;
  try {
    zf = await openZip(file);
  } catch (e) {
    throw new ZipRejected(/filename|path/i.test(String(e)) ? "The ZIP contains unsafe file paths." : "This file is not a valid ZIP archive.");
  }
  const scan: ZipScan = { accepted: [], rejected: [], images: [], totalBytes: 0 };
  let count = 0;
  try {
    await new Promise<void>((resolve, reject) => {
      zf.on("error", (e) => reject(new ZipRejected(/filename|path/i.test(String(e)) ? "The ZIP contains unsafe file paths." : "The ZIP archive is damaged.")));
      zf.on("end", () => resolve());
      zf.on("entry", (entry: yauzl.Entry) => {
        void (async () => {
          const name = entry.fileName;
          count++;
          if (count > LIMITS.maxEntries) throw new ZipRejected(`The ZIP has more than ${LIMITS.maxEntries} files.`);
          if (name.endsWith("/")) return; // directory
          if (IGNORED(name)) return;
          if (name.split("/").length > LIMITS.maxDepth) throw new ZipRejected("The ZIP has folders nested too deeply.");

          const mode = (entry.externalFileAttributes >>> 16) & 0o170000;
          if (mode === 0o120000) return void scan.rejected.push(`${name}: symbolic links are not allowed`);
          if (entry.generalPurposeBitFlag & 0x1) return void scan.rejected.push(`${name}: password-protected files can't be read`);

          const size = entry.uncompressedSize;
          if (entry.compressedSize > 0 && size / entry.compressedSize > LIMITS.maxRatio && size > 1024 * 1024) {
            throw new ZipRejected("The ZIP looks like a compression bomb and was rejected.");
          }
          if (size > LIMITS.maxFileBytes) return void scan.rejected.push(`${name}: larger than ${LIMITS.maxFileBytes / 1024 / 1024} MB`);
          scan.totalBytes += size;
          if (scan.totalBytes > LIMITS.maxTotalBytes) throw new ZipRejected(`The ZIP expands to more than ${LIMITS.maxTotalBytes / 1024 / 1024} MB.`);

          const e = ext(name);
          if (BLOCKED_EXT.has(e)) return void scan.rejected.push(`${name}: ${["zip", "rar", "7z", "tar", "gz", "tgz", "bz2", "xz"].includes(e) ? "nested archives are not allowed" : "executable or binary files are not allowed"}`);
          if (IMAGE_EXT.has(e)) return void scan.images.push(name);
          if (!TEXT_EXT.has(e) && !DOC_EXT.has(e)) return void scan.rejected.push(`${name}: unsupported file type`);
          scan.accepted.push(name);
          if (onEntry) await onEntry(zf, entry);
        })()
          .then(() => zf.readEntry())
          .catch((err) => {
            zf.close();
            reject(err);
          });
      });
      zf.readEntry();
    });
  } finally {
    try {
      zf.close();
    } catch {}
  }
  return scan;
}

/** Fast structural check at upload time so students get immediate feedback. */
export function scanZip(file: string): Promise<ZipScan> {
  return walk(file);
}

function readEntry(zf: yauzl.ZipFile, entry: yauzl.Entry, limit: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    zf.openReadStream(entry, (err, stream) => {
      if (err || !stream) return reject(new ZipRejected("The ZIP archive is damaged."));
      const chunks: Buffer[] = [];
      let total = 0;
      stream.on("data", (c: Buffer) => {
        total += c.length;
        // Never trust declared sizes alone: stop reading the moment real output exceeds the limit.
        if (total > limit) {
          stream.destroy();
          reject(new ZipRejected("A file in the ZIP is larger than it claims to be."));
        } else chunks.push(c);
      });
      stream.on("end", () => resolve(Buffer.concat(chunks)));
      stream.on("error", () => reject(new ZipRejected("The ZIP archive is damaged.")));
    });
  });
}

export interface ExtractedSubmission extends ZipScan {
  text: string; // bounded, labelled per file
  unreadable: string[]; // accepted files that produced no text
  truncated: boolean;
}

const MAX_TEXT = 150_000;
const MAX_PER_FILE = 40_000;

/** Extract into a private temp dir, gather text from documents and source files, then delete everything. */
export async function extractSubmission(zipPath: string): Promise<ExtractedSubmission> {
  const tmp = await mkdtemp(path.join(os.tmpdir(), "assignai-"));
  const written: { name: string; file: string }[] = [];
  try {
    const scan = await walk(zipPath, async (zf, entry) => {
      const data = await readEntry(zf, entry, Math.min(entry.uncompressedSize, LIMITS.maxFileBytes));
      const file = path.join(tmp, `${written.length}.${ext(entry.fileName) || "dat"}`); // flat, server-chosen name
      await writeFile(file, data, { mode: 0o600 });
      written.push({ name: entry.fileName, file });
    });

    const parts: string[] = [];
    const unreadable: string[] = [];
    let used = 0;
    let truncated = false;
    // Documents first (reports carry most answers), then source files, in a stable order.
    const ordered = [...written].sort((a, b) => Number(DOC_EXT.has(ext(b.name))) - Number(DOC_EXT.has(ext(a.name))) || a.name.localeCompare(b.name));
    for (const w of ordered) {
      const e = ext(w.name);
      let content = "";
      try {
        const buf = await readFile(w.file);
        if (e === "pdf") content = await extractPdfText(buf);
        else if (e === "docx") content = await extractDocxText(buf);
        else if (!buf.includes(0)) content = buf.toString("utf8");
      } catch {
        content = "";
      }
      content = content.trim();
      if (!content) {
        unreadable.push(w.name);
        continue;
      }
      if (content.length > MAX_PER_FILE) {
        content = content.slice(0, MAX_PER_FILE) + "\n[… file truncated …]";
        truncated = true;
      }
      if (used + content.length > MAX_TEXT) {
        truncated = true;
        parts.push(`=== FILE: ${w.name} ===\n[omitted: submission text limit reached]`);
        continue;
      }
      used += content.length;
      parts.push(`=== FILE: ${w.name} ===\n${content}`);
    }
    return { ...scan, text: parts.join("\n\n"), unreadable, truncated };
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
}
