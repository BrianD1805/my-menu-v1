import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ADMIN_REALM = "Orduva Admin";
const ADMIN_USER_ENV = "ORDUVA_ADMIN_USERNAME";
const ADMIN_PASS_ENV = "ORDUVA_ADMIN_PASSWORD";

function getConfiguredCredentials() {
  const username = process.env[ADMIN_USER_ENV]?.trim() || "";
  const password = process.env[ADMIN_PASS_ENV]?.trim() || "";
  return { username, password };
}

function unauthorizedResponse(request: NextRequest, message?: string) {
  const isApiRequest = request.nextUrl.pathname.startsWith("/api/");

  if (isApiRequest) {
    return NextResponse.json(
      { error: message || "Admin authentication required" },
      {
        status: 401,
        headers: { "WWW-Authenticate": `Basic realm="${ADMIN_REALM}"` },
      }
    );
  }

  return new NextResponse(message || "Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": `Basic realm="${ADMIN_REALM}"` },
  });
}

function parseBasicAuth(authHeader: string | null) {
  if (!authHeader || !authHeader.startsWith("Basic ")) return null;

  try {
    const encoded = authHeader.slice(6).trim();
    const decoded = atob(encoded);
    const separatorIndex = decoded.indexOf(":");
    if (separatorIndex === -1) return null;

    const username = decoded.slice(0, separatorIndex);
    const password = decoded.slice(separatorIndex + 1);
    return { username, password };
  } catch {
    return null;
  }
}

function isProtectedAdminPath(pathname: string) {
  return pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (!isProtectedAdminPath(pathname)) {
    return NextResponse.next();
  }

  const { username, password } = getConfiguredCredentials();

  if (!username || !password) {
    return unauthorizedResponse(
      request,
      "Admin protection is enabled, but ORDUVA_ADMIN_USERNAME / ORDUVA_ADMIN_PASSWORD are not configured yet."
    );
  }

  const credentials = parseBasicAuth(request.headers.get("authorization"));
  if (!credentials) {
    return unauthorizedResponse(request);
  }

  if (credentials.username !== username || credentials.password !== password) {
    return unauthorizedResponse(request, "Invalid admin credentials");
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
