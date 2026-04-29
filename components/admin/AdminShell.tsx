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
    "admin-pressable inline-flex min-h-11 w-full items-center justify-center rounded-2xl px-4 py-3 text-sm font-bold transition sm:w-auto",
    current
      ? "border border-[#FF6A3D] bg-[#FF6A3D] text-white shadow-[0_16px_34px_rgba(255,106,61,0.22)]"
      : "border border-[#0E0E10]/10 bg-white text-[#0E0E10] shadow-sm hover:-translate-y-[1px] hover:border-[#FF6A3D]/35 hover:bg-[#FFF7F0]",
  ].join(" ");
}

export default function AdminShell({
  tenantName,
  signedInAs,
  title,
  description,
  current,
  children,
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
    <main className="relative min-h-screen overflow-x-clip bg-[#FFF7F0] px-3 py-4 pb-24 text-[#1F2328] sm:px-6 sm:py-7 sm:pb-7">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_16%_8%,rgba(255,106,61,0.18),transparent_30%),radial-gradient(circle_at_88%_16%,rgba(14,14,16,0.08),transparent_28%),linear-gradient(135deg,#FFF7F0_0%,#F5F2EE_52%,#FFFFFF_100%)]" />
      <div className="mx-auto max-w-6xl">
        <header className="overflow-hidden rounded-[34px] border border-[#0E0E10]/10 bg-white/[0.84] shadow-[0_34px_100px_rgba(14,14,16,0.12)] backdrop-blur-xl">
          <div className="flex flex-col gap-5 border-b border-[#0E0E10]/10 px-5 py-5 sm:px-7 sm:py-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
            <div className="flex min-w-0 items-center gap-3.5">
              <div className="flex h-[3.25rem] w-[3.25rem] shrink-0 items-center justify-center overflow-hidden rounded-[18px] bg-[#0E0E10] shadow-[0_16px_36px_rgba(14,14,16,0.18)]">
                <img src="/orduva-platform-icon-192.png" alt="Orduva Admin" className="h-full w-full object-cover" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xl font-black tracking-tight text-[#0E0E10]">Orduva Admin</p>
                <p className="mt-0.5 truncate text-xs font-black uppercase tracking-[0.24em] text-[#FF6A3D]">Tenant workspace</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex min-h-10 items-center rounded-2xl border border-[#0E0E10]/10 bg-[#F5F2EE] px-4 py-2 text-xs font-bold text-[#0E0E10] shadow-sm">
                {tenantName}
              </span>
              <span className="inline-flex min-h-10 items-center rounded-2xl bg-[#0E0E10] px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-white shadow-[0_16px_34px_rgba(14,14,16,0.20)]">
                {LIVE_VERSION.replace("Ver: ", "V ")}
              </span>
            </div>
          </div>

          <div className="px-5 py-6 sm:px-7 lg:px-8 lg:py-7">
            <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <p className="inline-flex w-fit rounded-full border border-[#FF6A3D]/25 bg-[#FF6A3D]/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-[#C84F2A]">
                  {current} dashboard
                </p>
                <h1 className="mt-4 max-w-4xl text-[2rem] font-black leading-[1.02] tracking-tight text-[#0E0E10] sm:text-[3rem] lg:text-[3.5rem]">
                  {title}
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-[#5C5F66] sm:text-base">
                  {description}
                </p>
              </div>

              <div className="rounded-[26px] border border-[#0E0E10]/10 bg-[#FFF7F0] p-4 shadow-[0_18px_48px_rgba(14,14,16,0.06)] lg:min-w-[18rem]">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#C84F2A]">Session</p>
                <p className="mt-2 text-sm leading-6 text-[#5C5F66]">
                  Signed in as <span className="font-black text-[#0E0E10]">{signedInAs}</span>
                </p>
                <p className="mt-1 text-sm leading-6 text-[#5C5F66]">
                  Working inside <span className="font-black text-[#0E0E10]">{tenantName}</span>
                </p>
              </div>
            </div>

            <div className="mt-6 hidden grid-cols-2 gap-3 sm:flex sm:flex-wrap">
              {nav.map((item) => (
                <a key={item.href} href={item.href} aria-current={item.current ? "page" : undefined} className={navClassName(item.current)}>
                  {item.label}
                </a>
              ))}
            </div>
          </div>
        </header>

        <div className="mt-5 sm:mt-6">{children}</div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <a
            href="/"
            className="admin-pressable inline-flex min-h-11 items-center justify-center rounded-2xl border border-[#0E0E10]/10 bg-white px-5 py-3 text-sm font-bold text-[#0E0E10] shadow-sm transition hover:-translate-y-[1px] hover:bg-[#F5F2EE]"
          >
            View storefront
          </a>
          <LogoutButton className="admin-pressable inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#0E0E10] px-5 py-3 text-sm font-bold text-white shadow-[0_16px_34px_rgba(14,14,16,0.18)] transition hover:-translate-y-[1px] hover:bg-[#252528] disabled:cursor-not-allowed disabled:opacity-60" />
        </div>
      </div>

      <nav className="admin-bottom-nav fixed inset-x-0 bottom-0 z-40 border-t border-[#0E0E10]/10 bg-white/95 px-2 pb-[calc(env(safe-area-inset-bottom,0px)+0.5rem)] pt-2 shadow-[0_-12px_30px_rgba(14,14,16,0.10)] backdrop-blur sm:hidden">
        <div className="mx-auto grid max-w-6xl grid-cols-5 gap-1.5">
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              aria-current={item.current ? "page" : undefined}
              className={[
                "admin-pressable inline-flex min-h-[52px] flex-col items-center justify-center rounded-2xl px-2 py-2 text-[11px] font-bold transition",
                item.current
                  ? "border border-[#FF6A3D] bg-[#FF6A3D] text-white shadow-[0_14px_34px_rgba(255,106,61,0.22)]"
                  : "border border-[#0E0E10]/10 bg-[#FFF7F0] text-[#0E0E10]",
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
