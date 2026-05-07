import type { ReactNode } from "react";
import LogoutButton from "@/components/admin/LogoutButton";
import AdminLaunchChecklist from "@/components/admin/AdminLaunchChecklist";
import { LIVE_VERSION } from "@/lib/version";
import type { TenantTrialState } from "@/lib/trial";

type NavItem = {
  href: string;
  label: string;
  current?: boolean;
};

function navClassName(current?: boolean) {
  return [
    "admin-pressable inline-flex min-h-10 w-full items-center justify-center rounded-2xl px-3.5 py-2.5 text-sm font-bold transition sm:w-auto",
    current
      ? "border border-[#FF6A3D] bg-[#FF6A3D] text-white shadow-[0_16px_34px_rgba(255,106,61,0.22)]"
      : "border border-[#0E0E10]/10 bg-white text-[#0E0E10] shadow-sm hover:-translate-y-[1px] hover:border-[#FF6A3D]/35 hover:bg-[#FFF7F0]",
  ].join(" ");
}


function formatTrialDate(value?: string | null) {
  if (!value) return "date unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "date unavailable";
  return date.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

function trialBannerClasses(trial?: TenantTrialState | null) {
  if (!trial) return "border-[#0E0E10]/10 bg-white text-[#1F2328]";
  if (trial.isTrialExpired) return "border-red-200 bg-red-50 text-red-900";
  if ((trial.trialDaysRemaining ?? 99) <= 2) return "border-[#FF6A3D]/30 bg-[#FFF7F0] text-[#9A3412]";
  return "border-emerald-200 bg-emerald-50 text-emerald-900";
}

function trialStatusText(trial?: TenantTrialState | null) {
  if (!trial) return "Trial details unavailable";
  if (trial.subscriptionStatus === "active" || trial.trialStatus === "converted") return "Subscription active";
  if (trial.isTrialExpired) return "Trial expired";
  if (trial.trialDaysRemaining === null) return "Trial active";
  if (trial.trialDaysRemaining === 1) return "1 day left in trial";
  return `${trial.trialDaysRemaining} days left in trial`;
}

function AdminTrialBanner({ trial }: { trial?: TenantTrialState | null }) {
  if (!trial) return null;
  const percentRemaining = trial.trialDaysRemaining === null
    ? 100
    : Math.max(0, Math.min(100, Math.round((trial.trialDaysRemaining / Math.max(1, trial.trialDaysTotal)) * 100)));
  return (
    <div className={["mt-4 rounded-[24px] border px-4 py-3 shadow-[0_12px_30px_rgba(14,14,16,0.05)]", trialBannerClasses(trial)].join(" ")}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] opacity-70">Orduva trial</p>
          <p className="mt-1 text-sm font-black sm:text-base">{trialStatusText(trial)}</p>
          <p className="mt-1 text-xs font-semibold opacity-75">Trial ends {formatTrialDate(trial.trialEndsAt)} · Plan {trial.planName || "orduva_trial"}</p>
        </div>
        <div className="min-w-[170px]">
          <div className="h-2.5 overflow-hidden rounded-full bg-black/10">
            <div className="h-full rounded-full bg-[#FF6A3D]" style={{ width: `${percentRemaining}%` }} />
          </div>
          <p className="mt-1 text-right text-[11px] font-black uppercase tracking-[0.14em] opacity-70">No storefront blocking yet</p>
        </div>
      </div>
    </div>
  );
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
}: {
  tenantName: string;
  tenantSlug?: string | null;
  signedInAs: string;
  title: string;
  description: string;
  current: "home" | "orders" | "products" | "categories" | "settings";
  children: ReactNode;
  logoUrl?: string | null;
  faviconUrl?: string | null;
  accentColor?: string | null;
  trialState?: TenantTrialState | null;
}) {
  const nav: NavItem[] = [
    { href: "/admin", label: "Home", current: current === "home" },
    { href: "/admin/orders", label: "Orders", current: current === "orders" },
    { href: "/admin/products", label: "Products", current: current === "products" },
    { href: "/admin/categories", label: "Categories", current: current === "categories" },
    { href: "/admin/settings", label: "Settings", current: current === "settings" },
  ];

  const storefrontUrl = buildStorefrontUrl(tenantSlug);
  const tenantInitial = tenantName.trim().slice(0, 1).toUpperCase() || "O";
  const identityAccent = accentColor || "#FF6A3D";
  const identityIconUrl = faviconUrl || null;
  const adminBackgroundClass = "bg-[#F3F4F6]";
  const adminBackdropClass = "bg-[radial-gradient(circle_at_16%_8%,rgba(148,163,184,0.20),transparent_30%),radial-gradient(circle_at_88%_16%,rgba(15,23,42,0.08),transparent_28%),linear-gradient(135deg,#F3F4F6_0%,#EEF1F4_52%,#FFFFFF_100%)]";

  return (
    <main className={`relative min-h-screen overflow-x-clip ${adminBackgroundClass} px-3 py-4 pb-24 text-[#1F2328] sm:px-6 sm:py-7 sm:pb-7`}>
      <div className={`pointer-events-none absolute inset-0 -z-10 ${adminBackdropClass}`} />
      <div className="mx-auto max-w-6xl">
        <div className="mb-3 rounded-[24px] border border-[#0E0E10]/10 bg-[#0E0E10] p-3 text-white shadow-[0_18px_50px_rgba(14,14,16,0.16)] sm:mb-4 sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[16px] border border-white/15 bg-white/10 text-base font-black shadow-[0_12px_26px_rgba(0,0,0,0.16)]"
                style={{ boxShadow: `0 12px 26px ${identityAccent}24` }}
              >
                {identityIconUrl ? <img src={identityIconUrl} alt={`${tenantName} favicon`} className="h-full w-full object-contain p-1" /> : tenantInitial}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FFB168]">Active store</p>
                <p className="truncate text-lg font-black leading-tight text-white sm:text-xl">{tenantName}</p>
                <p className="mt-0.5 truncate text-xs font-semibold text-white/68">
                  {tenantSlug ? `${tenantSlug}.orduva.com` : "Store address unavailable"}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 sm:justify-end">
              <a
                href={storefrontUrl}
                target="_blank"
                rel="noreferrer"
                className="admin-pressable inline-flex min-h-10 items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-4 py-2 text-xs font-black text-white transition hover:-translate-y-[1px] hover:bg-white/18"
              >
                Open storefront
              </a>
              <span className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-[#FF6A3D]/40 bg-[#FF6A3D] px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-white shadow-[0_14px_28px_rgba(255,106,61,0.18)]">
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

        <AdminTrialBanner trial={trialState} />

        <div className="mt-4 sm:mt-5">
          <AdminLaunchChecklist tenantSlug={tenantSlug || undefined} showSetupTools />
        </div>

        <div className="mt-4 sm:mt-5">{children}</div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <a
            href={storefrontUrl}
            target="_blank"
            rel="noreferrer"
            className="admin-pressable inline-flex min-h-11 items-center justify-center rounded-2xl border border-[#0E0E10]/10 bg-white px-5 py-3 text-sm font-bold text-[#0E0E10] shadow-sm transition hover:-translate-y-[1px] hover:bg-[#F5F2EE]"
          >
            View active storefront
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
