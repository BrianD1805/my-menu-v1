"use client";

import Link from "next/link";
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

export function useOwnerPlatformAccess() {
  return useContext(OwnerPlatformAccessContext);
}

export default function OwnerPlatformAccessGate({ children }: { children: ReactNode }) {
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
      <main className="flex min-h-screen items-center justify-center bg-[#FFF7F0] px-4 py-8 text-[#0E0E10]">
        <section className="w-full max-w-md rounded-[30px] border border-[#0E0E10]/10 bg-white p-6 text-center shadow-[0_24px_70px_rgba(14,14,16,0.14)]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0E0E10] shadow-[0_16px_34px_rgba(14,14,16,0.22)]">
            <img src="/orduva-platform-icon-192.png" alt="Orduva" className="h-10 w-10 rounded-xl" />
          </div>
          <p className="mt-5 text-xs font-black uppercase tracking-[0.22em] text-[#FF6A3D]">Owner platform</p>
          <h1 className="mt-2 text-xl font-black tracking-tight">Checking secure access…</h1>
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
              <img src="/orduva-platform-icon-192.png" alt="Orduva" className="h-14 w-14 rounded-[20px] shadow-[0_16px_36px_rgba(0,0,0,0.35)]" />
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-[#FFB168]">Owner only</p>
                <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">Orduva platform access</h1>
              </div>
            </div>
            <p className="mt-5 text-sm leading-6 text-white/72">
              This area is for the Orduva owner only. Enter the platform access key and, when enabled, your 6-digit authenticator code.
            </p>
          </div>

          {!needsTwoFactor ? (
            <form className="space-y-4 bg-[#FFF7F0] px-5 py-6 text-[#0E0E10] sm:px-7" onSubmit={(event) => { event.preventDefault(); verifyKey(platformKey); }}>
              <label className="block">
                <span className="mb-2 block text-sm font-black text-[#0E0E10]">Platform access key</span>
                <input type="password" value={platformKey} onChange={(event) => setPlatformKey(event.target.value)} autoComplete="current-password" autoFocus placeholder="Enter owner access key" className="min-h-12 w-full rounded-2xl border border-[#0E0E10]/15 bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-[#FF6A3D] focus:ring-2 focus:ring-[#FF6A3D]/20" />
              </label>
              {message ? <p className="rounded-2xl border border-[#FF6A3D]/25 bg-white px-4 py-3 text-sm font-bold text-[#C84F2A]">{message}</p> : null}
              <button type="submit" disabled={checking} className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-[#FF6A3D] px-5 py-3 text-sm font-black text-white shadow-[0_18px_40px_rgba(255,106,61,0.28)] transition hover:bg-[#e65f36] disabled:cursor-not-allowed disabled:opacity-60">
                {checking ? "Checking..." : "Unlock owner platform"}
              </button>
              <div className="rounded-2xl border border-[#0E0E10]/10 bg-white px-4 py-3 text-xs leading-5 text-[#5C5F66]">
                Once authenticator security is enabled, the platform key alone will no longer open owner pages.
              </div>
              <p className="text-center text-[11px] font-black uppercase tracking-[0.18em] text-[#5C5F66]">{LIVE_VERSION}</p>
            </form>
          ) : (
            <form className="space-y-4 bg-[#FFF7F0] px-5 py-6 text-[#0E0E10] sm:px-7" onSubmit={(event) => { event.preventDefault(); verifyTwoFactorCode(); }}>
              <label className="block">
                <span className="mb-2 block text-sm font-black text-[#0E0E10]">Authenticator code</span>
                <input inputMode="numeric" value={authCode} onChange={(event) => setAuthCode(event.target.value.replace(/\D/g, "").slice(0, 6))} autoComplete="one-time-code" autoFocus placeholder="6-digit code" className="min-h-12 w-full rounded-2xl border border-[#0E0E10]/15 bg-white px-4 py-3 text-center text-2xl font-black tracking-[0.35em] outline-none transition focus:border-[#FF6A3D] focus:ring-2 focus:ring-[#FF6A3D]/20" />
              </label>
              {message ? <p className="rounded-2xl border border-[#FF6A3D]/25 bg-white px-4 py-3 text-sm font-bold text-[#C84F2A]">{message}</p> : null}
              <button type="submit" disabled={checking} className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-[#FF6A3D] px-5 py-3 text-sm font-black text-white shadow-[0_18px_40px_rgba(255,106,61,0.28)] transition hover:bg-[#e65f36] disabled:cursor-not-allowed disabled:opacity-60">
                {checking ? "Checking..." : "Verify authenticator code"}
              </button>
              <button type="button" onClick={() => { setNeedsTwoFactor(false); setPendingKey(""); setAuthCode(""); setMessage("Enter the platform key again."); }} className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-[#0E0E10]/10 bg-white px-5 py-3 text-sm font-black text-[#0E0E10] transition hover:bg-[#F5F2EE]">
                Back to platform key
              </button>
              <p className="text-center text-[11px] font-black uppercase tracking-[0.18em] text-[#5C5F66]">{LIVE_VERSION}</p>
            </form>
          )}
        </section>
      </main>
    );
  }

  return (
    <OwnerPlatformAccessContext.Provider value={contextValue}>
      <div className="border-b border-[#0E0E10]/10 bg-[#0E0E10] px-4 py-2 text-white sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 text-xs md:flex-row md:items-center md:justify-between">
          <span className="font-black uppercase tracking-[0.18em] text-[#FFB168]">Owner platform unlocked</span>
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/platform" className="inline-flex min-h-9 items-center justify-center rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-black text-white transition hover:bg-white/20">Dashboard</Link>
            <Link href="/platform/onboarding" className="inline-flex min-h-9 items-center justify-center rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-black text-white transition hover:bg-white/20">Onboarding</Link>
            <Link href="/platform/referrals" className="inline-flex min-h-9 items-center justify-center rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-black text-white transition hover:bg-white/20">Referrals</Link>
            <Link href="/platform/billing" className="inline-flex min-h-9 items-center justify-center rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-black text-white transition hover:bg-white/20">Billing</Link>
            <Link href="/platform/security" className="inline-flex min-h-9 items-center justify-center rounded-xl border border-[#FFB168]/35 bg-[#FFB168]/15 px-3 py-2 text-xs font-black text-white transition hover:bg-[#FFB168]/25">Security</Link>
            <button type="button" onClick={lock} className="inline-flex min-h-9 items-center justify-center rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-black text-white transition hover:bg-white/20">Lock owner area</button>
          </div>
        </div>
      </div>
      {children}
    </OwnerPlatformAccessContext.Provider>
  );
}
