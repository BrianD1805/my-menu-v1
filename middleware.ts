import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE } from "@/lib/admin-auth";
import { getConfiguredAdminHostname, isSharedAdminHost, normalizeHostname } from "@/lib/admin-host";

function isProtectedAdminPath(pathname: string) {
  return pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
}

function isPublicAdminPath(pathname: string) {
  return pathname === "/admin/login" || pathname.startsWith("/api/admin/auth/");
}

function currentHostFromRequest(request: NextRequest) {
  return normalizeHostname(
    request.headers.get("x-forwarded-host") || request.headers.get("host") || ""
  );
}

function maybeRedirectToSharedAdminHost(request: NextRequest, pathname: string) {
  const configuredAdminHost = getConfiguredAdminHostname();
  if (!configuredAdminHost) return null;

  const currentHost = currentHostFromRequest(request);

  if (!currentHost || currentHost === configuredAdminHost) return null;
  if (!isProtectedAdminPath(pathname)) return null;

  const url = request.nextUrl.clone();
  url.protocol = request.nextUrl.protocol;
  url.host = configuredAdminHost;
  return NextResponse.redirect(url, 307);
}

function maybeRedirectAdminHostRoot(request: NextRequest, pathname: string) {
  const configuredAdminHost = getConfiguredAdminHostname();
  if (!configuredAdminHost) return null;

  const currentHost = currentHostFromRequest(request);

  if (currentHost !== configuredAdminHost) return null;
  if (pathname !== "/") return null;

  const url = request.nextUrl.clone();
  url.pathname = "/admin/login";
  url.searchParams.set("source", "admin-host");
  return NextResponse.redirect(url, 307);
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const adminHostRedirect = maybeRedirectToSharedAdminHost(request, pathname);
  if (adminHostRedirect) return adminHostRedirect;

  const adminRootRedirect = maybeRedirectAdminHostRoot(request, pathname);
  if (adminRootRedirect) return adminRootRedirect;

  const requestHeaders = new Headers(request.headers);
  const currentHost = currentHostFromRequest(request);

  if (pathname.startsWith("/admin") || isSharedAdminHost(currentHost)) {
    requestHeaders.set("x-orduva-route-kind", "admin");
  }

  if (!isProtectedAdminPath(pathname) || isPublicAdminPath(pathname)) {
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  const sessionToken = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;

  if (sessionToken) {
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  if (pathname.startsWith("/api/admin")) {
    return NextResponse.json({ error: "Owner login required" }, { status: 401 });
  }

  const loginUrl = new URL("/admin/login", request.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/", "/admin/:path*", "/api/admin/:path*", "/manifest.webmanifest"],
};
