"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { LIVE_VERSION } from "@/lib/version";

type OwnerPlatformAccessContextValue = {
  unlocked: boolean;
  platformKey: string;
  platformSessionToken: string;
  platformHeaders: Record<string, string>;
  lock: () => void;
};

const OwnerPlatformAccessContext = createContext<OwnerPlatformAccessContextValue>({
  unlocked: false,
  platformKey: "",
  platformSessionToken: "",
  platformHeaders: {},
  lock: () => undefined,
});

const SESSION_KEY = "orduvaOwnerPlatformAccessKey";
const SESSION_2FA_KEY = "orduvaOwnerPlatform2faSession";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

type OwnerMenuLink = {
  href: string;
  label: string;
  detail: string;
  external?: boolean;
};

const OWNER_MENU_SECTIONS: Array<{ title: string; description: string; links: OwnerMenuLink[] }> = [
  {
    title: "Core platform",
    description: "The main owner views you use most often.",
    links: [
      { href: "/platform", label: "Dashboard", detail: "Client status overview" },
      { href: "/platform/onboarding", label: "Onboarding", detail: "Store setup and trials" },
      { href: "/platform/analytics", label: "Analytics", detail: "Platform activity" },
    ],
  },
  {
    title: "Money and growth",
    description: "Billing, referrals and affiliate work.",
    links: [
      { href: "/platform/billing", label: "Billing", detail: "Plans and payments" },
      { href: "/platform/custom-domains", label: "Custom domains", detail: "Paid domain add-ons" },
      { href: "/platform/referrals", label: "Referrals", detail: "Tenant referrals" },
      { href: "/platform/affiliates", label: "Affiliates", detail: "Affiliate applications" },
    ],
  },
  {
    title: "Owner controls",
    description: "Security and support access.",
    links: [
      { href: "/platform/security", label: "Security", detail: "Owner 2FA and protection" },
    ],
  },
];


function OwnerPlatformInstallButton() {
  // Temporarily disabled while the Owner Platform browser cache/PWA identity is stabilised.
  // We will reintroduce install support after the platform pages are loading cleanly again.
  return null;
}

export function useOwnerPlatformAccess() {
  return useContext(OwnerPlatformAccessContext);
}

export default function OwnerPlatformAccessGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [platformKey, setPlatformKey] = useState("");
  const [authCode, setAuthCode] = useState("");
  const [pendingKey, setPendingKey] = useState("");
  const [unlockedKey, setUnlockedKey] = useState("");
  const [sessionToken, setSessionToken] = useState("");
  const [checking, setChecking] = useState(false);
  const [restoringSession, setRestoringSession] = useState(true);
  const [message, setMessage] = useState("");
  const [booted, setBooted] = useState(false);
  const [needsTwoFactor, setNeedsTwoFactor] = useState(false);

  async function verifyKey(keyToCheck: string, savedTwoFactorToken = "", silentRestore = false) {
    const cleanKey = keyToCheck.trim();
    if (!cleanKey) {
      setMessage("Enter the Orduva owner access key.");
      return false;
    }

    setChecking(true);
    if (!silentRestore) setMessage("Checking owner access...");
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "x-orduva-platform-key": cleanKey,
      };
      if (savedTwoFactorToken) headers["x-orduva-platform-2fa-session"] = savedTwoFactorToken;

      const response = await fetch("/api/platform/access", {
        method: "POST",
        headers,
        body: JSON.stringify({ purpose: "owner-platform-access" }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || "Owner access could not be verified.");
      }

      if (data?.requiresTwoFactor) {
        setPendingKey(cleanKey);
        setNeedsTwoFactor(true);
        setUnlockedKey("");
        setSessionToken("");
        setMessage("Enter the 6-digit code from your authenticator app.");
        return false;
      }

      sessionStorage.setItem(SESSION_KEY, cleanKey);
      if (savedTwoFactorToken) sessionStorage.setItem(SESSION_2FA_KEY, savedTwoFactorToken);
      setUnlockedKey(cleanKey);
      setSessionToken(savedTwoFactorToken);
      setPendingKey("");
      setPlatformKey("");
      setAuthCode("");
      setNeedsTwoFactor(false);
      setMessage("");
      return true;
    } catch (error) {
      sessionStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(SESSION_2FA_KEY);
      setUnlockedKey("");
      setSessionToken("");
      setPendingKey("");
      setNeedsTwoFactor(false);
      setMessage(error instanceof Error ? error.message : "Owner access could not be verified.");
      return false;
    } finally {
      setChecking(false);
      setRestoringSession(false);
      setBooted(true);
    }
  }

  async function verifyTwoFactorCode() {
    const cleanCode = authCode.replace(/\D/g, "").slice(0, 6);
    const cleanKey = pendingKey.trim();
    if (!cleanKey) {
      setNeedsTwoFactor(false);
      setMessage("Enter the Orduva owner access key again.");
      return;
    }
    if (cleanCode.length !== 6) {
      setMessage("Enter the 6-digit authenticator code.");
      return;
    }

    setChecking(true);
    setMessage("Checking authenticator code...");
    try {
      const response = await fetch("/api/platform/security/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-orduva-platform-key": cleanKey },
        body: JSON.stringify({ code: cleanCode }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || "Authenticator code could not be verified.");
      const token = String(data?.sessionToken || "");
      sessionStorage.setItem(SESSION_KEY, cleanKey);
      if (token) sessionStorage.setItem(SESSION_2FA_KEY, token);
      setUnlockedKey(cleanKey);
      setSessionToken(token);
      setPendingKey("");
      setPlatformKey("");
      setAuthCode("");
      setNeedsTwoFactor(false);
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Authenticator code could not be verified.");
    } finally {
      setChecking(false);
    }
  }

  useEffect(() => {
    const savedKey = sessionStorage.getItem(SESSION_KEY) || "";
    const savedTwoFactorToken = sessionStorage.getItem(SESSION_2FA_KEY) || "";
    if (savedKey) verifyKey(savedKey, savedTwoFactorToken, true);
    else {
      setRestoringSession(false);
      setBooted(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setActiveMenu(null);
  }, [pathname]);

  useEffect(() => {
    if (!activeMenu) return;

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      if (!target?.closest("[data-owner-platform-menu]")) {
        setActiveMenu(null);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setActiveMenu(null);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeMenu]);

  function closeOwnerMenu() {
    setActiveMenu(null);
  }

  function lock() {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_2FA_KEY);
    setUnlockedKey("");
    setSessionToken("");
    setPendingKey("");
    setPlatformKey("");
    setAuthCode("");
    setNeedsTwoFactor(false);
    setMessage("Owner platform locked.");
  }

  const platformHeaders = useMemo(() => {
    const headers: Record<string, string> = {};
    if (unlockedKey) headers["x-orduva-platform-key"] = unlockedKey;
    if (sessionToken) headers["x-orduva-platform-2fa-session"] = sessionToken;
    return headers;
  }, [unlockedKey, sessionToken]);

  const contextValue = useMemo(
    () => ({ unlocked: Boolean(unlockedKey), platformKey: unlockedKey, platformSessionToken: sessionToken, platformHeaders, lock }),
    [unlockedKey, sessionToken, platformHeaders],
  );

  if ((!booted || checking || restoringSession) && !needsTwoFactor && !unlockedKey) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F3F7FA] px-4 py-8 text-[#0E0E10]">
        <section className="w-full max-w-md rounded-[30px] border border-[#0E0E10]/10 bg-white p-6 text-center shadow-[0_24px_70px_rgba(14,14,16,0.14)]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0E0E10] shadow-[0_16px_34px_rgba(14,14,16,0.22)]">
            <img src="/orduva-owner-platform-icon-192.png" alt="Orduva" className="h-10 w-10 rounded-full object-cover" />
          </div>
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.22em] text-[#336699]">Owner platform</p>
          <h1 className="mt-2 text-xl font-semibold tracking-tight">Checking secure access…</h1>
          <p className="mt-2 text-sm leading-6 text-[#5C5F66]">One moment while Orduva confirms your saved owner session.</p>
        </section>
      </main>
    );
  }

  if (!unlockedKey) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0E0E10] px-4 py-8 text-white">
        <section className="w-full max-w-xl overflow-hidden rounded-[34px] border border-white/10 bg-white shadow-[0_30px_100px_rgba(0,0,0,0.38)]">
          <div className="bg-[#0E0E10] px-5 py-6 text-white sm:px-7">
            <div className="flex items-center gap-4">
              <img src="/orduva-owner-platform-icon-192.png" alt="Orduva" className="h-14 w-14 rounded-full object-cover shadow-[0_16px_36px_rgba(0,0,0,0.35)]" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8FB6D9]">Owner only</p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Orduva platform access</h1>
              </div>
            </div>
            <p className="mt-5 text-sm leading-6 text-white/72">
              This area is for the Orduva owner only. Enter the platform access key and, when enabled, your 6-digit authenticator code.
            </p>
          </div>

          {!needsTwoFactor ? (
            <form className="space-y-4 bg-[#F3F7FA] px-5 py-6 text-[#0E0E10] sm:px-7" onSubmit={(event) => { event.preventDefault(); verifyKey(platformKey); }}>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-[#0E0E10]">Platform access key</span>
                <input type="password" value={platformKey} onChange={(event) => setPlatformKey(event.target.value)} autoComplete="current-password" autoFocus placeholder="Enter owner access key" className="min-h-12 w-full rounded-2xl border border-[#0E0E10]/15 bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-[#336699] focus:ring-2 focus:ring-[#336699]/20" />
              </label>
              {message ? <p className="rounded-2xl border border-[#336699]/25 bg-white px-4 py-3 text-sm font-bold text-[#336699]">{message}</p> : null}
              <button type="submit" disabled={checking} className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-[#336699] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(51,102,153,0.28)] transition hover:bg-[#28547D] disabled:cursor-not-allowed disabled:opacity-60">
                {checking ? "Checking..." : "Unlock owner platform"}
              </button>
              <div className="rounded-2xl border border-[#0E0E10]/10 bg-white px-4 py-3 text-xs leading-5 text-[#5C5F66]">
                Once authenticator security is enabled, the platform key alone will no longer open owner pages.
              </div>
              <p className="text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-[#5C5F66]">{LIVE_VERSION}</p>
            </form>
          ) : (
            <form className="space-y-4 bg-[#F3F7FA] px-5 py-6 text-[#0E0E10] sm:px-7" onSubmit={(event) => { event.preventDefault(); verifyTwoFactorCode(); }}>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-[#0E0E10]">Authenticator code</span>
                <input inputMode="numeric" value={authCode} onChange={(event) => setAuthCode(event.target.value.replace(/\D/g, "").slice(0, 6))} autoComplete="one-time-code" autoFocus placeholder="6-digit code" className="min-h-12 w-full rounded-2xl border border-[#0E0E10]/15 bg-white px-4 py-3 text-center text-2xl font-semibold tracking-[0.35em] outline-none transition focus:border-[#336699] focus:ring-2 focus:ring-[#336699]/20" />
              </label>
              {message ? <p className="rounded-2xl border border-[#336699]/25 bg-white px-4 py-3 text-sm font-bold text-[#336699]">{message}</p> : null}
              <button type="submit" disabled={checking} className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-[#336699] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(51,102,153,0.28)] transition hover:bg-[#28547D] disabled:cursor-not-allowed disabled:opacity-60">
                {checking ? "Checking..." : "Verify authenticator code"}
              </button>
              <button type="button" onClick={() => { setNeedsTwoFactor(false); setPendingKey(""); setAuthCode(""); setMessage("Enter the platform key again."); }} className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-[#0E0E10]/10 bg-white px-5 py-3 text-sm font-semibold text-[#0E0E10] transition hover:bg-[#EAF3FB]">
                Back to platform key
              </button>
              <p className="text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-[#5C5F66]">{LIVE_VERSION}</p>
            </form>
          )}
        </section>
      </main>
    );
  }

  return (
    <OwnerPlatformAccessContext.Provider value={contextValue}>
      <div className="sticky top-0 z-[120] border-b border-[#0E0E10]/10 bg-[#0E0E10] px-4 py-2 text-white shadow-[0_12px_30px_rgba(14,14,16,0.18)] sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 text-xs">
          <Link href="/platform" className="inline-flex items-center gap-3 rounded-2xl px-1 py-1 transition hover:bg-white/5" aria-label="Owner dashboard">
            <img src="/orduva-owner-platform-icon-192.png" alt="Orduva" className="h-9 w-9 rounded-full object-cover shadow-[0_10px_22px_rgba(0,0,0,0.28)]" />
            <span className="hidden font-semibold uppercase tracking-[0.18em] text-[#8FB6D9] sm:inline">Owner platform</span>
          </Link>

          <div className="relative flex items-center gap-2" data-owner-platform-menu>
            <nav className="hidden items-center gap-2 lg:flex" aria-label="Owner platform sections">
              {OWNER_MENU_SECTIONS.map((section, index) => {
                const isOpen = activeMenu === section.title;
                return (
                  <div
                    key={section.title}
                    className="relative pb-3"
                  >
                    <button
                      type="button"
                      onClick={() => setActiveMenu(isOpen ? null : section.title)}
                      className={`inline-flex min-h-10 items-center justify-center rounded-2xl border px-4 py-2 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-[#336699]/45 ${isOpen ? "border-[#336699]/70 bg-[#336699]/28 text-white" : "border-white/12 bg-white/[0.06] text-white hover:border-[#336699]/70 hover:bg-[#336699]/22"}`}
                      aria-haspopup="true"
                      aria-expanded={isOpen}
                    >
                      {section.title}
                    </button>

                    {isOpen ? (
                      <div className={`absolute top-full z-[160] w-[min(88vw,360px)] rounded-[24px] border border-[#336699]/35 bg-[#101317] p-3 text-white shadow-[0_24px_80px_rgba(0,0,0,0.42)] ${index === OWNER_MENU_SECTIONS.length - 1 ? "right-0" : "left-0"}`}>
                        <div className="rounded-[20px] border border-white/10 bg-white/[0.04] p-3">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8FB6D9]">{section.title}</p>
                          <p className="mt-1 text-xs leading-5 text-white/58">{section.description}</p>
                          <div className="mt-3 space-y-2">
                            {section.links.map((link) => {
                              const className = "block rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-2.5 transition hover:border-[#336699]/70 hover:bg-[#336699]/20";
                              const content = (
                                <>
                                  <span className="block text-sm font-semibold text-white">{link.label}{link.external ? " ↗" : ""}</span>
                                  <span className="mt-0.5 block text-xs font-medium text-white/55">{link.detail}</span>
                                </>
                              );
                              return link.external ? (
                                <a key={link.href} href={link.href} target="_blank" rel="noreferrer" className={className} onClick={closeOwnerMenu}>{content}</a>
                              ) : (
                                <Link key={link.href} href={link.href} className={className} onClick={closeOwnerMenu}>{content}</Link>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </nav>

            <div className="relative pb-3 lg:hidden">
              <button
                type="button"
                onClick={() => setActiveMenu(activeMenu === "mobile" ? null : "mobile")}
                className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-white/12 bg-white/[0.06] px-4 py-2 text-xs font-semibold text-white transition hover:border-[#336699]/70 hover:bg-[#336699]/22 focus:outline-none focus:ring-2 focus:ring-[#336699]/45"
                aria-haspopup="true"
                aria-expanded={activeMenu === "mobile"}
              >
                Menu
              </button>
              {activeMenu === "mobile" ? (
                <div className="fixed left-1/2 top-[64px] z-[160] w-[calc(100vw-32px)] max-w-[360px] -translate-x-1/2 rounded-[24px] border border-[#336699]/35 bg-[#101317] p-3 text-white shadow-[0_24px_80px_rgba(0,0,0,0.42)]">
                  <div className="space-y-3">
                    {OWNER_MENU_SECTIONS.map((section) => (
                      <div key={section.title} className="rounded-[20px] border border-white/10 bg-white/[0.04] p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8FB6D9]">{section.title}</p>
                        <div className="mt-2 space-y-2">
                          {section.links.map((link) => {
                            const className = "block rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-2 transition hover:border-[#336699]/70 hover:bg-[#336699]/20";
                            const content = <span className="block text-sm font-semibold text-white">{link.label}{link.external ? " ↗" : ""}</span>;
                            return link.external ? (
                              <a key={link.href} href={link.href} target="_blank" rel="noreferrer" className={className} onClick={closeOwnerMenu}>{content}</a>
                            ) : (
                              <Link key={link.href} href={link.href} className={className} onClick={closeOwnerMenu}>{content}</Link>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <OwnerPlatformInstallButton />
            <button type="button" onClick={() => { closeOwnerMenu(); lock(); }} className="mb-3 inline-flex min-h-10 items-center justify-center rounded-2xl border border-[#339933]/35 bg-[#339933]/14 px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#339933]/24">Lock</button>
          </div>
        </div>
      </div>
      {children}
    </OwnerPlatformAccessContext.Provider>
  );
}
