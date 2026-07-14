"use client";

import { useEffect } from "react";

const STOREFRONT_MANIFEST_URL = "/storefront-manifest.webmanifest?v=0.265A";
const STOREFRONT_SW_RELOAD_FLAG = "orduva_storefront_sw_reloaded_for_0_265A";

function upsertManifestLink() {
  if (typeof document === "undefined") return;
  const existing = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
  if (existing) {
    existing.setAttribute("href", STOREFRONT_MANIFEST_URL);
    return;
  }

  const link = document.createElement("link");
  link.setAttribute("rel", "manifest");
  link.setAttribute("href", STOREFRONT_MANIFEST_URL);
  document.head.appendChild(link);
}

export default function StorefrontPwaRegistrar() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Custom domains need a manifest from the same origin they are installed on.
    // Force the storefront manifest link to the dynamic storefront manifest route
    // so zimza.store installs as zimza.store rather than inheriting an old/default manifest.
    upsertManifestLink();

    if (!("serviceWorker" in navigator)) return;

    const handleControllerChange = () => {
      try {
        if (window.sessionStorage.getItem(STOREFRONT_SW_RELOAD_FLAG) === "1") return;
        window.sessionStorage.setItem(STOREFRONT_SW_RELOAD_FLAG, "1");
        window.location.reload();
      } catch {
        window.location.reload();
      }
    };

    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((registration) => {
        // Ver-0.265A: custom domains must have the current same-origin service worker
        // before Chrome will offer full app installation rather than only a shortcut.
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
