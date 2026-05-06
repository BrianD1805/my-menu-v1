"use client";

import { useEffect } from "react";

export default function StorefrontPwaRegistrar() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((registration) => {
        // Ver-0.172A: register early and ask for updates, so the improved cache
        // layer is ready for the next PWA open as soon as possible.
        registration.update().catch(() => undefined);
      })
      .catch(() => {
        // Silent on purpose. Storefront should still work without install support.
      });
  }, []);

  return null;
}
