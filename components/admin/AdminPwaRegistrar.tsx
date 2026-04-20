"use client";

import { useEffect } from "react";

export default function AdminPwaRegistrar() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const onLoad = () => {
      navigator.serviceWorker
        .register("/admin-sw.js", { scope: "/admin" })
        .catch(() => {
          // Silent on purpose. Admin should still work without install support.
        });
    };

    if (document.readyState === "complete") {
      onLoad();
      return;
    }

    window.addEventListener("load", onLoad, { once: true });
    return () => window.removeEventListener("load", onLoad);
  }, []);

  return null;
}
