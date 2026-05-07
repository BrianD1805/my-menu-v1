"use client";

import { forwardRef, MouseEvent, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { readCart, subscribeToCartUpdates } from "@/lib/cart";

type StoredCartItem = {
  productId: string;
  quantity: number;
};

type Props = {
  tenantSlug: string;
  tenantId?: string | null;
  href?: string;
  accentColor?: string | null;
  primaryColor?: string | null;
  pulseKey?: number;
  checkoutBlocked?: boolean;
  checkoutBlockedMessage?: string | null;
};

type CustomerSession = {
  id?: string;
  fullName?: string | null;
  phone?: string | null;
};

function getItemCount(items: StoredCartItem[]) {
  return items.reduce((total, item) => total + Math.max(0, item.quantity || 0), 0);
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

const CartButton = forwardRef<HTMLAnchorElement, Props>(function CartButton(
  { tenantSlug, tenantId, href = "/checkout", accentColor, primaryColor, pulseKey = 0, checkoutBlocked = false, checkoutBlockedMessage = null },
  ref,
) {
  const router = useRouter();
  const [count, setCount] = useState(0);
  const [isPulsing, setIsPulsing] = useState(false);
  const [reminderOpen, setReminderOpen] = useState(false);
  const [trialBlockedOpen, setTrialBlockedOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const update = (items: StoredCartItem[]) => setCount(getItemCount(items));
    update(readCart<StoredCartItem>(tenantSlug));
    return subscribeToCartUpdates<StoredCartItem>(tenantSlug, update);
  }, [tenantSlug]);

  useEffect(() => {
    if (!pulseKey) return;
    setIsPulsing(true);
    const timer = window.setTimeout(() => setIsPulsing(false), 650);
    return () => window.clearTimeout(timer);
  }, [pulseKey]);

  const badge = useMemo(() => (count > 99 ? "99+" : String(count)), [count]);
  const brandAccent = accentColor || "#C7922F";
  const brandPrimary = primaryColor || "#7B1E22";
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() || "";

  function goToCart() {
    setReminderOpen(false);
    router.push(href);
  }

  async function getCurrentSubscription() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return null;
    const registration = await navigator.serviceWorker.ready;
    return registration.pushManager.getSubscription();
  }

  async function getCustomerSession(): Promise<CustomerSession | null> {
    try {
      const response = await fetch("/api/customer/auth/me", { cache: "no-store" });
      const payload = await response.json().catch(() => ({}));
      return response.ok && payload?.customer ? payload.customer : null;
    } catch {
      return null;
    }
  }

  async function saveSubscription(subscription: PushSubscription) {
    const customer = await getCustomerSession();
    const response = await fetch("/api/customer/push-subscriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenantId: tenantId || undefined,
        tenantSlug,
        customerName: customer?.fullName || null,
        customerPhone: customer?.phone || null,
        customerAccountId: customer?.id || null,
        subscription: subscription.toJSON(),
      }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload?.error || "Could not enable order updates.");
    return payload;
  }

  async function canSkipReminder() {
    if (typeof window === "undefined") return true;
    if (window.sessionStorage.getItem("orduva_customer_push_reminder_dismissed") === "1") return true;
    if (!vapidPublicKey) return true;
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || typeof Notification === "undefined") return true;
    if (Notification.permission === "denied") return true;

    if (Notification.permission === "granted") {
      const subscription = await getCurrentSubscription();
      if (!subscription) return false;

      // If the browser already has permission, quietly make sure the reusable device is saved.
      try {
        await saveSubscription(subscription);
        return true;
      } catch {
        // If silent relink fails, show the reminder so the customer has a clear action.
        return false;
      }
    }

    return false;
  }

  async function handleCartClick(event: MouseEvent<HTMLAnchorElement>) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    event.preventDefault();
    setMessage("");

    if (checkoutBlocked) {
      setTrialBlockedOpen(true);
      return;
    }

    try {
      if (await canSkipReminder()) {
        goToCart();
      } else {
        setReminderOpen(true);
      }
    } catch {
      // Never block checkout because a notification status check failed.
      goToCart();
    }
  }

  async function enableUpdates() {
    if (!vapidPublicKey) {
      setMessage("Order update notifications are not available right now.");
      return;
    }

    if (!("serviceWorker" in navigator) || !("PushManager" in window) || typeof Notification === "undefined") {
      setMessage("This device does not support order update notifications.");
      return;
    }

    setBusy(true);
    setMessage("Turning on order updates…");

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setMessage("Notifications were not allowed on this device. You can still continue to checkout.");
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      const subscription =
        existing ||
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        }));

      await saveSubscription(subscription);
      setMessage("Order updates are on for this device.");
      window.setTimeout(() => goToCart(), 350);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not turn on order updates. You can still continue to checkout.");
    } finally {
      setBusy(false);
    }
  }

  function dismissForSession() {
    try {
      window.sessionStorage.setItem("orduva_customer_push_reminder_dismissed", "1");
    } catch {}
    goToCart();
  }

  return (
    <>
      <a
        ref={ref}
        href={href}
        onClick={handleCartClick}
        className="relative inline-flex h-11 min-w-11 items-center justify-center overflow-visible rounded-2xl border bg-white/95 px-3 text-slate-900 shadow-[0_10px_24px_rgba(15,23,42,0.07)] transition hover:-translate-y-[1px] hover:bg-white"
        style={{
          borderColor: `color-mix(in srgb, ${brandAccent} 30%, white)`,
          animation: isPulsing ? "orduva-cart-pop 620ms cubic-bezier(0.22,1,0.36,1)" : undefined,
          boxShadow: isPulsing
            ? `0 16px 34px color-mix(in srgb, ${brandPrimary} 26%, rgba(15,23,42,0.16))`
            : "0 10px 24px rgba(15,23,42,0.07)",
        }}
        aria-label={`Open cart with ${badge} item${count === 1 ? "" : "s"}`}
        title="Open cart"
      >
        {isPulsing ? (
          <span
            className="pointer-events-none absolute inset-0 rounded-2xl"
            style={{
              border: `1px solid color-mix(in srgb, ${brandAccent} 55%, white)`,
              animation: "orduva-cart-ring 620ms ease-out",
            }}
            aria-hidden="true"
          />
        ) : null}

        <span className="relative inline-flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="9" cy="20" r="1" />
            <circle cx="18" cy="20" r="1" />
            <path d="M3 4h2l2.2 10.2a1 1 0 0 0 1 .8h8.9a1 1 0 0 0 1-.8L20 7H7" />
          </svg>
          <span className="absolute -right-3 -top-3 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold text-white shadow-sm" style={{ backgroundColor: brandPrimary }}>
            {badge}
          </span>
        </span>
      </a>


      {trialBlockedOpen && typeof document !== "undefined" ? createPortal(
        <div
          className="fixed inset-0 z-[9999] bg-slate-950/60 px-4 py-6 backdrop-blur-[2px]"
          style={{ position: "fixed", inset: 0, width: "100vw", minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem 1rem" }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="checkout-paused-title"
        >
          <div className="overflow-hidden rounded-[30px] border border-white/80 bg-white shadow-[0_32px_90px_rgba(15,23,42,0.26)]" style={{ width: "min(92vw, 28rem)", maxWidth: "28rem", margin: "0 auto" }}>
            <div className="relative px-5 pb-5 pt-6 sm:px-6 sm:pb-6">
              <button type="button" onClick={() => setTrialBlockedOpen(false)} className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-xl text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-900" aria-label="Close checkout paused message">×</button>
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-[0_18px_36px_rgba(15,23,42,0.18)]" style={{ background: `linear-gradient(135deg, ${brandPrimary}, ${brandAccent})` }}>
                <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8 7V5a4 4 0 0 1 8 0v2" /><rect x="5" y="7" width="14" height="14" rx="2" /><path d="M12 12v4" /></svg>
              </div>
              <div className="mt-5 text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.22em]" style={{ color: brandAccent }}>Checkout paused</p>
                <h2 id="checkout-paused-title" className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Ordering is temporarily unavailable</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">{checkoutBlockedMessage || "This store is temporarily unable to accept checkout orders while the owner renews their Orduva plan. You can still browse the menu."}</p>
              </div>
              <div className="mt-5 grid w-full gap-3">
                <button type="button" onClick={() => setTrialBlockedOpen(false)} className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_32px_rgba(15,23,42,0.16)] transition hover:-translate-y-[1px]" style={{ backgroundColor: brandPrimary }}>Continue browsing</button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      ) : null}

      {reminderOpen && typeof document !== "undefined" ? createPortal(
        <div
          className="fixed inset-0 z-[9999] bg-slate-950/60 px-4 py-6 backdrop-blur-[2px]"
          style={{
            position: "fixed",
            inset: 0,
            width: "100vw",
            minHeight: "100dvh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1.5rem 1rem",
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="order-updates-title"
        >
          <div
            className="overflow-hidden rounded-[30px] border border-white/80 bg-white shadow-[0_32px_90px_rgba(15,23,42,0.26)]"
            style={{ width: "min(92vw, 28rem)", maxWidth: "28rem", margin: "0 auto" }}
          >
            <div className="relative px-5 pb-5 pt-6 sm:px-6 sm:pb-6">
              <button
                type="button"
                onClick={() => setReminderOpen(false)}
                className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-xl text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
                aria-label="Close order updates reminder"
              >
                ×
              </button>

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-[0_18px_36px_rgba(15,23,42,0.18)]" style={{ background: `linear-gradient(135deg, ${brandPrimary}, ${brandAccent})` }}>
                <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </div>

              <div className="mt-5 text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.22em]" style={{ color: brandAccent }}>Order updates</p>
                <h2 id="order-updates-title" className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Stay updated on your order</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  We can send a quick notification when your order is accepted, prepared, ready, or delivered.
                </p>
              </div>

              {message ? (
                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-sm leading-6 text-slate-700">
                  {message}
                </div>
              ) : null}

              <div className="mt-5 grid w-full gap-3">
                <button
                  type="button"
                  onClick={() => void enableUpdates()}
                  disabled={busy}
                  className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_32px_rgba(15,23,42,0.16)] transition hover:-translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-65"
                  style={{ backgroundColor: brandPrimary }}
                >
                  {busy ? "Turning on updates…" : "Enable order updates"}
                </button>
                <button
                  type="button"
                  onClick={dismissForSession}
                  className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Not now, continue to cart
                </button>
              </div>

              <p className="mt-4 text-center text-xs leading-5 text-slate-500">
                You only need to allow this once on this device. You can still order without notifications.
              </p>
            </div>
          </div>
        </div>,
        document.body
      ) : null}
    </>
  );
});

export default CartButton;
