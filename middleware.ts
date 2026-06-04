import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE } from "@/lib/admin-auth";
import { getConfiguredAdminHostname, isSharedAdminHost, normalizeHostname } from "@/lib/admin-host";

function isProtectedAdminPath(pathname: string) {
  return pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
}

function isPublicAdminPath(pathname: string) {
  return (
    pathname === "/admin/login" ||
    pathname === "/admin/forgot-password" ||
    pathname === "/admin/reset-password" ||
    pathname.startsWith("/api/admin/auth/")
  );
}

function currentHostFromRequest(request: NextRequest) {
  return normalizeHostname(
    request.headers.get("x-forwarded-host") || request.headers.get("host") || ""
  );
}

function withNoStoreHeaders(response: NextResponse) {
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  response.headers.set("Surrogate-Control", "no-store");
  return response;
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

  if (pathname.startsWith("/platform")) {
    requestHeaders.set("x-orduva-route-kind", "platform");
  } else if (pathname.startsWith("/admin") || isSharedAdminHost(currentHost)) {
    requestHeaders.set("x-orduva-route-kind", "admin");
  }

  if (!isProtectedAdminPath(pathname) || isPublicAdminPath(pathname)) {
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
    if (pathname.startsWith("/platform") || pathname.startsWith("/api/platform")) return withNoStoreHeaders(response);
    return response;
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
  matcher: ["/", "/admin/:path*", "/api/admin/:path*", "/platform", "/platform/:path*", "/manifest.webmanifest"],
};
