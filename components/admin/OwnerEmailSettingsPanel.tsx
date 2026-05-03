"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type EmailStatus = {
  provider: string;
  configured: boolean;
  hasResendApiKey: boolean;
  fromAddress: string;
  ownerRecipient: string | null;
  ownerRecipientConfigured: boolean;
};

type StatusPayload = {
  status: EmailStatus;
  tenant: {
    name: string;
    slug: string;
    storeAddress: string;
  };
};

function statusPill(ok: boolean, yes: string, no: string) {
  return (
    <span className={["inline-flex min-h-8 items-center rounded-2xl px-3 py-1 text-xs font-black", ok ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200" : "bg-amber-50 text-amber-900 ring-1 ring-amber-200"].join(" ")}>
      {ok ? yes : no}
    </span>
  );
}

export default function OwnerEmailSettingsPanel() {
  const [payload, setPayload] = useState<StatusPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [recipient, setRecipient] = useState("");
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState<"idle" | "success" | "error" | "info">("idle");

  useEffect(() => {
    let cancelled = false;
    async function loadStatus() {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/email-settings/test", { cache: "no-store" });
        const data = await res.json();
        if (!cancelled) {
          setPayload(data);
          setRecipient(data?.status?.ownerRecipient || "");
        }
      } catch {
        if (!cancelled) {
          setMessage("Email settings status could not be loaded.");
          setTone("error");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadStatus();
    return () => {
      cancelled = true;
    };
  }, []);

  const status = payload?.status;
  const messageClass = useMemo(() => {
    if (tone === "success") return "border-emerald-200 bg-emerald-50 text-emerald-800";
    if (tone === "error") return "border-rose-200 bg-rose-50 text-rose-800";
    if (tone === "info") return "border-orange-200 bg-orange-50 text-orange-900";
    return "hidden";
  }, [tone]);

  async function sendTest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setMessage("Sending test email...");
    setTone("info");

    try {
      const res = await fetch("/api/admin/email-settings/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipient }),
      });
      const data = await res.json();
      setMessage(data?.message || (res.ok ? "Test email sent." : "Test email could not be sent."));
      setTone(res.ok ? "success" : "error");
    } catch {
      setMessage("Test email could not be sent. Please check the deployment environment variables.");
      setTone("error");
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="mt-8 overflow-hidden rounded-[30px] border border-[#0E0E10]/10 bg-white shadow-[0_20px_60px_rgba(14,14,16,0.08)]">
      <div className="border-b border-[#0E0E10]/10 bg-[#0E0E10] px-5 py-5 text-white sm:px-6">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[#FFB168]">Owner email foundation</p>
        <h2 className="mt-2 text-2xl font-black tracking-tight">Email settings and test panel</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-white/75">
          Check whether onboarding launch emails are configured, then send a live test before relying on client notifications.
        </p>
      </div>

      <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-[24px] border border-[#0E0E10]/10 bg-[#FFF7F0] p-4">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#C84F2A]">Runtime status</p>
          {loading ? (
            <p className="mt-3 text-sm text-[#5C5F66]">Checking email settings...</p>
          ) : status ? (
            <div className="mt-4 space-y-3 text-sm text-[#5C5F66]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold text-[#0E0E10]">Resend API key</span>
                {statusPill(status.hasResendApiKey, "Configured", "Missing")}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold text-[#0E0E10]">From address</span>
                <span className="text-right font-bold text-[#0E0E10]">{status.fromAddress || "Not set"}</span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold text-[#0E0E10]">Owner email</span>
                {statusPill(status.ownerRecipientConfigured, "Configured", "Missing")}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold text-[#0E0E10]">Overall</span>
                {statusPill(status.configured, "Ready to test", "Setup needed")}
              </div>
              <div className="rounded-2xl border border-[#0E0E10]/10 bg-white p-3 text-xs leading-5 text-[#5C5F66]">
                Store being tested: <span className="font-black text-[#0E0E10]">{payload?.tenant?.name}</span><br />
                Store address: <span className="font-black text-[#0E0E10]">{payload?.tenant?.storeAddress}</span>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-sm text-rose-700">Email status is unavailable.</p>
          )}
        </div>

        <form onSubmit={sendTest} className="rounded-[24px] border border-[#FF6A3D]/20 bg-white p-4 shadow-[0_14px_38px_rgba(14,14,16,0.05)]">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#C84F2A]">Send live test</p>
          <label className="mt-4 block text-sm font-black text-[#0E0E10]" htmlFor="owner-email-test-recipient">
            Test recipient
          </label>
          <input
            id="owner-email-test-recipient"
            value={recipient}
            onChange={(event) => setRecipient(event.target.value)}
            placeholder="you@example.com"
            className="mt-2 min-h-12 w-full rounded-2xl border border-[#0E0E10]/15 bg-[#F5F2EE] px-4 text-sm font-semibold text-[#0E0E10] outline-none transition focus:border-[#FF6A3D] focus:bg-white"
          />
          <p className="mt-2 text-xs leading-5 text-[#68707A]">
            Leave this as your owner email, or enter another address for a one-off test. The result is logged in notification_events with channel = email.
          </p>
          <button
            type="submit"
            disabled={sending || !recipient.trim()}
            className="admin-pressable mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-[#FF6A3D] px-5 py-3 text-sm font-black text-white shadow-[0_16px_36px_rgba(255,106,61,0.24)] transition hover:-translate-y-[1px] hover:bg-[#F15F34] disabled:cursor-not-allowed disabled:opacity-55"
          >
            {sending ? "Sending test..." : "Send test email"}
          </button>
          <div className={["mt-4 rounded-2xl border p-3 text-sm font-bold", messageClass].join(" ")}>{message}</div>
        </form>
      </div>

      <div className="border-t border-[#0E0E10]/10 bg-[#F5F2EE] px-5 py-4 text-xs leading-5 text-[#5C5F66] sm:px-6">
        Required Netlify variables: <span className="font-black text-[#0E0E10]">RESEND_API_KEY</span>, <span className="font-black text-[#0E0E10]">ORDUVA_EMAIL_FROM</span>, and <span className="font-black text-[#0E0E10]">ORDUVA_OWNER_EMAIL</span>. This panel does not store secrets in Supabase.
      </div>
    </section>
  );
}
