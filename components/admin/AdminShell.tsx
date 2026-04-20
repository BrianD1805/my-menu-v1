import type { ReactNode } from "react";
import LogoutButton from "@/components/admin/LogoutButton";

type NavItem = {
  href: string;
  label: string;
  current?: boolean;
};

function navClassName(current?: boolean) {
  return [
    "admin-pressable inline-flex min-h-11 w-full items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold transition sm:w-auto",
    current
      ? "bg-slate-900 text-white shadow-[0_14px_34px_rgba(15,23,42,0.16)]"
      : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
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
    <main className="min-h-screen bg-slate-100 px-3 py-4 pb-24 sm:px-6 sm:py-7 sm:pb-7">
      <div className="mx-auto max-w-6xl">
        <header
          className="rounded-[28px] border border-black/5 bg-[linear-gradient(135deg,#ffffff_0%,#f7faf8_52%,#edf7f1_100%)] p-4 shadow-[0_24px_70px_rgba(15,23,42,0.10)] sm:rounded-[32px] sm:p-7"
          style={accentColor ? { borderColor: `${accentColor}22` } : undefined}
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-sm">
                  {logoUrl ? <img src={logoUrl} alt={tenantName} className="h-full w-full object-cover" /> : <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Brand</span>}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 sm:text-xs">Tenant admin</p>
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600 sm:hidden">
                    {current}
                  </span>
                </div>
              </div>

              <h1 className="mt-3 text-2xl font-bold leading-tight text-slate-900 sm:text-4xl">{title}</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">{description}</p>
              <div className="mt-4 rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 text-sm text-slate-600 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
                Signed in as <span className="font-semibold text-slate-900">{signedInAs}</span>
                <span className="hidden sm:inline">. Working inside </span>
                <span className="block font-semibold text-slate-900 sm:inline">{tenantName}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 lg:flex lg:flex-wrap lg:justify-end">
              <a
                href="/"
                className="admin-pressable inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                View storefront
              </a>
              <LogoutButton className="admin-pressable inline-flex min-h-11 items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60" />
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
      </div>

      <nav className="admin-bottom-nav fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/95 px-2 pb-[calc(env(safe-area-inset-bottom,0px)+0.5rem)] pt-2 shadow-[0_-12px_30px_rgba(15,23,42,0.08)] backdrop-blur sm:hidden">
        <div className="mx-auto grid max-w-6xl grid-cols-5 gap-2">
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              aria-current={item.current ? "page" : undefined}
              className={[
                "admin-pressable inline-flex min-h-[52px] flex-col items-center justify-center rounded-2xl px-2 py-2 text-[11px] font-semibold transition",
                item.current
                  ? "bg-slate-900 text-white shadow-[0_14px_34px_rgba(15,23,42,0.18)]"
                  : "border border-slate-200 bg-white text-slate-700",
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
