import mammoth from "mammoth";
import { extractText, getDocumentProxy } from "unpdf";

export class ExtractError extends Error {}

const MAX_CHARS = 200_000;

/** Normalize whitespace and cap length so huge documents can't blow up prompts or the DB. */
export function tidy(text: string, max = MAX_CHARS): string {
  return text
    .replace(/\r/g, "")
    .replace(/[ \t\f\v]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, max);
}

export async function extractPdfText(buffer: ArrayBuffer | Uint8Array): Promise<string> {
  try {
    const pdf = await getDocumentProxy(buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer));
    const { text } = await extractText(pdf, { mergePages: true });
    return tidy(Array.isArray(text) ? text.join("\n") : text);
  } catch {
    throw new ExtractError("We couldn't read this PDF. It may be damaged or password-protected.");
  }
}

export async function extractDocxText(buffer: ArrayBuffer | Uint8Array): Promise<string> {
  try {
    const { value } = await mammoth.extractRawText({ buffer: Buffer.from(buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)) });
    return tidy(value);
  } catch {
    throw new ExtractError("We couldn't read this Word document. Save it as .docx and try again.");
  }
}

/** Extract text from a PDF or DOCX by file extension. */
export async function extractDocumentText(buffer: ArrayBuffer | Uint8Array, fileName: string): Promise<string> {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".pdf")) return extractPdfText(buffer);
  if (lower.endsWith(".docx")) return extractDocxText(buffer);
  throw new ExtractError("Upload a PDF or Word (.docx) file.");
}
