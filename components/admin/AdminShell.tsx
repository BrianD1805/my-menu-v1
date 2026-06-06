"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import LogoutButton from "@/components/admin/LogoutButton";
import AdminHeaderTools from "@/components/admin/AdminHeaderTools";
import { LIVE_VERSION } from "@/lib/version";
import type { TenantTrialState } from "@/lib/trial";

type NavIcon = "home" | "orders" | "products" | "categories" | "settings" | "analytics" | "referrals" | "billing" | "storefront" | "account";

type NavItem = {
  href: string;
  label: string;
  detail: string;
  icon: NavIcon;
  current?: boolean;
};

type NavGroup = {
  label: string;
  description: string;
  items: NavItem[];
};

function AdminNavIcon({ icon }: { icon: NavIcon }) {
  const common = {
    className: "h-5 w-5",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2.15,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  switch (icon) {
    case "home":
      return (
        <svg {...common}>
          <path d="M3.5 11.5 12 4l8.5 7.5" />
          <path d="M5.5 10.5V20h13v-9.5" />
          <path d="M9.5 20v-5.5h5V20" />
        </svg>
      );
    case "orders":
      return (
        <svg {...common}>
          <path d="M7 4.75h10a1.75 1.75 0 0 1 1.75 1.75v13l-2.5-1.45-2.5 1.45-2.5-1.45-2.5 1.45-2.5-1.45v-11.55A1.75 1.75 0 0 1 7 4.75Z" />
          <path d="M8.75 9h6.5" />
          <path d="M8.75 12.25h6.5" />
          <path d="M8.75 15.5h3.75" />
        </svg>
      );
    case "products":
      return (
        <svg {...common}>
          <path d="M12 3.75 20 8.2v7.6l-8 4.45-8-4.45V8.2l8-4.45Z" />
          <path d="m4.35 8.45 7.65 4.3 7.65-4.3" />
          <path d="M12 12.75v7.25" />
        </svg>
      );
    case "categories":
      return (
        <svg {...common}>
          <path d="M5.25 5.25h5.25v5.25H5.25z" />
          <path d="M13.5 5.25h5.25v5.25H13.5z" />
          <path d="M5.25 13.5h5.25v5.25H5.25z" />
          <path d="M13.5 13.5h5.25v5.25H13.5z" />
        </svg>
      );
    case "settings":
      return (
        <svg {...common}>
          <path d="M12 15.25A3.25 3.25 0 1 0 12 8.75a3.25 3.25 0 0 0 0 6.5Z" />
          <path d="M19.25 12a7.3 7.3 0 0 0-.08-1.06l2.03-1.58-2-3.46-2.39.96a7.7 7.7 0 0 0-1.84-1.06L14.6 3.25h-4l-.37 2.55a7.7 7.7 0 0 0-1.84 1.06L6 5.9l-2 3.46 2.03 1.58a7.33 7.33 0 0 0 0 2.12L4 14.64l2 3.46 2.39-.96c.56.45 1.18.81 1.84 1.06l.37 2.55h4l.37-2.55a7.7 7.7 0 0 0 1.84-1.06l2.39.96 2-3.46-2.03-1.58c.05-.35.08-.7.08-1.06Z" />
        </svg>
      );
    case "analytics":
      return (
        <svg {...common}>
          <path d="M4.75 19.25h14.5" />
          <path d="M7 16.5V10" />
          <path d="M12 16.5V5.75" />
          <path d="M17 16.5v-8" />
          <path d="M5.75 5.75h12.5" />
        </svg>
      );
    case "referrals":
      return (
        <svg {...common}>
          <path d="M12 4.75v15" />
          <path d="M6.75 8.5h10.5a2 2 0 0 1 2 2v7.25a2 2 0 0 1-2 2H6.75a2 2 0 0 1-2-2V10.5a2 2 0 0 1 2-2Z" />
          <path d="M4.75 12.25h14.5" />
          <path d="M9.25 8.5c-1.7-.15-2.75-.95-2.75-2.1 0-1.05.82-1.9 1.95-1.9 1.75 0 2.72 2.1 3.55 4" />
          <path d="M14.75 8.5c1.7-.15 2.75-.95 2.75-2.1 0-1.05-.82-1.9-1.95-1.9-1.75 0-2.72 2.1-3.55 4" />
        </svg>
      );
    case "billing":
      return (
        <svg {...common}>
          <path d="M4.75 7.5A2.75 2.75 0 0 1 7.5 4.75h9A2.75 2.75 0 0 1 19.25 7.5v9A2.75 2.75 0 0 1 16.5 19.25h-9A2.75 2.75 0 0 1 4.75 16.5v-9Z" />
          <path d="M4.75 9.25h14.5" />
          <path d="M8.25 14.75h3" />
          <path d="M14.5 14.75h1.25" />
        </svg>
      );
    case "storefront":
      return (
        <svg {...common}>
          <path d="M5 9.25 6.1 4.75h11.8L19 9.25" />
          <path d="M5.25 9.25h13.5v10H5.25z" />
          <path d="M9 19.25v-5.5h6v5.5" />
          <path d="M4.75 9.25c.2 1.3 1.2 2.25 2.5 2.25s2.3-.95 2.5-2.25c.2 1.3 1.2 2.25 2.5 2.25s2.3-.95 2.5-2.25c.2 1.3 1.2 2.25 2.5 2.25s2.3-.95 2.5-2.25" />
        </svg>
      );
    case "account":
      return (
        <svg {...common}>
          <path d="M12 12.5a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z" />
          <path d="M5.25 20.25c.65-3.55 3.15-5.5 6.75-5.5s6.1 1.95 6.75 5.5" />
        </svg>
      );
  }
}

function buildStorefrontUrl(tenantSlug?: string | null) {
  const slug = String(tenantSlug || "").trim().toLowerCase();
  if (!slug) return "/";
  return `https://${slug}.orduva.com`;
}

function versionLabel() {
  return LIVE_VERSION.replace("Ver: ", "Ver ");
}

function MenuButtonIcon({ open }: { open: boolean }) {
  return (
    <span className="relative block h-5 w-5" aria-hidden="true">
      <span className={["absolute left-0 top-[4px] h-[2px] w-5 rounded-full bg-current transition", open ? "translate-y-[6px] rotate-45" : ""].join(" ")} />
      <span className={["absolute left-0 top-[10px] h-[2px] w-5 rounded-full bg-current transition", open ? "opacity-0" : ""].join(" ")} />
      <span className={["absolute left-0 top-[16px] h-[2px] w-5 rounded-full bg-current transition", open ? "-translate-y-[6px] -rotate-45" : ""].join(" ")} />
    </span>
  );
}

function AdminMenuPanel({
  navGroups,
  menuOpen,
  closeMenu,
  storefrontUrl,
  tenantSlug,
  tenantName,
  signedInAs,
  trialState,
}: {
  navGroups: NavGroup[];
  menuOpen: boolean;
  closeMenu: () => void;
  storefrontUrl: string;
  tenantSlug?: string | null;
  tenantName: string;
  signedInAs: string;
  trialState?: TenantTrialState | null;
}) {
  if (!menuOpen) return null;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[70] hidden cursor-default bg-[#111827]/20 backdrop-blur-[2px] sm:block"
        onClick={closeMenu}
        aria-label="Close admin menu"
      />
      <section className="fixed inset-x-3 top-3 z-[80] flex max-h-[calc(100dvh-1.5rem)] flex-col overflow-hidden rounded-[30px] border border-[#DCE5E1] bg-white text-[#111827] shadow-[0_30px_90px_rgba(17,24,39,0.24)] sm:absolute sm:inset-auto sm:right-0 sm:top-[calc(100%+0.75rem)] sm:w-[min(930px,calc(100vw-3rem))] sm:max-h-[calc(100dvh-6rem)]">
        <div className="sticky top-0 z-10 flex shrink-0 items-start justify-between gap-4 border-b border-[#DCE5E1] bg-white px-4 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#0F766E]">Tenant admin menu</p>
            <h2 className="mt-1 truncate text-xl font-black tracking-tight text-[#111827] sm:text-2xl">{tenantName}</h2>
            <p className="mt-1 text-xs font-semibold text-[#5F6B66]">{versionLabel()} · Store workspace</p>
          </div>
          <button
            type="button"
            onClick={closeMenu}
            className="admin-pressable inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#111827] text-2xl font-light leading-none text-white transition hover:bg-[#26313F]"
            aria-label="Close menu"
          >
            ×
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-6">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="grid gap-4 md:grid-cols-3">
              {navGroups.map((group) => (
                <div key={group.label} className="rounded-[24px] border border-[#DCE5E1] bg-[#F8FAF9] p-3.5">
                  <div className="px-1 pb-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0F766E]">{group.label}</p>
                    <p className="mt-1 text-xs font-semibold leading-5 text-[#5F6B66]">{group.description}</p>
                  </div>
                  <div className="grid gap-2">
                    {group.items.map((item) => (
                      <a
                        key={item.href}
                        href={item.href}
                        onClick={closeMenu}
                        aria-current={item.current ? "page" : undefined}
                        className={[
                          "admin-pressable group flex min-h-[66px] items-center gap-3 rounded-[20px] border px-3 py-2.5 text-left transition hover:-translate-y-[1px]",
                          item.current
                            ? "border-[#0F766E] bg-[#0F766E] text-white shadow-[0_14px_34px_rgba(15,118,110,0.22)]"
                            : "border-[#DCE5E1] bg-white text-[#111827] hover:border-[#0F766E]/35 hover:bg-[#EAFBF5]",
                        ].join(" ")}
                      >
                        <span
                          className={[
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition",
                            item.current ? "bg-white/16 text-white" : "bg-[#F1F5F4] text-[#0F766E] group-hover:bg-white",
                          ].join(" ")}
                        >
                          <AdminNavIcon icon={item.icon} />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-black">{item.label}</span>
                          <span className={item.current ? "mt-0.5 block text-xs font-semibold leading-5 text-white/80" : "mt-0.5 block text-xs font-semibold leading-5 text-[#5F6B66]"}>{item.detail}</span>
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <aside className="grid gap-4">
              <div className="rounded-[26px] border border-[#CFE1DD] bg-[#EAFBF5] p-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[#0F766E] shadow-sm">
                    <AdminNavIcon icon="billing" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#0F766E]">Launch & billing</p>
                    <p className="mt-1 text-sm font-bold leading-6 text-[#374151]">Checklist, trial status and active billing now live inside the menu.</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <AdminHeaderTools tenantSlug={tenantSlug} trialState={trialState} />
                </div>
              </div>

              <a
                href={storefrontUrl}
                target="_blank"
                rel="noreferrer"
                className="admin-pressable flex items-center gap-3 rounded-[24px] border border-[#DCE5E1] bg-white p-4 text-[#111827] transition hover:-translate-y-[1px] hover:border-[#0F766E]/35 hover:bg-[#F8FAF9]"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F1F5F4] text-[#0F766E]">
                  <AdminNavIcon icon="storefront" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-black">Open storefront</span>
                  <span className="mt-0.5 block truncate text-xs font-semibold text-[#5F6B66]">{tenantSlug ? `${tenantSlug}.orduva.com` : "Store address unavailable"}</span>
                </span>
              </a>

              <div className="rounded-[24px] border border-[#DCE5E1] bg-[#F8FAF9] p-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[#0F766E]">
                    <AdminNavIcon icon="account" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#0F766E]">Signed in</p>
                    <p className="mt-1 break-words text-sm font-black text-[#111827]">{signedInAs}</p>
                  </div>
                </div>
                <LogoutButton className="admin-pressable mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-[#CFE1DD] bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#0F766E] transition hover:border-[#0F766E] hover:bg-[#EAFBF5] disabled:cursor-not-allowed disabled:opacity-60" />
              </div>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}

export default function AdminShell({
  tenantName,
  tenantSlug,
  signedInAs,
  title,
  description,
  current,
  children,
  logoUrl,
  faviconUrl,
  accentColor,
  trialState,
  pageTone = "default",
}: {
  tenantName: string;
  tenantSlug?: string | null;
  signedInAs: string;
  title: string;
  description: string;
  current: "home" | "orders" | "products" | "categories" | "settings" | "analytics" | "referrals";
  children: ReactNode;
  logoUrl?: string | null;
  faviconUrl?: string | null;
  accentColor?: string | null;
  trialState?: TenantTrialState | null;
  pageTone?: "default" | "white";
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navGroups: NavGroup[] = [
    {
      label: "Run the store",
      description: "Daily order and catalogue tasks.",
      items: [
        { href: "/admin", label: "Home", detail: "Store overview", icon: "home", current: current === "home" },
        { href: "/admin/orders", label: "Orders", detail: "Receipts, status and fulfilment", icon: "orders", current: current === "orders" },
        { href: "/admin/products", label: "Products", detail: "Menu items, stock and variants", icon: "products", current: current === "products" },
        { href: "/admin/categories", label: "Categories", detail: "Store sections and sorting", icon: "categories", current: current === "categories" },
      ],
    },
    {
      label: "Grow",
      description: "Insights, customers and referrals.",
      items: [
        { href: "/admin/analytics", label: "Analytics", detail: "Sales and product performance", icon: "analytics", current: current === "analytics" },
        { href: "/admin/referrals", label: "Referrals", detail: "Tenant referral dashboard", icon: "referrals", current: current === "referrals" },
      ],
    },
    {
      label: "Configure",
      description: "Store setup, design and payments.",
      items: [
        { href: "/admin/settings", label: "Settings", detail: "Branding, payments and storefront", icon: "settings", current: current === "settings" },
        { href: "/admin/billing/activate", label: "Billing page", detail: "Open the full billing activation page", icon: "billing" },
      ],
    },
  ];

  const storefrontUrl = buildStorefrontUrl(tenantSlug);
  const tenantInitial = tenantName.trim().slice(0, 1).toUpperCase() || "O";
  const identityIconUrl = faviconUrl || null;
  const adminBackgroundClass = "bg-[#F6F8F7]";
  const adminBackdropClass = "bg-[linear-gradient(135deg,#F6F8F7_0%,#F1F5F4_58%,#FFFFFF_100%)]";

  useEffect(() => {
    if (!menuOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = original;
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  return (
    <main className={`orduva-admin-refresh relative min-h-screen overflow-x-clip ${adminBackgroundClass} px-3 py-4 text-[#111827] sm:px-6 sm:py-7`}>
      <div className={`pointer-events-none absolute inset-0 -z-10 ${adminBackdropClass}`} />
      <div className="mx-auto max-w-6xl">
        <div className="sticky top-0 z-50 -mx-3 mb-3 border-b border-[#DCE5E1] bg-white text-[#111827] sm:-mx-6 sm:mb-4">
          <div className="relative mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-2 sm:gap-3 sm:px-6 sm:py-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[16px] border border-[#DCE5E1] bg-[#EAFBF5] text-base font-black text-[#111827]">
                {identityIconUrl ? <img src={identityIconUrl} alt={`${tenantName} favicon`} className="h-full w-full object-contain p-1" /> : tenantInitial}
              </div>
              <div className="min-w-0">
                <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0F766E]">Active store</p>
                  <span className="rounded-full border border-[#CFE1DD] bg-[#EAFBF5] px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#0F766E]">
                    {versionLabel()}
                  </span>
                </div>
                <p className="truncate text-lg font-black leading-tight text-[#111827] sm:text-xl">{tenantName}</p>
                {tenantSlug ? (
                  <a
                    href={storefrontUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-0.5 block truncate text-xs font-semibold text-[#374151] underline-offset-4 transition hover:text-[#0F766E] hover:underline"
                    title="Open storefront"
                  >
                    {tenantSlug}.orduva.com
                  </a>
                ) : (
                  <p className="mt-0.5 truncate text-xs font-semibold text-[#374151]">Store address unavailable</p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setMenuOpen((value) => !value)}
              className="admin-pressable inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-2xl border border-[#0F766E]/25 bg-[#0F766E] px-3.5 py-2 text-sm font-black text-white shadow-[0_14px_30px_rgba(15,118,110,0.22)] transition hover:-translate-y-[1px] hover:bg-[#0B5F59] sm:px-4"
              aria-expanded={menuOpen}
              aria-controls="tenant-admin-mega-menu"
            >
              <MenuButtonIcon open={menuOpen} />
              <span className="hidden sm:inline">Menu</span>
            </button>

            <div id="tenant-admin-mega-menu">
              <AdminMenuPanel
                navGroups={navGroups}
                menuOpen={menuOpen}
                closeMenu={() => setMenuOpen(false)}
                storefrontUrl={storefrontUrl}
                tenantSlug={tenantSlug}
                tenantName={tenantName}
                signedInAs={signedInAs}
                trialState={trialState}
              />
            </div>
          </div>
        </div>

        <header className="overflow-hidden rounded-[26px] border border-[#DCE5E1] bg-white/[0.98] backdrop-blur-xl oa-admin-surface">
          <div className="border-b border-[#DCE5E1] px-4 py-4 sm:px-6 lg:px-7">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[16px] bg-[#111827]">
                <img src="/orduva-platform-icon-192.png" alt="Orduva Admin" className="h-full w-full object-cover" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-lg font-black tracking-tight text-[#111827]">Orduva Admin</p>
                <p className="mt-0.5 truncate text-[11px] font-black uppercase tracking-[0.2em] text-[#0F766E]">Store workspace</p>
              </div>
            </div>
          </div>

          <div className="px-4 py-5 sm:px-6 lg:px-7 lg:py-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0">
                <p className="inline-flex w-fit rounded-full border border-[#DCE5E1] bg-[#EAFBF5] px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-[#0F766E]">
                  {current} dashboard
                </p>
                <h1 className="mt-3 max-w-4xl text-2xl font-black leading-tight tracking-tight text-[#111827] sm:text-3xl lg:text-[2.35rem]">
                  {title}
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-[#374151]">{description}</p>
              </div>

              <div className="rounded-[20px] border border-[#DCE5E1] bg-[#F1F5F4] p-3 oa-admin-soft text-sm leading-6 text-[#374151] lg:min-w-[16rem]">
                <p>
                  Signed in as <span className="font-black text-[#111827]">{signedInAs}</span>
                </p>
                <p className="mt-1 text-xs font-semibold text-[#5F6B66]">Open the menu for navigation, billing and account actions.</p>
              </div>
            </div>
          </div>
        </header>

        <div className="oa-admin-content mt-4 sm:mt-5">{children}</div>
      </div>
    </main>
  );
}
