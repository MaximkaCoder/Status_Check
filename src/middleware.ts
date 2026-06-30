import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const AUTH_PAGES = ["/login", "/register"];
const PUBLIC_API  = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/telegram/webhook",  // authenticated by Telegram secret token header
  "/api/cron/",             // authenticated by CRON_SECRET bearer token
];

function secret() {
  return new TextEncoder().encode(process.env.JWT_SECRET!);
}

async function verifyToken(token: string) {
  try { await jwtVerify(token, secret()); return true; }
  catch { return false; }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("auth-token")?.value;

  // Public API routes (login / register endpoints)
  if (PUBLIC_API.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // /api/auth/logout and /api/auth/me — allow, they handle their own auth
  if (pathname.startsWith("/api/auth/")) {
    return NextResponse.next();
  }

  // Auth pages (/login, /register) — redirect authenticated users to home
  if (AUTH_PAGES.includes(pathname)) {
    if (token && await verifyToken(token)) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  // API routes — return 401 JSON if not authenticated (not a redirect)
  if (pathname.startsWith("/api/")) {
    if (!token || !await verifyToken(token)) {
      const res = NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
      if (token) res.cookies.delete("auth-token");
      return res;
    }
    return NextResponse.next();
  }

  // All other pages — redirect to /login if not authenticated
  if (!token || !await verifyToken(token)) {
    const res = NextResponse.redirect(new URL("/login", req.url));
    if (token) res.cookies.delete("auth-token");
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|screenshots).*)"],
};
