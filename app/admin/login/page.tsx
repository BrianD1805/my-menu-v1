"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

function normalizeSlugFromHost() {
  if (typeof window === "undefined") return "";
  const host = window.location.host;
  const hostname = host.split(":")[0].toLowerCase();

  if (hostname === "admin.localhost" || hostname.startsWith("admin.")) {
    return "";
  }

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
  const [tenantSlug, setTenantSlug] = useState("");
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
    if (typeof window === "undefined") return;
    const selectedStore = new URLSearchParams(window.location.search).get("tenant");
    if (selectedStore) {
      const normalizedStore = selectedStore.trim().toLowerCase();
      if (tenantSlug !== normalizedStore) setTenantSlug(normalizedStore);
      return;
    }
    if (!tenantSlug) setTenantSlug(tenantHint || "orduva");
  }, [tenantHint, tenantSlug]);

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
        body: JSON.stringify({ tenantSlug, email, password }),
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
        body: JSON.stringify({ tenantSlug, email, password, fullName, accessKey: setupKey }),
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
        : "border-[#E7D8CC] bg-[#FFF7F0] text-[#1F2328]";

  return (
    <main className="min-h-screen bg-[#F5F2EE] px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[1.04fr_0.96fr]">
        <section className="rounded-[32px] border border-[#E7D8CC] bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.10)] sm:p-8">
          <div className="mb-5">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#FF6A3D]">Orduva Admin</p>
            <h1 className="mt-2 text-3xl font-bold text-[#1F2328] sm:text-4xl">Sign in to your workspace</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#5C5F66] sm:text-base">
              Manage orders, products and storefront settings for the selected store.
            </p>
          </div>

          {session.loading ? (
            <div className="mb-5 rounded-2xl border border-[#E7D8CC] bg-[#FFF7F0] px-4 py-3 text-sm text-[#5C5F66]">Checking your sign-in status...</div>
          ) : null}

          {!session.loading && session.authenticated ? (
            <div className="mb-5 space-y-4 rounded-[28px] border border-[#FFD8C8] bg-[#FFF7F0] p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#FF6A3D]">Already signed in</p>
                <h2 className="mt-2 text-2xl font-bold text-[#1F2328]">Continue to admin</h2>
                <p className="mt-2 text-sm leading-6 text-[#5C5F66]">
                  Signed in as {session.user.full_name || session.user.email} for {session.tenant.name}.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <a
                  href="/admin"
                  className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#0E0E10] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1F2328]"
                >
                  Open admin
                </a>
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={busy === "logout"}
                  className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-[#1F2328] ring-1 ring-[#E7D8CC] transition hover:bg-[#FFF7F0] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {busy === "logout" ? "Signing out..." : "Sign out"}
                </button>
              </div>
            </div>
          ) : null}

          <div className="mb-5 rounded-[26px] border border-[#E7D8CC] bg-[#FFF7F0] p-4 sm:p-5">
            <label className="mb-2 block text-sm font-semibold text-[#1F2328]">Store address name</label>
            <input
              type="text"
              value={tenantSlug}
              onChange={(event) => setTenantSlug(event.target.value.toLowerCase())}
              className="w-full rounded-2xl border border-[#E7D8CC] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#FF6A3D]"
              placeholder="orduva"
              required
            />
            <p className="mt-2 text-xs leading-5 text-[#5C5F66]">This selects the store workspace you want to manage. Example: stamps-delivered opens stamps-delivered.orduva.com.</p>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setActivePanel("login")}
              className={`inline-flex min-h-12 items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                activePanel === "login"
                  ? "bg-[#0E0E10] text-white shadow-[0_12px_30px_rgba(15,23,42,0.16)]"
                  : "bg-white text-[#1F2328] ring-1 ring-[#E7D8CC] hover:bg-[#FFF7F0]"
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setActivePanel("setup")}
              className={`inline-flex min-h-12 items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                activePanel === "setup"
                  ? "bg-[#FF6A3D] text-white shadow-[0_12px_30px_rgba(255,106,61,0.22)]"
                  : "bg-white text-[#1F2328] ring-1 ring-[#E7D8CC] hover:bg-[#FFF7F0]"
              }`}
            >
              First owner setup
            </button>
          </div>

          {activePanel === "login" ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#1F2328]">Owner email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-2xl border border-[#E7D8CC] px-4 py-3 text-sm outline-none transition focus:border-[#FF6A3D]"
                  placeholder="owner@example.com"
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#1F2328]">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-2xl border border-[#E7D8CC] px-4 py-3 text-sm outline-none transition focus:border-[#FF6A3D]"
                  placeholder="Enter your password"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={busy === "login"}
                className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-[#0E0E10] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1F2328] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy === "login" ? "Signing in..." : "Sign in to admin"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleBootstrap} className="space-y-4 rounded-[28px] border border-[#FFD8C8] bg-[#FFF7F0] p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#FF6A3D]">First owner setup</p>
                <h2 className="mt-2 text-2xl font-bold text-[#1F2328]">Create the first owner</h2>
                <p className="mt-2 text-sm leading-6 text-[#5C5F66]">
                  Use this once when setting up a store workspace for the first time.
                </p>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#1F2328]">Full name</label>
                <input
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  className="w-full rounded-2xl border border-[#E7D8CC] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#FF6A3D]"
                  placeholder="Store owner"
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#1F2328]">Owner email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-2xl border border-[#E7D8CC] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#FF6A3D]"
                  placeholder="owner@example.com"
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#1F2328]">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-2xl border border-[#E7D8CC] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#FF6A3D]"
                  placeholder="Choose a password"
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#1F2328]">Setup access key</label>
                <input
                  type="password"
                  value={setupKey}
                  onChange={(event) => setSetupKey(event.target.value)}
                  className="w-full rounded-2xl border border-[#E7D8CC] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#FF6A3D]"
                  placeholder="Enter setup key"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={busy === "setup"}
                className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-[#FF6A3D] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#E95C32] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy === "setup" ? "Creating first owner..." : "Create first owner"}
              </button>
            </form>
          )}

          {message ? <div className={`mt-5 rounded-2xl border px-4 py-3 text-sm ${messageClasses}`}>{message}</div> : null}
        </section>

        <aside className="rounded-[32px] border border-[#E7D8CC] bg-[#0E0E10] p-6 text-white shadow-[0_24px_70px_rgba(15,23,42,0.16)] sm:p-8">
          <div className="inline-flex rounded-full bg-[#FF6A3D] px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white">Store workspace</div>
          <h2 className="mt-5 text-3xl font-bold tracking-tight">Orduva Admin</h2>
          <p className="mt-4 text-sm leading-7 text-white/72">
            A focused workspace for managing your business, products and incoming orders.
          </p>
          <div className="mt-8 grid gap-3 text-sm text-white/78">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">Manage products and categories</div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">Track new and active orders</div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">Update storefront branding and settings</div>
          </div>
        </aside>
      </div>
    </main>
  );
}
