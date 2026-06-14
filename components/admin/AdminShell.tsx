"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import LogoutButton from "@/components/admin/LogoutButton";
import AdminHeaderTools from "@/components/admin/AdminHeaderTools";
import { LIVE_VERSION } from "@/lib/version";
import type { TenantTrialState } from "@/lib/trial";

type NavIcon = "home" | "orders" | "preorders" | "products" | "categories" | "settings" | "analytics" | "referrals" | "billing" | "storefront" | "account";
type NavKey = "run" | "grow" | "configure" | "account";

type NavItem = {
  href: string;
  label: string;
  detail: string;
  icon: NavIcon;
  current?: boolean;
  external?: boolean;
};

type NavGroup = {
  key: NavKey;
  label: string;
  strapline: string;
  description: string;
  eyebrow: string;
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
      return <svg {...common}><path d="M3.5 11.5 12 4l8.5 7.5" /><path d="M5.5 10.5V20h13v-9.5" /><path d="M9.5 20v-5.5h5V20" /></svg>;
    case "orders":
      return <svg {...common}><path d="M7 4.75h10a1.75 1.75 0 0 1 1.75 1.75v13l-2.5-1.45-2.5 1.45-2.5-1.45-2.5 1.45-2.5-1.45v-11.55A1.75 1.75 0 0 1 7 4.75Z" /><path d="M8.75 9h6.5" /><path d="M8.75 12.25h6.5" /><path d="M8.75 15.5h3.75" /></svg>;
    case "preorders":
      return <svg {...common}><path d="M5.5 6.75h13" /><path d="M7.25 6.75l1 12.5h7.5l1-12.5" /><path d="M9 10.25h6" /><path d="M9.5 14h5" /><path d="M12 3.75v3" /></svg>;
    case "products":
      return <svg {...common}><path d="M12 3.75 20 8.2v7.6l-8 4.45-8-4.45V8.2l8-4.45Z" /><path d="m4.35 8.45 7.65 4.3 7.65-4.3" /><path d="M12 12.75v7.25" /></svg>;
    case "categories":
      return <svg {...common}><path d="M5.25 5.25h5.25v5.25H5.25z" /><path d="M13.5 5.25h5.25v5.25H13.5z" /><path d="M5.25 13.5h5.25v5.25H5.25z" /><path d="M13.5 13.5h5.25v5.25H13.5z" /></svg>;
    case "settings":
      return <svg {...common}><path d="M12 15.25A3.25 3.25 0 1 0 12 8.75a3.25 3.25 0 0 0 0 6.5Z" /><path d="M19.25 12a7.3 7.3 0 0 0-.08-1.06l2.03-1.58-2-3.46-2.39.96a7.7 7.7 0 0 0-1.84-1.06L14.6 3.25h-4l-.37 2.55a7.7 7.7 0 0 0-1.84 1.06L6 5.9l-2 3.46 2.03 1.58a7.33 7.33 0 0 0 0 2.12L4 14.64l2 3.46 2.39-.96c.56.45 1.18.81 1.84 1.06l.37 2.55h4l.37-2.55a7.7 7.7 0 0 0 1.84-1.06l2.39.96 2-3.46-2.03-1.58c.05-.35.08-.7.08-1.06Z" /></svg>;
    case "analytics":
      return <svg {...common}><path d="M4.75 19.25h14.5" /><path d="M7 16.5V10" /><path d="M12 16.5V5.75" /><path d="M17 16.5v-8" /><path d="M5.75 5.75h12.5" /></svg>;
    case "referrals":
      return <svg {...common}><path d="M12 4.75v15" /><path d="M6.75 8.5h10.5a2 2 0 0 1 2 2v7.25a2 2 0 0 1-2 2H6.75a2 2 0 0 1-2-2V10.5a2 2 0 0 1 2-2Z" /><path d="M4.75 12.25h14.5" /><path d="M9.25 8.5c-1.7-.15-2.75-.95-2.75-2.1 0-1.05.82-1.9 1.95-1.9 1.75 0 2.72 2.1 3.55 4" /><path d="M14.75 8.5c1.7-.15 2.75-.95 2.75-2.1 0-1.05-.82-1.9-1.95-1.9-1.75 0-2.72 2.1-3.55 4" /></svg>;
    case "billing":
      return <svg {...common}><path d="M4.75 7.5A2.75 2.75 0 0 1 7.5 4.75h9A2.75 2.75 0 0 1 19.25 7.5v9A2.75 2.75 0 0 1 16.5 19.25h-9A2.75 2.75 0 0 1 4.75 16.5v-9Z" /><path d="M4.75 9.25h14.5" /><path d="M8.25 14.75h3" /><path d="M14.5 14.75h1.25" /></svg>;
    case "storefront":
      return <svg {...common}><path d="M5 9.25 6.1 4.75h11.8L19 9.25" /><path d="M5.25 9.25h13.5v10H5.25z" /><path d="M9 19.25v-5.5h6v5.5" /><path d="M4.75 9.25c.2 1.3 1.2 2.25 2.5 2.25s2.3-.95 2.5-2.25c.2 1.3 1.2 2.25 2.5 2.25s2.3-.95 2.5-2.25c.2 1.3 1.2 2.25 2.5 2.25s2.3-.95 2.5-2.25" /></svg>;
    case "account":
      return <svg {...common}><path d="M12 12.5a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z" /><path d="M5.25 20.25c.65-3.55 3.15-5.5 6.75-5.5s6.1 1.95 6.75 5.5" /></svg>;
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

function MobileMenuIcon({ open }: { open: boolean }) {
  return (
    <span className="relative block h-5 w-5" aria-hidden="true">
      <span className={["absolute left-0 top-[4px] h-[2px] w-5 rounded-full bg-current transition", open ? "translate-y-[6px] rotate-45" : ""].join(" ")} />
      <span className={["absolute left-0 top-[10px] h-[2px] w-5 rounded-full bg-current transition", open ? "opacity-0" : ""].join(" ")} />
      <span className={["absolute left-0 top-[16px] h-[2px] w-5 rounded-full bg-current transition", open ? "-translate-y-[6px] -rotate-45" : ""].join(" ")} />
    </span>
  );
}


function AdminChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={["h-4 w-4 transition", open ? "rotate-180" : ""].join(" ")}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function adminDisplayName(tenantName: string) {
  const cleanName = tenantName.trim() || "Orduva";
  return /\badmin$/i.test(cleanName) ? cleanName : `${cleanName} Admin`;
}

function MenuItemCard({ item, closeMenu }: { item: NavItem; closeMenu: () => void }) {
  return (
    <a
      href={item.href}
      onClick={closeMenu}
      target={item.external ? "_blank" : undefined}
      rel={item.external ? "noreferrer" : undefined}
      aria-current={item.current ? "page" : undefined}
      className={["admin-pressable group flex min-h-[62px] items-center gap-2.5 rounded-[15px] border px-3 py-2.5 text-left shadow-[0_8px_18px_rgba(17,24,39,0.045)] transition hover:-translate-y-[1px] hover:border-[#0F766E]/35", item.current ? "border-[#0F766E] bg-[#0F766E] text-white" : "border-[#E0E6E4] bg-white text-[#111827] hover:bg-[#FBFFFD]"].join(" ")}
    >
      <span className={["flex h-8 w-8 shrink-0 items-center justify-center rounded-[13px] transition", item.current ? "bg-white/16 text-white" : "bg-[#EAFBF5] text-[#0F766E] group-hover:bg-[#0F766E] group-hover:text-white"].join(" ")}>
        <AdminNavIcon icon={item.icon} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-black leading-tight tracking-tight">{item.label}</span>
        <span className={["mt-0.5 block text-[11px] font-bold leading-4", item.current ? "text-white/82" : "text-[#5F6B66]"].join(" ")}>{item.detail}</span>
      </span>
      <span className={["flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition", item.current ? "bg-white/14 text-white" : "bg-[#F1F5F4] text-[#5F6B66] group-hover:bg-[#0F766E] group-hover:text-white"].join(" ")} aria-hidden="true">
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17 17 7" /><path d="M9 7h8v8" /></svg>
      </span>
    </a>
  );
}

function MegaFeatureCard({ group, tenantName }: { group: NavGroup; tenantName: string }) {
  return (
    <aside className="relative flex min-h-[14rem] overflow-hidden rounded-[20px] bg-[#111827] p-4 text-white shadow-[0_14px_30px_rgba(17,24,39,0.16)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_100%,rgba(15,118,110,0.55),transparent_38%),linear-gradient(145deg,#111827_0%,#162231_58%,#243126_100%)]" />
      <div className="relative z-10 flex min-h-full flex-col justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span className="h-[3px] w-9 rounded-full bg-[#0F766E]" />
            <p className="text-xs font-black uppercase tracking-[0.24em] text-white/84">{group.eyebrow}</p>
          </div>
          <h2 className="mt-7 text-xl font-black leading-tight tracking-tight">{group.strapline}</h2>
        </div>
        <div>
          <p className="text-xs font-bold leading-5 text-white/72">{group.description}</p>
          <p className="mt-4 rounded-[16px] border border-white/10 bg-white/8 px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-white/78">{tenantName}</p>
        </div>
      </div>
    </aside>
  );
}

function DesktopMegaDropdown({
  group,
  closeMenu,
  keepMenuOpen,
  scheduleMenuClose,
  tenantName,
  tenantSlug,
  signedInAs,
  trialState,
}: {
  group: NavGroup | null;
  closeMenu: () => void;
  keepMenuOpen: () => void;
  scheduleMenuClose: () => void;
  tenantName: string;
  tenantSlug?: string | null;
  signedInAs: string;
  trialState?: TenantTrialState | null;
}) {
  if (!group) return null;

  const isConfigure = group.key === "configure";
  const isAccount = group.key === "account";
  const storefrontUrl = buildStorefrontUrl(tenantSlug);

  return (
    <section
      className="absolute right-0 top-[calc(100%+5px)] z-[80] hidden w-[min(43rem,calc(100vw-3rem))] overflow-hidden rounded-[22px] border border-[#9fbfdf] bg-[#9fbfdf] p-4 text-[#111827] shadow-[0_20px_44px_rgba(17,24,39,0.14)] backdrop-blur-xl lg:block"
      onMouseEnter={keepMenuOpen}
      onMouseLeave={scheduleMenuClose}
    >
      <div className="grid gap-3 lg:grid-cols-[14rem_minmax(0,1fr)]">
        <MegaFeatureCard group={group} tenantName={tenantName} />
        <div className="grid content-start gap-2.5">
          {group.items.map((item) => (
            <MenuItemCard key={item.href} item={item} closeMenu={closeMenu} />
          ))}

          {isConfigure ? (
            <div className="rounded-[16px] border border-[#CFE1DD] bg-[#EAFBF5] p-3 shadow-[0_12px_28px_rgba(17,24,39,0.05)]">
              <div className="flex items-start gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[13px] bg-white text-[#0F766E] shadow-sm">
                  <AdminNavIcon icon="billing" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#0F766E]">Launch & billing</p>
                  <p className="mt-1 text-sm font-black leading-5 text-[#111827]">Checklist, trial status and active billing</p>
                  <p className="mt-1 text-sm font-semibold leading-5 text-[#5F6B66]">Billing controls now live inside the Configure menu.</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <AdminHeaderTools tenantSlug={tenantSlug} trialState={trialState} />
              </div>
            </div>
          ) : null}

          {isAccount ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[20px] border border-[#E0E6E4] bg-white p-4 shadow-[0_12px_28px_rgba(17,24,39,0.05)]">
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#0F766E]">Signed in</p>
                <p className="mt-2 break-words text-base font-black text-[#111827]">{signedInAs}</p>
                <LogoutButton className="admin-pressable mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-[#CFE1DD] bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#0F766E] transition hover:border-[#0F766E] hover:bg-[#EAFBF5] disabled:cursor-not-allowed disabled:opacity-60" />
              </div>
              <a href={storefrontUrl} target="_blank" rel="noreferrer" className="admin-pressable rounded-[20px] border border-[#E0E6E4] bg-white p-4 shadow-[0_12px_28px_rgba(17,24,39,0.05)] transition hover:-translate-y-[1px] hover:border-[#0F766E]/35 hover:bg-[#FBFFFD]">
                <span className="flex h-9 w-9 items-center justify-center rounded-[14px] bg-[#EAFBF5] text-[#0F766E]"><AdminNavIcon icon="storefront" /></span>
                <span className="mt-3 block text-sm font-black text-[#111827]">Open storefront</span>
                <span className="mt-0.5 block truncate text-xs font-semibold text-[#5F6B66]">{tenantSlug ? `${tenantSlug}.orduva.com` : "Store address unavailable"}</span>
              </a>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function MobileMegaMenu({
  open,
  groups,
  closeMenu,
  tenantName,
  tenantSlug,
  signedInAs,
  trialState,
}: {
  open: boolean;
  groups: NavGroup[];
  closeMenu: () => void;
  tenantName: string;
  tenantSlug?: string | null;
  signedInAs: string;
  trialState?: TenantTrialState | null;
}) {
  if (!open) return null;
  const storefrontUrl = buildStorefrontUrl(tenantSlug);

  return (
    <section className="absolute left-0 right-0 top-[calc(100%+5px)] z-[80] max-h-[calc(100dvh-6.75rem)] overflow-y-auto rounded-[24px] border border-[#9fbfdf] bg-[#9fbfdf] p-3 text-[#111827] shadow-[0_22px_48px_rgba(17,24,39,0.16)] backdrop-blur-xl lg:hidden">
      <div className="rounded-[20px] bg-[#111827] p-4 text-white">
        <div className="flex items-center gap-3">
          <span className="h-[3px] w-9 rounded-full bg-[#0F766E]" />
          <p className="text-xs font-black uppercase tracking-[0.24em] text-white/82">Tenant admin menu</p>
        </div>
        <h2 className="mt-4 text-xl font-black tracking-tight">{tenantName}</h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-white/70">All admin sections are available below.</p>
      </div>

      <div className="mt-2 grid gap-2">
        {groups.map((group) => (
          <div key={group.key} className="rounded-[20px] border border-[#E0E6E4] bg-[#9fbfdf] p-3">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#0F766E]">{group.label}</p>
            <p className="mt-1 text-base font-black text-[#111827]">{group.strapline}</p>
            <div className="mt-2 grid gap-2">
              {group.items.map((item) => (
                <MenuItemCard key={`${group.key}-${item.href}`} item={item} closeMenu={closeMenu} />
              ))}
            </div>
            {group.key === "configure" ? (
              <div className="mt-3 rounded-[16px] border border-[#CFE1DD] bg-[#EAFBF5] p-3">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#0F766E]">Launch & billing</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <AdminHeaderTools tenantSlug={tenantSlug} trialState={trialState} />
                </div>
              </div>
            ) : null}
          </div>
        ))}

        <div className="grid gap-3 rounded-[24px] border border-[#E0E6E4] bg-white p-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#0F766E]">Signed in</p>
            <p className="mt-1 break-words text-sm font-black text-[#111827]">{signedInAs}</p>
          </div>
          <a href={storefrontUrl} target="_blank" rel="noreferrer" className="admin-pressable inline-flex min-h-11 items-center justify-center rounded-2xl border border-[#DCE5E1] bg-[#9fbfdf] px-4 py-2 text-sm font-black text-[#111827] transition hover:border-[#0F766E]/35 hover:bg-[#EAFBF5]">
            Open storefront
          </a>
          <LogoutButton className="admin-pressable inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-[#CFE1DD] bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#0F766E] transition hover:border-[#0F766E] hover:bg-[#EAFBF5] disabled:cursor-not-allowed disabled:opacity-60" />
        </div>
      </div>
    </section>
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
  current: "home" | "orders" | "preorders" | "products" | "categories" | "settings" | "analytics" | "referrals" | "affiliates" | "account";
  children: ReactNode;
  logoUrl?: string | null;
  faviconUrl?: string | null;
  accentColor?: string | null;
  trialState?: TenantTrialState | null;
  pageTone?: "default" | "white";
}) {
  const storefrontUrl = buildStorefrontUrl(tenantSlug);
  const navGroups: NavGroup[] = useMemo(() => [
    {
      key: "run",
      label: "Run the store",
      eyebrow: "Store",
      strapline: "Run the store",
      description: "Daily order, product and catalogue tasks for keeping the store moving.",
      items: [
        { href: "/admin", label: "Home", detail: "Store overview", icon: "home", current: current === "home" },
        { href: "/admin/orders", label: "Orders", detail: "Receipts, status and fulfilment", icon: "orders", current: current === "orders" },
        { href: "/admin/preorders", label: "Pre-orders", detail: "Deposits, arrivals and balances", icon: "preorders", current: current === "preorders" },
        { href: "/admin/products", label: "Products", detail: "Menu items, stock and variants", icon: "products", current: current === "products" },
        { href: "/admin/categories", label: "Categories", detail: "Store sections and sorting", icon: "categories", current: current === "categories" },
      ],
    },
    {
      key: "grow",
      label: "Grow",
      eyebrow: "Growth",
      strapline: "Grow the store",
      description: "Sales insight, tenant referrals and public affiliate tools for growing the customer base.",
      items: [
        { href: "/admin/analytics", label: "Analytics", detail: "Sales and product performance", icon: "analytics", current: current === "analytics" },
        { href: "/admin/referrals", label: "Tenant referrals", detail: "Refer businesses to Orduva", icon: "referrals", current: current === "referrals" },
        { href: "/admin/affiliates", label: "Public affiliates", detail: "Affiliate applicants and partner introductions", icon: "account", current: current === "affiliates" },
      ],
    },
    {
      key: "configure",
      label: "Configure",
      eyebrow: "Setup",
      strapline: "Configure the store",
      description: "Branding, storefront settings, payments, launch checklist, trial status and billing.",
      items: [
        { href: "/admin/settings", label: "Settings", detail: "Branding, payments and storefront", icon: "settings", current: current === "settings" },
        { href: "/admin/billing/activate", label: "Billing page", detail: "Full billing activation page", icon: "billing" },
      ],
    },
    {
      key: "account",
      label: "Account",
      eyebrow: "Account",
      strapline: "Account and storefront",
      description: "Open the public storefront, check who is signed in, or sign out safely.",
      items: [
        { href: "/admin/account", label: "Tenant account", detail: "Login, password and dispatch details", icon: "account", current: current === "account" },
        { href: storefrontUrl, label: "Open storefront", detail: tenantSlug ? `${tenantSlug}.orduva.com` : "Store address unavailable", icon: "storefront", external: true },
      ],
    },
  ], [current, storefrontUrl, tenantSlug]);

  const currentGroup = navGroups.find((group) => group.items.some((item) => item.current))?.key ?? "run";
  const [activeKey, setActiveKey] = useState<NavKey | null>(null);
  const activeGroup = navGroups.find((group) => group.key === activeKey) ?? null;
  const closeTimerRef = useRef<number | null>(null);
  const openTimerRef = useRef<number | null>(null);

  const clearMenuCloseTimer = () => {
    if (!closeTimerRef.current) return;
    window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = null;
  };

  const clearMenuOpenTimer = () => {
    if (!openTimerRef.current) return;
    window.clearTimeout(openTimerRef.current);
    openTimerRef.current = null;
  };

  const openMenu = (key: NavKey) => {
    clearMenuCloseTimer();
    clearMenuOpenTimer();
    openTimerRef.current = window.setTimeout(() => {
      setActiveKey(key);
      openTimerRef.current = null;
    }, 500);
  };

  const openMenuNow = (key: NavKey) => {
    clearMenuCloseTimer();
    clearMenuOpenTimer();
    setActiveKey(key);
  };

  const closeMenu = () => {
    clearMenuCloseTimer();
    clearMenuOpenTimer();
    setActiveKey(null);
  };

  const scheduleMenuClose = () => {
    clearMenuOpenTimer();
    clearMenuCloseTimer();
    closeTimerRef.current = window.setTimeout(() => {
      setActiveKey(null);
      closeTimerRef.current = null;
    }, 220);
  };

  useEffect(() => {
    return () => {
      clearMenuCloseTimer();
      clearMenuOpenTimer();
    };
  }, []);

  useEffect(() => {
    if (!activeKey) return;

    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
    };
  }, [activeKey]);

  const tenantInitial = tenantName.trim().slice(0, 1).toUpperCase() || "O";
  const identityIconUrl = faviconUrl || null;

  return (
    <main className="orduva-admin-refresh relative min-h-screen overflow-x-clip bg-[#9fbfdf] px-3 py-4 text-[#111827] sm:px-6 sm:py-7">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(135deg,#9fbfdf_0%,#9fbfdf_58%,#FFFFFF_100%)]" />
      <div className="mx-auto max-w-6xl">
        <div className="sticky top-0 z-50 -mx-3 mb-3 border-b border-[#9fbfdf] bg-white text-[#111827] sm:-mx-6 sm:mb-4">
          <div className="relative mx-auto max-w-6xl px-3 py-2 sm:px-6 sm:py-3" onMouseEnter={clearMenuCloseTimer} onMouseLeave={scheduleMenuClose}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[16px] border border-[#CFE1DD] bg-[#EAFBF5] text-base font-black text-[#111827]">
                  {identityIconUrl ? <img src={identityIconUrl} alt={`${tenantName} favicon`} className="h-full w-full object-contain p-1" /> : tenantInitial}
                </div>
                <div className="min-w-0">
                  <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0F766E]">Active store</p>
                    <span className="rounded-full border border-[#CFE1DD] bg-[#EAFBF5] px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#0F766E]">
                      {versionLabel()}
                    </span>
                  </div>
                  <p className="truncate text-lg font-black leading-tight text-[#111827] sm:text-xl">{adminDisplayName(tenantName)}</p>
                  {tenantSlug ? (
                    <a href={storefrontUrl} target="_blank" rel="noreferrer" className="mt-0.5 block truncate text-xs font-semibold text-[#374151] underline-offset-4 transition hover:text-[#0F766E] hover:underline" title="Open storefront">
                      {tenantSlug}.orduva.com
                    </a>
                  ) : (
                    <p className="mt-0.5 truncate text-xs font-semibold text-[#374151]">Store address unavailable</p>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 items-center justify-end gap-2">
                <nav className="hidden items-center gap-2 lg:flex" aria-label="Tenant admin sections">
                  {navGroups.map((group) => {
                    const selected = activeKey === group.key;
                    const containsCurrent = currentGroup === group.key;
                    return (
                      <button
                        key={group.key}
                        type="button"
                        onMouseEnter={() => openMenu(group.key)}
                        onClick={() => {
                          clearMenuCloseTimer();
                          if (activeKey === group.key) {
                            closeMenu();
                          } else {
                            openMenuNow(group.key);
                          }
                        }}
                        className={[
                          "admin-pressable inline-flex min-h-10 items-center gap-2.5 rounded-full border px-3.5 py-1.5 text-[13px] font-black transition hover:-translate-y-[1px]",
                          selected
                            ? "border-[#8CB9AC] bg-[#9fbfdf] text-[#111827] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_10px_22px_rgba(17,24,39,0.08)]"
                            : containsCurrent
                              ? "border-[#0F766E]/35 bg-white text-[#0F766E] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_8px_18px_rgba(17,24,39,0.06)]"
                              : "border-[#9fbfdf] bg-white text-[#374151] hover:border-[#0F766E]/30 hover:bg-[#F8FAF9] hover:text-[#0F766E]",
                        ].join(" ")}
                        aria-expanded={selected}
                        aria-controls="tenant-admin-mega-menu"
                      >
                        <span>{group.label}</span>
                        <span className={[
                          "flex h-7 w-7 items-center justify-center rounded-full transition",
                          selected ? "bg-[#0F766E] text-white" : "bg-[#9fbfdf] text-[#5F6B66]",
                        ].join(" ")}><AdminChevronIcon open={selected} /></span>
                      </button>
                    );
                  })}
                </nav>

                <button
                  type="button"
                  onClick={() => {
                    clearMenuCloseTimer();
                    setActiveKey((value) => (value ? null : currentGroup));
                  }}
                  className="admin-pressable inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full border border-[#0F766E]/25 bg-white px-4 py-2 text-sm font-black text-[#111827] shadow-[0_8px_18px_rgba(17,24,39,0.08)] transition hover:-translate-y-[1px] hover:border-[#0F766E]/35 hover:bg-[#EAFBF5] lg:hidden"
                  aria-expanded={Boolean(activeKey)}
                  aria-controls="tenant-admin-mega-menu"
                >
                  <MobileMenuIcon open={Boolean(activeKey)} />
                  <span>Menu</span>
                </button>
              </div>
            </div>

            <div id="tenant-admin-mega-menu">
              <DesktopMegaDropdown
                group={activeGroup}
                closeMenu={closeMenu}
                keepMenuOpen={clearMenuCloseTimer}
                scheduleMenuClose={scheduleMenuClose}
                tenantName={tenantName}
                tenantSlug={tenantSlug}
                signedInAs={signedInAs}
                trialState={trialState}
              />
              <MobileMegaMenu
                open={Boolean(activeKey)}
                groups={navGroups}
                closeMenu={closeMenu}
                tenantName={tenantName}
                tenantSlug={tenantSlug}
                signedInAs={signedInAs}
                trialState={trialState}
              />
            </div>
          </div>
        </div>

        <header className="overflow-hidden rounded-[26px] border border-[#9fbfdf] bg-white/[0.98] backdrop-blur-xl oa-admin-surface">
          <div className="border-b border-[#DCE5E1] px-4 py-4 sm:px-6 lg:px-7 lg:py-3">
            <div className="flex min-w-0 items-center gap-3 lg:items-start lg:justify-between lg:gap-5">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[16px] bg-[#111827] lg:h-10 lg:w-10 lg:rounded-[14px]">
                  <img src="/orduva-platform-icon-192.png" alt="Orduva Admin" className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-lg font-black tracking-tight text-[#111827] lg:text-base">Orduva Admin</p>
                  <p className="mt-0.5 truncate text-[11px] font-black uppercase tracking-[0.2em] text-[#0F766E] lg:text-[10px]">Store workspace</p>
                </div>
              </div>

              <div className="hidden min-w-0 flex-1 items-start justify-between gap-4 lg:flex">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex rounded-full border border-[#CFE1DD] bg-[#EAFBF5] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#0F766E]">
                      {current} dashboard
                    </span>
                    <h1 className="truncate text-xl font-black leading-tight tracking-tight text-[#111827]">{title}</h1>
                  </div>
                  <p className="mt-1 max-w-4xl truncate text-xs font-semibold leading-5 text-[#5F6B66]">{description}</p>
                </div>

                <div className="shrink-0 rounded-[16px] border border-[#C9DDED] bg-[#9fbfdf] px-3 py-2 oa-admin-soft text-xs leading-5 text-[#374151]">
                  <span className="font-semibold text-[#5F6B66]">Signed in:</span>{" "}
                  <span className="font-black text-[#111827]">{signedInAs}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="px-4 py-5 sm:px-6 lg:hidden">
            <div className="flex flex-col gap-4">
              <div className="min-w-0">
                <p className="inline-flex w-fit rounded-full border border-[#CFE1DD] bg-[#EAFBF5] px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-[#0F766E]">
                  {current} dashboard
                </p>
                <h1 className="mt-3 max-w-4xl text-2xl font-black leading-tight tracking-tight text-[#111827] sm:text-3xl">
                  {title}
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-[#374151]">{description}</p>
              </div>

              <div className="rounded-[20px] border border-[#C9DDED] bg-[#9fbfdf] p-3 oa-admin-soft text-sm leading-6 text-[#374151]">
                <p>
                  Signed in as <span className="font-black text-[#111827]">{signedInAs}</span>
                </p>
              </div>
            </div>
          </div>
        </header>

        <div className="oa-admin-content mt-4 sm:mt-5">{children}</div>
      </div>
    </main>
  );
}
