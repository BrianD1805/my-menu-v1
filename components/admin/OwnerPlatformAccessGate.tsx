"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { LIVE_VERSION } from "@/lib/version";

type OwnerPlatformAccessContextValue = {
  unlocked: boolean;
  platformKey: string;
  lock: () => void;
};

const OwnerPlatformAccessContext = createContext<OwnerPlatformAccessContextValue>({
  unlocked: false,
  platformKey: "",
  lock: () => undefined,
});

const SESSION_KEY = "orduvaOwnerPlatformAccessKey";

export function useOwnerPlatformAccess() {
  return useContext(OwnerPlatformAccessContext);
}

export default function OwnerPlatformAccessGate({ children }: { children: ReactNode }) {
  const [platformKey, setPlatformKey] = useState("");
  const [unlockedKey, setUnlockedKey] = useState("");
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState("");
  const [booted, setBooted] = useState(false);

  async function verifyKey(keyToCheck: string) {
    const cleanKey = keyToCheck.trim();
    if (!cleanKey) {
      setMessage("Enter the Orduva owner access key.");
      return false;
    }

    setChecking(true);
    setMessage("Checking owner access...");
    try {
      const response = await fetch("/api/platform/access", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-orduva-platform-key": cleanKey,
        },
        body: JSON.stringify({ purpose: "owner-platform-access" }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || "Owner access could not be verified.");
      }
      sessionStorage.setItem(SESSION_KEY, cleanKey);
      setUnlockedKey(cleanKey);
      setPlatformKey("");
      setMessage("");
      return true;
    } catch (error) {
      sessionStorage.removeItem(SESSION_KEY);
      setUnlockedKey("");
      setMessage(
        error instanceof Error
          ? error.message
          : "Owner access could not be verified.",
      );
      return false;
    } finally {
      setChecking(false);
      setBooted(true);
    }
  }

  useEffect(() => {
    const savedKey = sessionStorage.getItem(SESSION_KEY) || "";
    if (savedKey) {
      verifyKey(savedKey);
    } else {
      setBooted(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function lock() {
    sessionStorage.removeItem(SESSION_KEY);
    setUnlockedKey("");
    setPlatformKey("");
    setMessage("Owner platform locked.");
  }

  const contextValue = useMemo(
    () => ({ unlocked: Boolean(unlockedKey), platformKey: unlockedKey, lock }),
    [unlockedKey],
  );

  if (!booted || checking || !unlockedKey) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0E0E10] px-4 py-8 text-white">
        <section className="w-full max-w-xl overflow-hidden rounded-[34px] border border-white/10 bg-white shadow-[0_30px_100px_rgba(0,0,0,0.38)]">
          <div className="bg-[#0E0E10] px-5 py-6 text-white sm:px-7">
            <div className="flex items-center gap-4">
              <img
                src="/orduva-platform-icon-192.png"
                alt="Orduva"
                className="h-14 w-14 rounded-[20px] shadow-[0_16px_36px_rgba(0,0,0,0.35)]"
              />
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-[#FFB168]">
                  Owner only
                </p>
                <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
                  Orduva platform access
                </h1>
              </div>
            </div>
            <p className="mt-5 text-sm leading-6 text-white/72">
              This area is for the Orduva owner only. Enter the platform access
              key before any owner dashboard, store list, email settings or
              onboarding tools are shown.
            </p>
          </div>

          <form
            className="space-y-4 bg-[#FFF7F0] px-5 py-6 text-[#0E0E10] sm:px-7"
            onSubmit={(event) => {
              event.preventDefault();
              verifyKey(platformKey);
            }}
          >
            <label className="block">
              <span className="mb-2 block text-sm font-black text-[#0E0E10]">
                Platform access key
              </span>
              <input
                type="password"
                value={platformKey}
                onChange={(event) => setPlatformKey(event.target.value)}
                autoComplete="current-password"
                autoFocus
                placeholder="Enter owner access key"
                className="min-h-12 w-full rounded-2xl border border-[#0E0E10]/15 bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-[#FF6A3D] focus:ring-2 focus:ring-[#FF6A3D]/20"
              />
            </label>

            {message ? (
              <p className="rounded-2xl border border-[#FF6A3D]/25 bg-white px-4 py-3 text-sm font-bold text-[#C84F2A]">
                {message}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={checking}
              className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-[#FF6A3D] px-5 py-3 text-sm font-black text-white shadow-[0_18px_40px_rgba(255,106,61,0.28)] transition hover:bg-[#e65f36] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {checking ? "Checking..." : "Unlock owner platform"}
            </button>

            <div className="rounded-2xl border border-[#0E0E10]/10 bg-white px-4 py-3 text-xs leading-5 text-[#5C5F66]">
              Public client onboarding stays separate at
              <span className="font-black text-[#0E0E10]"> /start-your-store</span>.
              This owner session unlock is only stored in this browser session.
            </div>

            <p className="text-center text-[11px] font-black uppercase tracking-[0.18em] text-[#5C5F66]">
              {LIVE_VERSION}
            </p>
          </form>
        </section>
      </main>
    );
  }

  return (
    <OwnerPlatformAccessContext.Provider value={contextValue}>
      <div className="border-b border-[#0E0E10]/10 bg-[#0E0E10] px-4 py-2 text-white sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 text-xs sm:flex-row sm:items-center sm:justify-between">
          <span className="font-black uppercase tracking-[0.18em] text-[#FFB168]">
            Owner platform unlocked
          </span>
          <button
            type="button"
            onClick={lock}
            className="inline-flex min-h-9 items-center justify-center rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-black text-white transition hover:bg-white/20"
          >
            Lock owner area
          </button>
        </div>
      </div>
      {children}
    </OwnerPlatformAccessContext.Provider>
  );
}
