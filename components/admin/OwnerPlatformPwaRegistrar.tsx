"use client";

import { useEffect } from "react";

const OWNER_MANIFEST_URL = "/orduva-owner-platform.webmanifest?v=0.229i";
const OWNER_ICON_192 = "/orduva-owner-platform-icon-192.png?v=0.229i";
const OWNER_FAVICON = "/orduva-owner-platform-favicon.ico?v=0.229i";
const OWNER_SERVICE_WORKER_URL = "/owner-platform-sw.js?v=0.229i";

function upsertLink(rel: string, href: string, attributes: Record<string, string> = {}) {
  if (typeof document === "undefined") return;

  const existingLinks = Array.from(document.querySelectorAll<HTMLLinkElement>(`link[rel=\"${rel}\"]`));
  existingLinks.forEach((link, index) => {
    if (index === 0) return;
    link.remove();
  });

  const link = existingLinks[0] || document.createElement("link");
  link.rel = rel;
  link.href = href;
  Object.entries(attributes).forEach(([key, value]) => link.setAttribute(key, value));
  if (!link.parentElement) document.head.appendChild(link);
}

export default function OwnerPlatformPwaRegistrar() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Keep the Owner Platform identity explicit on /platform. The same host also
    // serves Tenant Admin, so the browser must not inherit the admin manifest/icon.
    document.querySelectorAll('link[rel="manifest"]').forEach((node) => node.remove());
    upsertLink("manifest", OWNER_MANIFEST_URL);
    upsertLink("icon", OWNER_FAVICON, { type: "image/x-icon" });
    upsertLink("apple-touch-icon", OWNER_ICON_192);

    const metaAppName = document.querySelector<HTMLMetaElement>('meta[name="application-name"]') || document.createElement("meta");
    metaAppName.name = "application-name";
    metaAppName.content = "Orduva Owner Platform";
    if (!metaAppName.parentElement) document.head.appendChild(metaAppName);

    if (!("serviceWorker" in navigator)) return;

    const registerOwnerWorker = async () => {
      // Clear any earlier owner-platform worker/cache that may have cached
      // partial dashboard pages. The new worker is network-only and exists
      // for PWA installability, not page caching.
      try {
        if ("caches" in window) {
          const keys = await caches.keys();
          await Promise.all(keys.filter((key) => key.startsWith("orduva-owner-platform-")).map((key) => caches.delete(key)));
        }
      } catch {
        // Ignore cache cleanup failures; the app should still load from network.
      }

      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(
          registrations
            .filter((registration) => registration.active?.scriptURL.includes("owner-platform-sw.js"))
            .map((registration) => registration.unregister())
        );
      } catch {
        // Ignore unregister failures; registering the updated worker below is enough.
      }

      navigator.serviceWorker
        .register(OWNER_SERVICE_WORKER_URL, { scope: "/platform" })
        .then((registration) => registration.update().catch(() => undefined))
        .catch(() => undefined);
    };

    if (document.readyState === "complete") {
      registerOwnerWorker();
      return;
    }

    window.addEventListener("load", registerOwnerWorker, { once: true });
    return () => window.removeEventListener("load", registerOwnerWorker);
  }, []);

  return null;
}
