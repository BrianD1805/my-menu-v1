import type { ReactNode } from "react";
import LogoutButton from "@/components/admin/LogoutButton";
import { LIVE_VERSION } from "@/lib/version";

type NavItem = {
  href: string;
  label: string;
  current?: boolean;
};

function navClassName(current?: boolean) {
  return [
    "admin-pressable inline-flex min-h-11 w-full items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold transition sm:w-auto",
    current
      ? "border border-[#FF6A3D] bg-[#0E0E10] text-[#FFF7F0] shadow-[0_16px_36px_rgba(14,14,16,0.20)]"
      : "border border-[#E7D8CC] bg-white text-[#1F2328] hover:border-[#FFB168] hover:bg-[#FFF7F0]",
  ].join(" ");
}

export default function AdminShell({
  tenantName,
  signedInAs,
  title,
  description,
  current,
  children,
  logoUrl,
  accentColor,
}: {
  tenantName: string;
  signedInAs: string;
  title: string;
  description: string;
  current: "home" | "orders" | "products" | "categories" | "settings";
  children: ReactNode;
  logoUrl?: string | null;
  accentColor?: string | null;
}) {
  const nav: NavItem[] = [
    { href: "/admin", label: "Home", current: current === "home" },
    { href: "/admin/orders", label: "Orders", current: current === "orders" },
    { href: "/admin/products", label: "Products", current: current === "products" },
    { href: "/admin/categories", label: "Categories", current: current === "categories" },
    { href: "/admin/settings", label: "Settings", current: current === "settings" },
  ];

  return (
    <main className="min-h-screen bg-[#F5F2EE] px-3 py-4 pb-24 text-[#1F2328] sm:px-6 sm:py-7 sm:pb-7">
      <div className="mx-auto max-w-6xl">
        <header
          className="rounded-[28px] border border-[#FFB168]/35 bg-[linear-gradient(135deg,#0E0E10_0%,#1F2328_58%,#FF6A3D_160%)] p-4 text-[#FFF7F0] shadow-[0_26px_80px_rgba(14,14,16,0.22)] sm:rounded-[32px] sm:p-7"
          style={{ borderColor: "rgba(255, 177, 104, 0.35)" }}
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[18px] border border-[#FFB168]/40 bg-[#FFF7F0] shadow-sm">
                  {logoUrl ? <img src={logoUrl} alt={tenantName} className="h-full w-full object-cover" /> : <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#5C5F66]">Brand</span>}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#FFB168] sm:text-xs">Tenant admin</p>
                  <span className="rounded-full border border-[#FFB168]/35 bg-[#FFF7F0]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#FFF7F0] sm:hidden">
                    {current}
                  </span>
                </div>
              </div>

              <h1 className="mt-3 text-2xl font-bold leading-tight text-[#FFF7F0] sm:text-4xl">{title}</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#FFE6D6] sm:text-base">{description}</p>
              <div className="mt-4 rounded-2xl border border-[#FFB168]/25 bg-[#FFF7F0]/10 px-4 py-3 text-sm text-[#FFE6D6] shadow-[0_12px_34px_rgba(14,14,16,0.16)] backdrop-blur">
                <div className="flex flex-wrap items-center gap-2">
                  <span>Signed in as <span className="font-semibold text-[#FFF7F0]">{signedInAs}</span></span>
                  <span className="hidden sm:inline">·</span>
                  <span>Working inside <span className="font-semibold text-[#FFF7F0]">{tenantName}</span></span>
                  <span className="inline-flex rounded-full border border-[#FFB168]/30 bg-[#FFF7F0]/10 px-2.5 py-1 text-[0.66rem] font-semibold uppercase tracking-[0.18em] text-[#FFB168]">Admin {LIVE_VERSION.replace("Ver: ", "")}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 hidden grid-cols-2 gap-3 sm:mt-6 sm:flex sm:flex-wrap">
            {nav.map((item) => (
              <a key={item.href} href={item.href} aria-current={item.current ? "page" : undefined} className={navClassName(item.current)}>
                {item.label}
              </a>
            ))}
          </div>
        </header>

        <div className="mt-5 sm:mt-6">{children}</div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <a
            href="/"
            className="admin-pressable inline-flex min-h-11 items-center justify-center rounded-2xl border border-[#E7D8CC] bg-white px-4 py-3 text-sm font-semibold text-[#1F2328] transition hover:border-[#FFB168] hover:bg-[#FFF7F0]"
          >
            View storefront
          </a>
          <LogoutButton className="admin-pressable inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#0E0E10] px-5 py-3 text-sm font-semibold text-[#FFF7F0] transition hover:bg-[#1F2328] disabled:cursor-not-allowed disabled:opacity-60" />
        </div>
      </div>

      <nav className="admin-bottom-nav fixed inset-x-0 bottom-0 z-40 border-t border-[#E7D8CC] bg-[#FFF7F0]/95 px-2 pb-[calc(env(safe-area-inset-bottom,0px)+0.5rem)] pt-2 shadow-[0_-12px_30px_rgba(15,23,42,0.08)] backdrop-blur sm:hidden">
        <div className="mx-auto grid max-w-6xl grid-cols-5 gap-1.5">
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              aria-current={item.current ? "page" : undefined}
              className={[
                "admin-pressable inline-flex min-h-[52px] flex-col items-center justify-center rounded-2xl px-2 py-2 text-[11px] font-semibold transition",
                item.current
                  ? "border border-[#FF6A3D] bg-[#0E0E10] text-[#FFF7F0] shadow-[0_14px_34px_rgba(14,14,16,0.22)]"
                  : "border border-[#E7D8CC] bg-white text-[#1F2328]",
              ].join(" ")}
            >
              <span>{item.label}</span>
            </a>
          ))}
        </div>
      </nav>
    </main>
  );
}
