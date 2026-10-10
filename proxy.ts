import { NextResponse, type NextRequest } from "next/server";

// Optimistic gate only: bounce requests without a session cookie before rendering.
// Real authorization (valid session, role, temp password) happens server-side in requireUser().
export function proxy(req: NextRequest) {
  if (!req.cookies.has("aa_session")) {
    const url = new URL("/login", req.url);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/faculty/:path*", "/student/:path*", "/change-password", "/api/faculty/:path*", "/api/student/:path*"],
};
