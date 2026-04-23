"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type CustomerMe = {
  id: string;
  email: string;
  fullName: string | null;
  phone: string | null;
};

function CircleButton({
  href,
  title,
  ariaLabel,
  children,
  solid = false,
}: {
  href: string;
  title: string;
  ariaLabel: string;
  children: React.ReactNode;
  solid?: boolean;
}) {
  return (
    <Link
      href={href}
      title={title}
      aria-label={ariaLabel}
      className={[
        "pointer-events-auto inline-flex h-10 w-10 items-center justify-center rounded-2xl border shadow-[0_10px_24px_rgba(15,23,42,0.07)] transition hover:-translate-y-[1px] sm:h-11 sm:w-11",
        solid
          ? "border-slate-900 bg-slate-900 text-white hover:bg-slate-800"
          : "border-slate-200 bg-white/95 text-slate-700 hover:bg-white",
      ].join(" ")}
    >
      {children}
    </Link>
  );
}

export default function CustomerAccountHeaderActions() {
  const [customer, setCustomer] = useState<CustomerMe | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), 2500);
        const res = await fetch("/api/customer/auth/me", { cache: "no-store", signal: controller.signal });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data?.customer) {
          setCustomer(data.customer);
        } else {
          setCustomer(null);
        }
        window.clearTimeout(timeout);
      } catch {
        setCustomer(null);
      } finally {
        setReady(true);
      }
    }

    void load();
  }, []);

  if (!ready) {
    return (
      <div className="pointer-events-none flex items-center gap-2 sm:gap-2.5">
        <span className="inline-flex h-10 w-10 animate-pulse rounded-2xl border border-slate-200 bg-white/80 sm:h-11 sm:w-11" />
        <span className="hidden sm:inline-flex h-10 w-10 animate-pulse rounded-2xl border border-slate-200 bg-white/80 sm:h-11 sm:w-11" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="pointer-events-auto flex items-center gap-2 sm:gap-2.5">
        <CircleButton href="/account/login" title="Login" ariaLabel="Login">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M10 17v-1a4 4 0 0 1 4-4h5" />
            <path d="M17 21H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v3" />
            <path d="m15 12 5-5" />
            <path d="m20 12-5-5" />
          </svg>
        </CircleButton>
        <CircleButton href="/account/signup" title="Create account" ariaLabel="Create account" solid>
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
            <circle cx="9.5" cy="7" r="4" />
            <path d="M19 8v6" />
            <path d="M22 11h-6" />
          </svg>
        </CircleButton>
      </div>
    );
  }

  return (
    <div className="pointer-events-auto flex items-center gap-2 sm:gap-2.5">
      <CircleButton href="/account" title={customer ? `Signed in as ${customer.fullName || customer.email}` : "My account"} ariaLabel="My account">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20 21a8 8 0 0 0-16 0" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </CircleButton>
      <form action="/api/customer/auth/logout?next=/" method="post" className="pointer-events-auto">
        <button
          type="submit"
          title="Sign out"
          aria-label="Sign out"
          className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-900 bg-slate-900 text-white shadow-[0_10px_24px_rgba(15,23,42,0.07)] transition hover:-translate-y-[1px] hover:bg-slate-800 sm:h-11 sm:w-11"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <path d="m16 17 5-5-5-5" />
            <path d="M21 12H9" />
          </svg>
        </button>
      </form>
    </div>
  );
}
