import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = new Set(["/", "/login", "/register"]);
const PROTECTED_PREFIXES = [
  "/passenger",
  "/driver",
  "/admin",
  "/onboarding",
  "/profile",
  "/dashboard",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes that don't need auth.
  if (PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  // Better Auth may use either plain or __Secure- prefixed cookie in production.
  const sessionToken =
    request.cookies.get("better-auth.session_token")?.value ||
    request.cookies.get("__Secure-better-auth.session_token")?.value;

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
  );

  if (isProtected && !sessionToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|_next/data|_vercel|favicon.ico|robots.txt|sitemap.xml|fonts|.*\\.(?:png|svg|jpg|jpeg|gif|webp|ico|css|js|map|txt|woff|woff2|ttf)$).*)",
  ],
};
