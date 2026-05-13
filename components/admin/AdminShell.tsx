import type { ReactNode } from "react";
import LogoutButton from "@/components/admin/LogoutButton";
import AdminHeaderTools from "@/components/admin/AdminHeaderTools";
import { LIVE_VERSION } from "@/lib/version";
import type { TenantTrialState } from "@/lib/trial";

type NavIcon = "home" | "orders" | "products" | "categories" | "settings" | "analytics" | "referrals";

type NavItem = {
  href: string;
  label: string;
  icon: NavIcon;
  current?: boolean;
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
  }
}

function navClassName(current?: boolean) {
  return [
    "admin-pressable inline-flex min-h-10 w-full items-center justify-center rounded-2xl px-3.5 py-2.5 text-sm font-bold transition sm:w-auto",
    current
      ? "border border-[#FF6A3D] bg-[#FF6A3D] text-white shadow-[0_16px_34px_rgba(255,106,61,0.22)]"
      : "border border-[#0E0E10]/10 bg-white text-[#0E0E10] shadow-sm hover:-translate-y-[1px] hover:border-[#FF6A3D]/35 hover:bg-[#FFF7F0]",
  ].join(" ");
}


function buildStorefrontUrl(tenantSlug?: string | null) {
  const slug = String(tenantSlug || "").trim().toLowerCase();
  if (!slug) return "/";
  return `https://${slug}.orduva.com`;
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
  const nav: NavItem[] = [
    { href: "/admin", label: "Home", icon: "home", current: current === "home" },
    { href: "/admin/orders", label: "Orders", icon: "orders", current: current === "orders" },
    { href: "/admin/products", label: "Products", icon: "products", current: current === "products" },
    { href: "/admin/categories", label: "Categories", icon: "categories", current: current === "categories" },
    { href: "/admin/settings", label: "Settings", icon: "settings", current: current === "settings" },
    { href: "/admin/analytics", label: "Analytics", icon: "analytics", current: current === "analytics" },
    { href: "/admin/referrals", label: "Referrals", icon: "referrals", current: current === "referrals" },
  ];

  const storefrontUrl = buildStorefrontUrl(tenantSlug);
  const tenantInitial = tenantName.trim().slice(0, 1).toUpperCase() || "O";
  const identityAccent = accentColor || "#FF6A3D";
  const identityIconUrl = faviconUrl || null;
  const adminBackgroundClass = pageTone === "white" ? "bg-white" : "bg-[#F3F4F6]";
  const adminBackdropClass = pageTone === "white" ? "bg-white" : "bg-[radial-gradient(circle_at_16%_8%,rgba(148,163,184,0.20),transparent_30%),radial-gradient(circle_at_88%_16%,rgba(15,23,42,0.08),transparent_28%),linear-gradient(135deg,#F3F4F6_0%,#EEF1F4_52%,#FFFFFF_100%)]";

  return (
    <main className={`relative min-h-screen overflow-x-clip ${adminBackgroundClass} px-3 py-4 pb-24 text-[#1F2328] sm:px-6 sm:py-7 sm:pb-7`}>
      <div className={`pointer-events-none absolute inset-0 -z-10 ${adminBackdropClass}`} />
      <div className="mx-auto max-w-6xl">
        <div className="sticky top-0 z-50 -mx-3 mb-3 border-b border-[#0E0E10]/10 bg-white text-[#0E0E10] shadow-[0_10px_24px_rgba(14,14,16,0.08)] sm:-mx-6 sm:mb-4">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-2 sm:gap-3 sm:px-6 sm:py-3">
            <div className="flex min-w-0 items-center gap-3">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[16px] border border-[#0E0E10]/10 bg-[#FFF7F0] text-base font-black text-[#0E0E10] shadow-[0_12px_26px_rgba(14,14,16,0.10)]"
                style={{ boxShadow: `0 12px 26px ${identityAccent}24` }}
              >
                {identityIconUrl ? <img src={identityIconUrl} alt={`${tenantName} favicon`} className="h-full w-full object-contain p-1" /> : tenantInitial}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#C84F2A]">Active store</p>
                <p className="truncate text-lg font-black leading-tight text-[#0E0E10] sm:text-xl">{tenantName}</p>
                {tenantSlug ? (
                  <a
                    href={storefrontUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-0.5 block truncate text-xs font-semibold text-[#5C5F66] underline-offset-4 transition hover:text-[#C84F2A] hover:underline"
                    title="Open storefront"
                  >
                    {tenantSlug}.orduva.com
                  </a>
                ) : (
                  <p className="mt-0.5 truncate text-xs font-semibold text-[#5C5F66]">Store address unavailable</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 sm:justify-end">
              <AdminHeaderTools tenantSlug={tenantSlug} trialState={trialState} />
              <span className="hidden min-h-10 items-center justify-center rounded-2xl border border-[#FF6A3D]/25 bg-[#FFF7F0] px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#C84F2A] shadow-sm sm:inline-flex">
                {LIVE_VERSION.replace("Ver: ", "V ")}
              </span>
            </div>
          </div>
        </div>

        <header className="overflow-hidden rounded-[26px] border border-[#0E0E10]/10 bg-white/[0.90] shadow-[0_22px_60px_rgba(14,14,16,0.09)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 border-b border-[#0E0E10]/10 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-7">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[16px] bg-[#0E0E10] shadow-[0_12px_26px_rgba(14,14,16,0.14)]">
                <img src="/orduva-platform-icon-192.png" alt="Orduva Admin" className="h-full w-full object-cover" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-lg font-black tracking-tight text-[#0E0E10]">Orduva Admin</p>
                <p className="mt-0.5 truncate text-[11px] font-black uppercase tracking-[0.2em] text-[#FF6A3D]">Store workspace</p>
              </div>
            </div>

            <div className="hidden flex-wrap items-center gap-2.5 sm:flex">
              {nav.map((item) => (
                <a key={item.href} href={item.href} aria-current={item.current ? "page" : undefined} className={navClassName(item.current)}>
                  {item.label}
                </a>
              ))}
            </div>
          </div>

          <div className="px-4 py-5 sm:px-6 lg:px-7 lg:py-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0">
                <p className="inline-flex w-fit rounded-full border border-[#FF6A3D]/20 bg-[#FF6A3D]/8 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-[#C84F2A]">
                  {current} dashboard
                </p>
                <h1 className="mt-3 max-w-4xl text-2xl font-black leading-tight tracking-tight text-[#0E0E10] sm:text-3xl lg:text-[2.35rem]">
                  {title}
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-[#5C5F66]">
                  {description}
                </p>
              </div>

              <div className="rounded-[20px] border border-[#0E0E10]/10 bg-[#F8FAFC] px-4 py-3 text-sm leading-6 text-[#5C5F66] shadow-sm lg:min-w-[15rem]">
                Signed in as <span className="font-black text-[#0E0E10]">{signedInAs}</span>
              </div>
            </div>
          </div>
        </header>

        <div className="mt-4 sm:mt-5">{children}</div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <LogoutButton className="admin-pressable inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#0E0E10] px-5 py-3 text-sm font-bold text-white shadow-[0_16px_34px_rgba(14,14,16,0.18)] transition hover:-translate-y-[1px] hover:bg-[#252528] disabled:cursor-not-allowed disabled:opacity-60" />
        </div>
      </div>

      <nav className="admin-bottom-nav fixed inset-x-0 bottom-0 z-40 border-t border-[#0E0E10]/10 bg-white px-2 pb-[calc(env(safe-area-inset-bottom,0px)+0.45rem)] pt-1.5 shadow-[0_-12px_30px_rgba(14,14,16,0.10)] backdrop-blur sm:hidden">
        <div className="mx-auto grid max-w-6xl grid-cols-7 gap-1">
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              aria-current={item.current ? "page" : undefined}
              className={[
                "group inline-flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-2xl px-1 py-1 text-[10px] font-black leading-tight transition duration-200 active:scale-[0.94]",
                item.current
                  ? "text-[#C84F2A]"
                  : "text-[#5C5F66] hover:text-[#C84F2A]",
              ].join(" ")}
            >
              <span
                className={[
                  "flex h-8 w-8 items-center justify-center rounded-[14px] transition duration-200",
                  item.current
                    ? "bg-[#FF6A3D] text-white shadow-[0_10px_24px_rgba(255,106,61,0.24)]"
                    : "bg-[#F5F2EE] text-[#1F2328] group-hover:bg-[#FFF7F0] group-hover:text-[#C84F2A]",
                ].join(" ")}
              >
                <AdminNavIcon icon={item.icon} />
              </span>
              <span className="max-w-full truncate text-center tracking-[-0.01em]">{item.label}</span>
            </a>
          ))}
        </div>
      </nav>
    </main>
  );
}
