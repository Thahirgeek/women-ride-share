import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes that don't need auth
  const publicPaths = ["/", "/login", "/register"];
  if (publicPaths.includes(pathname)) {
    return NextResponse.next();
  }

  // Check for session cookie (better-auth uses this)
  const sessionToken =
    request.cookies.get("better-auth.session_token")?.value ||
    request.cookies.get("better-auth.session_token")?.value;

  // Protected routes
  const protectedPrefixes = [
    "/passenger",
    "/driver",
    "/admin",
    "/onboarding",
    "/profile",
    "/dashboard",
  ];

  const isProtected = protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
  );

  if (isProtected && !sessionToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|fonts|.*\\.png$|.*\\.svg$).*)",
  ],
};
