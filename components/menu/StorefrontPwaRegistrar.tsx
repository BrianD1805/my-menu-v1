"use client";

import { useEffect } from "react";

export default function StorefrontPwaRegistrar() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const reloadFlag = "orduva_storefront_sw_reloaded_for_0_259";
    const handleControllerChange = () => {
      try {
        if (window.sessionStorage.getItem(reloadFlag) === "1") return;
        window.sessionStorage.setItem(reloadFlag, "1");
        window.location.reload();
      } catch {
        window.location.reload();
      }
    };

    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((registration) => {
        // Ver-0.259: ask for the newest service worker immediately. The worker
        // uses new cache names and live /api/products checks so product/price
        // changes and visible version updates do not get stuck behind old caches.
        registration.update().catch(() => undefined);
      })
      .catch(() => {
        // Silent on purpose. Storefront should still work without install support.
      });

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
    };
  }, []);

  return null;
}
