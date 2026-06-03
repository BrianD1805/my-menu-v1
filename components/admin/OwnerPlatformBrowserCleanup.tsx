"use client";

import { useEffect } from "react";

const CLEANUP_KEY = "orduvaOwnerPlatformBrowserCleanupV229J";

export default function OwnerPlatformBrowserCleanup() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const runCleanup = async () => {
      try {
        if ("caches" in window) {
          const keys = await caches.keys();
          await Promise.all(
            keys
              .filter((key) => key.startsWith("orduva-owner-platform-") || key.startsWith("orduva-storefront-") || key.startsWith("orduva-admin-"))
              .map((key) => caches.delete(key))
          );
        }
      } catch {
        // Do not block the Owner Platform if browser cache cleanup fails.
      }

      try {
        if ("serviceWorker" in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          await Promise.all(
            registrations
              .filter((registration) => {
                const scope = registration.scope || "";
                const script = registration.active?.scriptURL || registration.installing?.scriptURL || registration.waiting?.scriptURL || "";
                return (
                  scope.startsWith(window.location.origin) ||
                  script.includes("owner-platform-sw.js") ||
                  script.includes("sw.js") ||
                  script.includes("admin-sw.js")
                );
              })
              .map((registration) => registration.unregister())
          );
        }
      } catch {
        // Ignore unregister failures. The platform pages still use no-store network loading.
      }

      try {
        if (!sessionStorage.getItem(CLEANUP_KEY)) {
          sessionStorage.setItem(CLEANUP_KEY, "done");
          window.location.reload();
        }
      } catch {
        // Ignore reload/session errors.
      }
    };

    void runCleanup();
  }, []);

  return null;
}
