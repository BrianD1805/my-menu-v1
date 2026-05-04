"use client";

import { useEffect, useMemo, useState } from "react";
import AdminInstallCard from "@/components/admin/AdminInstallCard";
import AdminPushNotificationsCard from "@/components/admin/AdminPushNotificationsCard";

type ChecklistItem = {
  id: string;
  title: string;
  body: string;
};

const ITEMS: ChecklistItem[] = [
  {
    id: "signin",
    title: "Sign in to your admin area",
    body: "You are in the right place. This is where you will finish setting up your store.",
  },
  {
    id: "catalogue",
    title: "Add your categories, products and prices",
    body: "Start with a small live menu or catalogue. You can add more later.",
  },
  {
    id: "photos",
    title: "Add product photos and tidy descriptions",
    body: "Good photos and clear descriptions help customers order with confidence.",
  },
  {
    id: "branding",
    title: "Check logo, colours, contact details and currency",
    body: "Use Settings to make sure the store feels like your business.",
  },
  {
    id: "install",
    title: "Install Orduva Admin on your phone",
    body: "This gives you quicker access when you are managing orders on the move.",
  },
  {
    id: "push",
    title: "Enable and test new-order alerts",
    body: "Turn on admin push notifications before relying on live customer orders.",
  },
  {
    id: "test-order",
    title: "Place one test order",
    body: "Check the customer journey before sharing the store address publicly.",
  },
  {
    id: "share",
    title: "Share your store address",
    body: "Once the test order works, you are ready to start sending customers to your store.",
  },
];

export default function AdminLaunchChecklist({
  tenantSlug,
  showSetupTools = false,
}: {
  tenantSlug?: string;
  showSetupTools?: boolean;
}) {
  const storageKey = useMemo(() => `orduva-launch-checklist-${tenantSlug || "current-store"}`, [tenantSlug]);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [showTools, setShowTools] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) setChecked(JSON.parse(raw));
    } catch {
      // Ignore local storage issues.
    }
  }, [storageKey]);

  function toggle(id: string) {
    const next = { ...checked, [id]: !checked[id] };
    setChecked(next);
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      // Ignore local storage issues.
    }
  }

  const completed = ITEMS.filter((item) => checked[item.id]).length;
  const percentage = Math.round((completed / ITEMS.length) * 100);

  return (
    <section className="rounded-[32px] border border-[#FFD8C8] bg-[linear-gradient(135deg,#ffffff_0%,#fff7f0_56%,#ffe7db_100%)] p-5 shadow-[0_20px_58px_rgba(14,14,16,0.08)] sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#C84F2A]">What to do next</p>
          <h2 className="mt-2 text-2xl font-black text-[#0E0E10] sm:text-3xl">Finish your launch setup</h2>
          <p className="mt-3 text-sm leading-6 text-[#5C5F66]">
            Work through this gentle checklist before sharing your store with customers. Tick items off as you complete them.
          </p>
        </div>
        <div className="rounded-[24px] border border-[#0E0E10]/10 bg-white px-5 py-4 text-center shadow-sm">
          <p className="text-3xl font-black text-[#0E0E10]">{percentage}%</p>
          <p className="mt-1 text-xs font-black uppercase tracking-[0.18em] text-[#C84F2A]">Launch progress</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        {ITEMS.map((item, index) => {
          const isDone = Boolean(checked[item.id]);
          return (
            <label
              key={item.id}
              className={`flex cursor-pointer gap-3 rounded-[22px] border p-4 transition ${
                isDone ? "border-emerald-200 bg-emerald-50" : "border-[#0E0E10]/10 bg-white/88 hover:border-[#FF6A3D]/35"
              }`}
            >
              <input
                type="checkbox"
                checked={isDone}
                onChange={() => toggle(item.id)}
                className="mt-1 h-5 w-5 shrink-0 accent-[#FF6A3D]"
              />
              <span>
                <span className="block text-xs font-black uppercase tracking-[0.18em] text-[#C84F2A]">Step {index + 1}</span>
                <span className="mt-1 block text-base font-black text-[#0E0E10]">{item.title}</span>
                <span className="mt-1 block text-sm leading-6 text-[#5C5F66]">{item.body}</span>
              </span>
            </label>
          );
        })}
      </div>

      {showSetupTools ? (
        <div className="mt-5 rounded-[26px] border border-[#0E0E10]/10 bg-white/80 p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#C84F2A]">Optional setup tools</p>
              <h3 className="mt-1 text-xl font-black text-[#0E0E10]">Phone install and order alert setup</h3>
              <p className="mt-2 text-sm leading-6 text-[#5C5F66]">
                These tools are here when you are ready. They are no longer shown as separate warnings at the top of the admin home page.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowTools((current) => !current)}
              className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#0E0E10] px-5 py-3 text-sm font-black text-white transition hover:bg-[#252528]"
            >
              {showTools ? "Hide setup tools" : "Open setup tools"}
            </button>
          </div>
          {showTools ? (
            <div className="mt-5 space-y-5">
              <AdminInstallCard />
              <AdminPushNotificationsCard />
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
