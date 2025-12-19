import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = ["/login", "/api/auth"];
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Static assets
  const isStaticOrApi =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico");

  if (isStaticOrApi) {
    return NextResponse.next();
  }

  // Check for session cookie (NextAuth creates this)
  const sessionCookie = request.cookies.get("authjs.session-token") ||
    request.cookies.get("__Secure-authjs.session-token");

  // Redirect to login if no session and accessing protected route
  if (!sessionCookie && !isPublicRoute) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect to dashboard if has session and accessing login page
  if (sessionCookie && pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
