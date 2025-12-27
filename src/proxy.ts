import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";

// Create the internationalization middleware
const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if pathname already has a locale prefix
  const pathnameHasLocale = routing.locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  // Skip auth check for static files and API routes
  const isStaticOrApi =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.includes(".");

  if (isStaticOrApi) {
    return NextResponse.next();
  }

  // Apply internationalization middleware first
  const intlResponse = intlMiddleware(request);

  // Extract the locale from the pathname or default to 'en'
  let locale = "en";
  for (const loc of routing.locales) {
    if (pathname.startsWith(`/${loc}/`) || pathname === `/${loc}`) {
      locale = loc;
      break;
    }
  }

  // Remove locale prefix for route matching
  const pathnameWithoutLocale = pathnameHasLocale
    ? pathname.replace(new RegExp(`^/${locale}`), "") || "/"
    : pathname;

  // Public routes that don't require authentication
  const publicRoutes = ["/login", "/register", "/api/auth"];
  const isPublicRoute = publicRoutes.some((route) =>
    pathnameWithoutLocale.startsWith(route)
  );

  // Auth-only routes (redirect to home if logged in)
  const authRoutes = ["/login", "/register"];
  const isAuthRoute = authRoutes.includes(pathnameWithoutLocale);

  // Check for session cookie (NextAuth creates this)
  const sessionCookie =
    request.cookies.get("authjs.session-token") ||
    request.cookies.get("__Secure-authjs.session-token");

  // Redirect to login if no session and accessing protected route
  if (!sessionCookie && !isPublicRoute) {
    const loginUrl = new URL(`/${locale}/login`, request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect to dashboard if has session and accessing auth pages
  if (sessionCookie && isAuthRoute) {
    return NextResponse.redirect(new URL(`/${locale}`, request.url));
  }

  return intlResponse;
}

export const config = {
  // Match all pathnames except for
  // - … if they start with `/api`, `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
