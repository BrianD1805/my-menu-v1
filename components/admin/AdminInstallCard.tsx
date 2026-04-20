"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export default function AdminInstallCard() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [message, setMessage] = useState("Install Orduva Admin on your phone for faster access to new orders and day-to-day management.");

  useEffect(() => {
    const ua = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(ua);
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

    setIsIos(iosDevice);
    setIsInstalled(Boolean(standalone));

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setMessage("Orduva Admin is installed. Open it from your home screen for a cleaner phone-first workflow.");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setMessage("Install accepted. Once added, use the admin app from your home screen.");
      setDeferredPrompt(null);
    } else {
      setMessage("Install was dismissed. You can still reopen admin in your browser and install later.");
    }
  }

  return (
    <section className="rounded-[28px] border border-emerald-100 bg-[linear-gradient(135deg,#ffffff_0%,#f4fbf6_55%,#ecfdf3_100%)] p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Phone-first admin</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">Install Orduva Admin on your phone</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">{message}</p>
          <div className="mt-4 grid gap-3 text-sm text-slate-700 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/80 bg-white/80 px-4 py-3 shadow-sm">
              <p className="font-semibold text-slate-900">1. Faster launch</p>
              <p className="mt-1 text-slate-600">Open straight into admin without hunting through browser tabs.</p>
            </div>
            <div className="rounded-2xl border border-white/80 bg-white/80 px-4 py-3 shadow-sm">
              <p className="font-semibold text-slate-900">2. Cleaner mobile feel</p>
              <p className="mt-1 text-slate-600">Use admin more like an app with better full-screen focus on orders.</p>
            </div>
            <div className="rounded-2xl border border-white/80 bg-white/80 px-4 py-3 shadow-sm">
              <p className="font-semibold text-slate-900">3. Seller ready</p>
              <p className="mt-1 text-slate-600">This lays the groundwork for stronger phone-based seller alerts later.</p>
            </div>
          </div>
        </div>

        <div className="w-full max-w-sm rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_12px_34px_rgba(15,23,42,0.06)]">
          {isInstalled ? (
            <>
              <p className="text-sm font-semibold text-emerald-700">Already installed</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">Admin is already installed on this device. Launch it from your home screen or app drawer.</p>
            </>
          ) : deferredPrompt ? (
            <>
              <button
                type="button"
                onClick={handleInstall}
                className="admin-pressable inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Install Orduva Admin
              </button>
              <p className="mt-3 text-sm leading-6 text-slate-600">Best on Android Chrome or desktop Chrome/Edge. If you changed icons recently, remove the old install first and then install again.</p>
            </>
          ) : isIos ? (
            <>
              <p className="text-sm font-semibold text-slate-900">Install on iPhone / iPad</p>
              <ol className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                <li>Open this admin page in Safari.</li>
                <li>Tap the Share button.</li>
                <li>Choose <span className="font-semibold text-slate-900">Add to Home Screen</span>.</li>
              </ol>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-slate-900">Install option not showing yet</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">Open admin in Chrome or Edge and use the browser install option if available. If the old app identity was previously installed, remove it first, refresh, then try again.</p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
