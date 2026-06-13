"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import { useOwnerPlatformAccess } from "@/components/admin/OwnerPlatformAccessGate";

type Summary = {
  totals: {
    today: number;
    sevenDays: number;
    thirtyDays: number;
    productViews: number;
    productShares: number;
    addToCarts: number;
    checkoutStarts: number;
    ordersPlaced: number;
  };
  byScope: Array<{ scope: string; count: number }>;
  byEventType: Array<{ eventType: string; count: number }>;
  topPages: Array<{ pagePath: string; host: string; count: number }>;
  topHosts: Array<{ host: string; count: number }>;
  topProducts: Array<{ productId: string; productName: string; count: number }>;
  topViewedProducts: Array<{ productId: string; productName: string; count: number }>;
  topSharedProducts: Array<{ productId: string; productName: string; count: number }>;
  topAddedProducts: Array<{ productId: string; productName: string; count: number }>;
  productEngagement: Array<{ productId: string; productName: string; views: number; shares: number; addToCarts: number; total: number }>;
  recentEvents: Array<{ id: string; scope: string; eventType: string; host: string; pagePath: string; productName: string | null; createdAt: string }>;
};

type Props = {
  mode: "tenant" | "owner";
};

function formatLabel(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function StatCard({ label, value, note }: { label: string; value: number | string; note?: string }) {
  return (
    <article className="rounded-[26px] border border-[#0E0E10]/10 bg-white p-5 shadow-[0_18px_45px_rgba(14,14,16,0.07)]">
      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#C84F2A]">{label}</p>
      <p className="mt-3 text-3xl font-black tracking-tight text-[#0E0E10]">{value}</p>
      {note ? <p className="mt-2 text-sm leading-6 text-[#5C5F66]">{note}</p> : null}
    </article>
  );
}

function ListCard({ title, items, empty }: { title: string; items: Array<{ label: string; value: number; sub?: string }>; empty: string }) {
  return (
    <section className="min-w-0 rounded-[28px] border border-[#0E0E10]/10 bg-white p-4 shadow-[0_18px_45px_rgba(14,14,16,0.07)] sm:p-5">
      <h2 className="text-xl font-black tracking-tight text-[#0E0E10]">{title}</h2>
      <div className="mt-4 space-y-3">
        {items.length ? items.map((item) => (
          <div key={`${item.label}-${item.sub || ""}`} className="flex min-w-0 flex-col items-start gap-3 rounded-2xl border border-[#0E0E10]/8 bg-[#F8FAFC] px-4 py-3 sm:flex-row sm:justify-between sm:gap-4">
            <div className="min-w-0 w-full">
              <p className="truncate text-sm font-black text-[#0E0E10]">{item.label}</p>
              {item.sub ? <p className="mt-1 truncate text-xs font-semibold text-[#6B7280]">{item.sub}</p> : null}
            </div>
            <span className="shrink-0 rounded-full border border-[#FF6A3D]/18 bg-[#FFF7F0] px-3 py-1 text-sm font-black text-[#A33A16]">{item.value}</span>
          </div>
        )) : <p className="rounded-2xl border border-dashed border-[#0E0E10]/12 bg-[#F8FAFC] px-4 py-5 text-sm font-semibold text-[#6B7280]">{empty}</p>}
      </div>
    </section>
  );
}

function ProductEngagementCard({ items }: { items: Summary["productEngagement"] }) {
  return (
    <section className="min-w-0 rounded-[28px] border border-[#0E0E10]/10 bg-white p-4 shadow-[0_18px_45px_rgba(14,14,16,0.07)] sm:p-5 lg:col-span-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#C84F2A]">Product polish</p>
          <h2 className="mt-1 text-xl font-black tracking-tight text-[#0E0E10]">Top product engagement</h2>
        </div>
        <p className="max-w-md text-sm font-semibold leading-6 text-[#6B7280]">Views, shares and add-to-cart events shown separately so tenants can spot what customers are looking at and what they are sending to friends.</p>
      </div>
      <div className="mt-5 space-y-3">
        {items.length ? items.map((item) => (
          <div key={item.productId} className="rounded-2xl border border-[#0E0E10]/8 bg-[#F8FAFC] p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-[#0E0E10]">{item.productName}</p>
                <p className="mt-1 truncate text-xs font-semibold text-[#6B7280]">{item.productId}</p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs font-black">
                <span className="rounded-full bg-white px-3 py-1 text-[#0E0E10] ring-1 ring-[#0E0E10]/8">{item.views} views</span>
                <span className="rounded-full bg-[#ECFDF5] px-3 py-1 text-[#047857] ring-1 ring-emerald-100">{item.shares} shares</span>
                <span className="rounded-full bg-[#FFF7F0] px-3 py-1 text-[#A33A16] ring-1 ring-orange-100">{item.addToCarts} carts</span>
                <span className="rounded-full bg-[#EFF6FF] px-3 py-1 text-[#1D4ED8] ring-1 ring-blue-100">{item.total} total</span>
              </div>
            </div>
          </div>
        )) : <p className="rounded-2xl border border-dashed border-[#0E0E10]/12 bg-[#F8FAFC] px-4 py-5 text-sm font-semibold text-[#6B7280]">No product engagement has been recorded yet. Open a product, share it, or add it to the cart to start filling this section.</p>}
      </div>
    </section>
  );
}

function AccordionSection({
  title,
  note,
  children,
  open,
  onToggle,
}: {
  title: string;
  note?: string;
  children: ReactNode;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <section className="min-w-0 overflow-hidden rounded-[24px] border border-emerald-200 bg-[#F0FDF4] p-4 shadow-none">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full min-w-0 items-start justify-between gap-3 rounded-[22px] border border-emerald-100 bg-white p-4 text-left transition hover:border-emerald-200 hover:bg-emerald-50/40"
        aria-expanded={open}
      >
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold text-slate-900">{title}</span>
          {note ? <span className="mt-1 block text-xs font-normal leading-5 text-slate-500">{note}</span> : null}
        </span>
        <span className={`mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-white text-sm font-bold shadow-sm transition ${open ? "border-orange-200 text-orange-800" : "border-emerald-200 text-emerald-700"}`} aria-hidden="true">
          {open ? "−" : "+"}
        </span>
      </button>
      {open ? (
        <div className="mt-4 min-w-0 overflow-hidden rounded-[22px] border border-emerald-100 bg-white p-3 shadow-sm sm:p-4">
          {children}
        </div>
      ) : null}
    </section>
  );
}

export default function AnalyticsDashboardPanel({ mode }: Props) {
  const ownerAccess = useOwnerPlatformAccess();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [openAnalyticsSection, setOpenAnalyticsSection] = useState<"products" | "traffic" | "recent" | null>("products");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const endpoint = mode === "owner" ? "/api/platform/analytics" : "/api/admin/analytics";
  const headers = useMemo(() => mode === "owner" ? ownerAccess.platformHeaders : {}, [mode, ownerAccess.platformHeaders]);

  useEffect(() => {
    let cancelled = false;
    async function loadAnalytics() {
      if (mode === "owner" && !ownerAccess.unlocked) return;
      setLoading(true);
      setMessage("");
      try {
        const response = await fetch(endpoint, { headers, cache: "no-store" });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data?.error || "Analytics could not be loaded.");
        if (!cancelled) setSummary(data.summary as Summary);
      } catch (error) {
        if (!cancelled) setMessage(error instanceof Error ? error.message : "Analytics could not be loaded.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadAnalytics();
    return () => { cancelled = true; };
  }, [endpoint, headers, mode, ownerAccess.unlocked]);

  if (loading) {
    return <section className="rounded-[30px] border border-[#0E0E10]/10 bg-white p-6 text-sm font-bold text-[#5C5F66] shadow-sm">Loading analytics…</section>;
  }

  if (message) {
    return (
      <section className="rounded-[30px] border border-orange-200 bg-[#FFF7F0] p-6 shadow-sm">
        <p className="text-sm font-black text-[#9A3412]">{message}</p>
        <p className="mt-2 text-sm leading-6 text-[#5C5F66]">Run the Ver-0.209 Supabase SQL first, then refresh this page.</p>
      </section>
    );
  }

  if (!summary) return null;

  const scopeItems = summary.byScope.map((item) => ({ label: formatLabel(item.scope), value: item.count }));
  const eventItems = summary.byEventType.map((item) => ({ label: formatLabel(item.eventType), value: item.count }));
  const pageItems = summary.topPages.map((item) => ({ label: item.pagePath, value: item.count, sub: item.host }));
  const hostItems = summary.topHosts.map((item) => ({ label: item.host, value: item.count }));
  const productItems = summary.topProducts.map((item) => ({ label: item.productName, value: item.count, sub: item.productId }));
  const viewedProductItems = (summary.topViewedProducts || []).map((item) => ({ label: item.productName, value: item.count, sub: item.productId }));
  const sharedProductItems = (summary.topSharedProducts || []).map((item) => ({ label: item.productName, value: item.count, sub: item.productId }));
  const addedProductItems = (summary.topAddedProducts || []).map((item) => ({ label: item.productName, value: item.count, sub: item.productId }));

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Today" value={summary.totals.today} note="Events recorded since midnight." />
        <StatCard label="Last 7 days" value={summary.totals.sevenDays} note="Page views and key actions." />
        <StatCard label="Last 30 days" value={summary.totals.thirtyDays} note="Raw events retained for dashboard use." />
        <StatCard label="Checkout starts" value={summary.totals.checkoutStarts} note="Customers who tapped through to checkout." />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Product views" value={summary.totals.productViews} />
        <StatCard label="Product shares" value={summary.totals.productShares} />
        <StatCard label="Add to carts" value={summary.totals.addToCarts} />
        <StatCard label="Orders" value={summary.totals.ordersPlaced} />
      </div>

      <AccordionSection
        title="Product performance"
        note="Open this when you want to see which products are being viewed, shared and added to cart."
        open={openAnalyticsSection === "products"}
        onToggle={() => setOpenAnalyticsSection((current) => current === "products" ? null : "products")}
      >
        <div className="grid min-w-0 gap-5 lg:grid-cols-2">
          <ProductEngagementCard items={summary.productEngagement || []} />
          <ListCard title="Most viewed products" items={viewedProductItems} empty="No product views have been recorded yet." />
          <ListCard title="Most shared products" items={sharedProductItems} empty="No product shares have been recorded yet." />
          <ListCard title="Most added to cart" items={addedProductItems} empty="No add-to-cart product events have been recorded yet." />
          <ListCard title="All product activity" items={productItems} empty="No product activity has been recorded yet." />
        </div>
      </AccordionSection>

      <AccordionSection
        title={mode === "owner" ? "Traffic, pages and subdomains" : "Traffic and pages"}
        note={mode === "owner" ? "Owner view includes platform areas, hosts, subdomains and top pages." : "Tenant view keeps the page and event breakdown focused on this store only."}
        open={openAnalyticsSection === "traffic"}
        onToggle={() => setOpenAnalyticsSection((current) => current === "traffic" ? null : "traffic")}
      >
        <div className="grid min-w-0 gap-5 lg:grid-cols-2">
          {mode === "owner" ? <ListCard title="Traffic by area" items={scopeItems} empty="No platform-wide traffic has been recorded yet." /> : null}
          <ListCard title="Event types" items={eventItems} empty="No events have been recorded yet." />
          {mode === "owner" ? <ListCard title="Top hosts / subdomains" items={hostItems} empty="No hosts have been recorded yet." /> : null}
          <ListCard title="Top pages" items={pageItems} empty="No page views have been recorded yet." />
        </div>
      </AccordionSection>

      <AccordionSection
        title="Recent activity"
        note="A compact activity feed for quick checking and troubleshooting."
        open={openAnalyticsSection === "recent"}
        onToggle={() => setOpenAnalyticsSection((current) => current === "recent" ? null : "recent")}
      >
        <section className="min-w-0 rounded-[28px] border border-[#0E0E10]/10 bg-white p-4 shadow-[0_18px_45px_rgba(14,14,16,0.07)] sm:p-5">
          <h2 className="text-xl font-black tracking-tight text-[#0E0E10]">Recent events</h2>
          <div className="mt-4 space-y-3">
            {summary.recentEvents.length ? summary.recentEvents.map((event) => (
              <div key={event.id} className="rounded-2xl border border-[#0E0E10]/8 bg-[#F8FAFC] px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-black text-[#0E0E10]">{formatLabel(event.eventType)}</span>
                  <span className="rounded-full bg-[#FFF7F0] px-2.5 py-1 text-xs font-black text-[#A33A16]">{formatLabel(event.scope)}</span>
                </div>
                <p className="mt-2 text-sm font-bold text-[#0E0E10]">{event.productName || event.pagePath}</p>
                <p className="mt-1 text-xs font-semibold text-[#6B7280]">{event.host} · {event.createdAt ? new Date(event.createdAt).toLocaleString() : ""}</p>
              </div>
            )) : <p className="rounded-2xl border border-dashed border-[#0E0E10]/12 bg-[#F8FAFC] px-4 py-5 text-sm font-semibold text-[#6B7280]">No recent events yet.</p>}
          </div>
        </section>
      </AccordionSection>
    </div>
  );
}
