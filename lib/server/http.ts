import "server-only";
import { getSessionUser } from "./session";
import type { Role } from "./auth";

export const jsonError = (status: number, error: string) => Response.json({ error }, { status });

/**
 * Auth for route handlers (uploads/downloads). Returns the user, or a Response to send back.
 * State-changing requests must be same-origin (defence in depth on top of SameSite=Lax cookies).
 */
export async function routeUser(req: Request, role: Role) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    const origin = req.headers.get("origin");
    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
    if (origin && host && new URL(origin).host !== host) return jsonError(403, "Cross-origin request rejected.");
  }
  const user = await getSessionUser();
  if (!user) return jsonError(401, "Please sign in again.");
  if (user.role !== role) return jsonError(403, "You don't have access to this.");
  if (user.mustChangePassword) return jsonError(403, "Change your temporary password first.");
  return user;
}

export function mb(envName: string, fallback: number): number {
  const v = Number(process.env[envName]);
  return (Number.isFinite(v) && v > 0 ? v : fallback) * 1024 * 1024;
}

/** Reject oversized bodies before buffering them. */
export function tooLarge(req: Request, maxBytes: number): boolean {
  const len = Number(req.headers.get("content-length") ?? 0);
  return len > maxBytes + 64 * 1024; // allow multipart overhead
}

export function xlsxResponse(buffer: ArrayBuffer | Buffer, fileName: string): Response {
  return new Response(new Uint8Array(buffer as ArrayBuffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${fileName.replace(/[^\w.\-]/g, "_")}"`,
      "Cache-Control": "no-store",
    },
  });
}
