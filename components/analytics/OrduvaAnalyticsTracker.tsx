"use client";

import { useEffect, useRef } from "react";

type AnalyticsScope = "public_landing" | "tenant_storefront" | "tenant_admin" | "owner_platform" | "affiliate_portal" | "checkout" | "unknown";

type AnalyticsEventDetail = {
  eventType?: string;
  scope?: AnalyticsScope;
  tenantId?: string | null;
  tenantSlug?: string | null;
  productId?: string | null;
  productName?: string | null;
  orderId?: string | null;
  referralCode?: string | null;
  affiliateCode?: string | null;
  metadata?: Record<string, unknown>;
};

function inferScope(host: string, path: string): AnalyticsScope {
  const cleanPath = path.toLowerCase();
  const cleanHost = host.toLowerCase();
  if (cleanPath.startsWith("/affiliate")) return "affiliate_portal";
  if (cleanPath.startsWith("/checkout") || cleanPath.startsWith("/billing")) return "checkout";
  if (cleanPath.startsWith("/platform")) return "owner_platform";
  if (cleanPath.startsWith("/admin")) return "tenant_admin";
  if (cleanHost.startsWith("admin.")) return "owner_platform";
  if (!cleanHost.startsWith("www.") && !cleanHost.startsWith("orduva.") && cleanHost.includes(".orduva.com")) return "tenant_storefront";
  return "public_landing";
}

function getDeviceType() {
  if (typeof window === "undefined") return "unknown";
  const width = window.innerWidth || 0;
  if (width < 640) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
}

function safeSessionId() {
  try {
    const key = "orduva_analytics_session_id";
    const existing = window.sessionStorage.getItem(key);
    if (existing) return existing;
    const next = `sess_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    window.sessionStorage.setItem(key, next);
    return next;
  } catch {
    return null;
  }
}

function forwardToGoogle(detail: AnalyticsEventDetail) {
  if (typeof window === "undefined") return;
  const eventName = detail.eventType || "page_view";
  const payload = {
    event_category: detail.scope || inferScope(window.location.hostname, window.location.pathname),
    event_label: detail.productName || detail.orderId || detail.tenantSlug || window.location.pathname,
    tenant_slug: detail.tenantSlug || undefined,
    product_id: detail.productId || undefined,
    order_id: detail.orderId || undefined,
    page_path: window.location.pathname,
  };

  const w = window as typeof window & { gtag?: (...args: unknown[]) => void; dataLayer?: unknown[] };
  if (typeof w.gtag === "function") {
    w.gtag("event", eventName, payload);
  }
  if (Array.isArray(w.dataLayer)) {
    w.dataLayer.push({ event: `orduva_${eventName}`, ...payload });
  }
}

function postAnalyticsEvent(detail: AnalyticsEventDetail) {
  if (typeof window === "undefined") return;
  forwardToGoogle(detail);
  const url = "/api/analytics/track";
  const payload = JSON.stringify({
    eventType: detail.eventType || "page_view",
    scope: detail.scope || inferScope(window.location.hostname, window.location.pathname),
    tenantId: detail.tenantId || null,
    tenantSlug: detail.tenantSlug || null,
    pagePath: window.location.pathname,
    pageUrl: window.location.href,
    referrer: document.referrer || null,
    productId: detail.productId || null,
    productName: detail.productName || null,
    orderId: detail.orderId || null,
    referralCode: detail.referralCode || null,
    affiliateCode: detail.affiliateCode || null,
    anonymousSessionId: safeSessionId(),
    deviceType: getDeviceType(),
    language: navigator.language || null,
    metadata: detail.metadata || {},
  });

  if (navigator.sendBeacon) {
    try {
      const sent = navigator.sendBeacon(url, new Blob([payload], { type: "application/json" }));
      if (sent) return;
    } catch {
      // fall through to fetch
    }
  }

  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    keepalive: true,
  }).catch(() => undefined);
}

export function trackOrduvaEvent(detail: AnalyticsEventDetail) {
  postAnalyticsEvent(detail);
}

export default function OrduvaAnalyticsTracker() {
  const lastPageKey = useRef("");

  useEffect(() => {
    function trackPageView() {
      const pageKey = `${window.location.hostname}${window.location.pathname}${window.location.search}`;
      if (lastPageKey.current === pageKey) return;
      lastPageKey.current = pageKey;
      const params = new URLSearchParams(window.location.search);
      postAnalyticsEvent({
        eventType: "page_view",
        scope: inferScope(window.location.hostname, window.location.pathname),
        tenantSlug: window.location.hostname.includes(".orduva.com") ? window.location.hostname.split(".")[0] : null,
        referralCode: params.get("ref") || params.get("referral_code") || params.get("referralCode"),
        affiliateCode: params.get("aff") || params.get("affiliate") || params.get("affiliate_code"),
      });
    }

    trackPageView();
    window.addEventListener("popstate", trackPageView);
    window.addEventListener("orduva:analytics", ((event: Event) => {
      const customEvent = event as CustomEvent<AnalyticsEventDetail>;
      postAnalyticsEvent(customEvent.detail || {});
    }) as EventListener);

    return () => {
      window.removeEventListener("popstate", trackPageView);
    };
  }, []);

  return null;
}
