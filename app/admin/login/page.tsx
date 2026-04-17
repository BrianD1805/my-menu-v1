"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

function normalizeSlugFromHost() {
  if (typeof window === "undefined") return "";
  const host = window.location.host;
  const hostname = host.split(":")[0].toLowerCase();
  const parts = hostname.split(".").filter(Boolean);
  if (parts.length >= 3) return parts[0];
  return parts[0] === "www" && parts[1] ? parts[1] : parts[0] || "orduva";
}

type MessageTone = "info" | "error" | "success";
type ActivePanel = "login" | "setup";
type SessionState =
  | { loading: true; authenticated: false }
  | { loading: false; authenticated: false }
  | {
      loading: false;
      authenticated: true;
      user: { email: string | null; full_name: string | null };
      tenant: { slug: string; name: string };
    };

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [setupKey, setSetupKey] = useState("");
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<MessageTone>("info");
  const [busy, setBusy] = useState<"login" | "setup" | "logout" | null>(null);
  const [activePanel, setActivePanel] = useState<ActivePanel>("login");
  const [session, setSession] = useState<SessionState>({ loading: true, authenticated: false });
  const tenantHint = useMemo(() => normalizeSlugFromHost(), []);

  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      try {
        const response = await fetch("/api/admin/auth/session", { cache: "no-store" });
        if (!response.ok) {
          if (!cancelled) setSession({ loading: false, authenticated: false });
          return;
        }

        const payload = await response.json();
        if (!cancelled && payload?.authenticated) {
          setSession({
            loading: false,
            authenticated: true,
            user: payload.user,
            tenant: payload.tenant,
          });
        } else if (!cancelled) {
          setSession({ loading: false, authenticated: false });
        }
      } catch {
        if (!cancelled) setSession({ loading: false, authenticated: false });
      }
    }

    loadSession();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleLogin(event: FormEvent) {
    event.preventDefault();
    setBusy("login");
    setMessageTone("info");
    setMessage("Signing you in...");
    try {
      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Login failed");
      setMessageTone("success");
      setMessage("Login successful. Opening your admin area...");
      window.location.href = "/admin";
    } catch (error) {
      setMessageTone("error");
      setMessage(error instanceof Error ? error.message : "Login failed");
    } finally {
      setBusy(null);
    }
  }

  async function handleBootstrap(event: FormEvent) {
    event.preventDefault();
    setBusy("setup");
    setMessageTone("info");
    setMessage("Creating the first owner login...");
    try {
      const response = await fetch("/api/admin/auth/bootstrap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, fullName, accessKey: setupKey }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Bootstrap failed");
      setMessageTone("success");
      setMessage("First owner created successfully. Opening your admin area...");
      window.location.href = "/admin";
    } catch (error) {
      setMessageTone("error");
      setMessage(error instanceof Error ? error.message : "Bootstrap failed");
    } finally {
      setBusy(null);
    }
  }

  async function handleLogout() {
    setBusy("logout");
    setMessageTone("info");
    setMessage("Signing out...");
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" });
      window.location.href = "/admin/login";
    } finally {
      setBusy(null);
    }
  }

  const messageClasses =
    messageTone === "error"
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : messageTone === "success"
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-[32px] border border-black/5 bg-white p-6 shadow-[0_30px_80px_rgba(15,23,42,0.14)] sm:p-8">
          <div className="mb-6">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Orduva owner login</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">Sign in to admin</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              This login is tenant-specific. You will only see the admin for the current tenant, and your session stays tied to that tenant only.
            </p>
          </div>

          <div className="mb-6 rounded-[28px] border border-slate-200 bg-[linear-gradient(135deg,#f8fafc_0%,#eef5f2_100%)] p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Current tenant</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{tenantHint || "Current tenant"}</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Make sure the tenant hint matches the business you expect before signing in or creating the first owner.
                </p>
              </div>
              <div className="rounded-2xl bg-white/80 px-4 py-3 text-sm text-slate-600 ring-1 ring-slate-200">
                <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Version</span>
                <span className="mt-1 block font-semibold text-slate-900">Owner login active</span>
              </div>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setActivePanel("login")}
              className={`inline-flex min-h-12 items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                activePanel === "login"
                  ? "bg-slate-900 text-white shadow-[0_12px_30px_rgba(15,23,42,0.18)]"
                  : "bg-slate-100 text-slate-700 ring-1 ring-slate-200 hover:bg-slate-200"
              }`}
            >
              Owner sign in
            </button>
            <button
              type="button"
              onClick={() => setActivePanel("setup")}
              className={`inline-flex min-h-12 items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                activePanel === "setup"
                  ? "bg-emerald-600 text-white shadow-[0_12px_30px_rgba(5,150,105,0.2)]"
                  : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100"
              }`}
            >
              First owner setup
            </button>
          </div>

          {session.loading ? (
            <div className="mb-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">Checking for an existing owner session...</div>
          ) : null}

          {!session.loading && session.authenticated ? (
            <div className="space-y-4 rounded-[28px] border border-emerald-200 bg-emerald-50 p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Already signed in</p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900">Continue to your admin</h2>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  You are already signed in as {session.user.full_name || session.user.email} for {session.tenant.name}.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <a
                  href="/admin"
                  className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Open admin
                </a>
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={busy === "logout"}
                  className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 ring-1 ring-slate-200 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {busy === "logout" ? "Signing out..." : "Sign out"}
                </button>
              </div>
            </div>
          ) : activePanel === "login" ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Owner email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                  placeholder="owner@example.com"
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                  placeholder="Enter your password"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={busy === "login"}
                className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy === "login" ? "Signing in..." : "Sign in to admin"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleBootstrap} className="space-y-4 rounded-[28px] border border-emerald-200 bg-emerald-50/70 p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Use once per tenant</p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900">Create the first owner login</h2>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  This is only for the very first owner on the current tenant. You will need the bootstrap access key from Netlify. Once the first owner exists, use the normal sign-in form instead.
                </p>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Full name</label>
                <input
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-400"
                  placeholder="Tenant owner"
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Owner email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-400"
                  placeholder="owner@example.com"
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-400"
                  placeholder="Choose a password"
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Bootstrap access key</label>
                <input
                  type="password"
                  value={setupKey}
                  onChange={(event) => setSetupKey(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-400"
                  placeholder="ADMIN_ACCESS_KEY"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={busy === "setup"}
                className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy === "setup" ? "Creating first owner..." : "Create first owner"}
              </button>
            </form>
          )}

          {message ? <div className={`mt-5 rounded-2xl border px-4 py-3 text-sm ${messageClasses}`}>{message}</div> : null}
        </section>

        <aside className="rounded-[32px] border border-black/5 bg-white p-6 shadow-[0_30px_80px_rgba(15,23,42,0.1)] sm:p-8">
          <div className="rounded-[28px] bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">What changed</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">Cleaner owner access flow</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
              <li>• Clear split between normal sign-in and first owner setup.</li>
              <li>• Existing session now shows a continue-to-admin panel instead of confusion.</li>
              <li>• Success and error messages are easier to read.</li>
              <li>• First owner setup is highlighted so it no longer looks like plain text.</li>
            </ul>
          </div>

          <div className="mt-5 rounded-[28px] border border-slate-200 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Quick reminders</p>
            <div className="mt-4 space-y-4 text-sm leading-6 text-slate-600">
              <div>
                <p className="font-semibold text-slate-900">Normal sign-in</p>
                <p>Use this after the first owner already exists for the current tenant.</p>
              </div>
              <div>
                <p className="font-semibold text-slate-900">First owner setup</p>
                <p>Use this once only for the current tenant, together with the Netlify bootstrap access key.</p>
              </div>
              <div>
                <p className="font-semibold text-slate-900">Tenant hint</p>
                <p>If the tenant hint is wrong, stop there and switch to the correct tenant before signing in.</p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
