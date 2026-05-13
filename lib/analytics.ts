import { db } from "@/lib/db";
import { getTenantSubdomainFromHost, resolveTenantSlugFromHost } from "@/lib/tenant";
import { isSharedAdminHost, normalizeHostname } from "@/lib/admin-host";

type AnalyticsScope = "public_landing" | "tenant_storefront" | "tenant_admin" | "owner_platform" | "affiliate_portal" | "checkout" | "unknown";

export type AnalyticsSummary = {
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
  recentEvents: Array<{
    id: string;
    scope: string;
    eventType: string;
    host: string;
    pagePath: string;
    productName: string | null;
    createdAt: string;
  }>;
};

export function safeAnalyticsText(value: unknown, max = 500) {
  const text = String(value || "").trim();
  return text ? text.slice(0, max) : null;
}

export function normaliseAnalyticsScope(value: unknown): AnalyticsScope {
  const scope = String(value || "").trim().toLowerCase();
  if (["public_landing", "tenant_storefront", "tenant_admin", "owner_platform", "affiliate_portal", "checkout"].includes(scope)) return scope as AnalyticsScope;
  return "unknown";
}

export function normaliseAnalyticsEventType(value: unknown) {
  const eventType = String(value || "").trim().toLowerCase().replace(/[^a-z0-9_:-]/g, "_").slice(0, 80);
  return eventType || "page_view";
}

export function inferAnalyticsScope(hostValue: unknown, pathValue: unknown): AnalyticsScope {
  const host = normalizeHostname(String(hostValue || ""));
  const path = String(pathValue || "/").toLowerCase();

  if (path.startsWith("/affiliate")) return "affiliate_portal";
  if (path.startsWith("/checkout") || path.startsWith("/billing")) return "checkout";
  if (path.startsWith("/platform")) return "owner_platform";
  if (path.startsWith("/admin")) return "tenant_admin";
  if (isSharedAdminHost(host)) return "owner_platform";
  if (getTenantSubdomainFromHost(host)) return "tenant_storefront";
  return "public_landing";
}

export async function resolveAnalyticsTenantId(hostValue: unknown, explicitTenantSlug?: unknown, explicitTenantId?: unknown) {
  const tenantId = safeAnalyticsText(explicitTenantId, 80);
  if (tenantId) return tenantId;

  const slug = safeAnalyticsText(explicitTenantSlug, 120) || resolveTenantSlugFromHost(String(hostValue || ""));
  if (!slug) return null;

  const { data } = await db.from("tenants").select("id").eq("slug", slug).maybeSingle();
  return data?.id || null;
}

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function increment(map: Map<string, number>, key: string | null | undefined) {
  const clean = String(key || "Unknown").trim() || "Unknown";
  map.set(clean, (map.get(clean) || 0) + 1);
}

function topEntries(map: Map<string, number>, limit: number) {
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
}

export async function buildAnalyticsSummary(options: { tenantId?: string | null; ownerWide?: boolean; days?: number } = {}): Promise<AnalyticsSummary> {
  const since = daysAgo(options.days || 30).toISOString();
  let query = db
    .from("analytics_events")
    .select("id, tenant_id, scope, event_type, host, page_path, product_id, product_name, created_at")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(3000);

  if (options.tenantId && !options.ownerWide) query = query.eq("tenant_id", options.tenantId);

  const { data, error } = await query;
  if (error) throw new Error("Could not load analytics. Run the Ver-0.209 Supabase SQL first.");

  const rows = (data || []) as Array<{
    id: string;
    tenant_id: string | null;
    scope: string | null;
    event_type: string | null;
    host: string | null;
    page_path: string | null;
    product_id: string | null;
    product_name: string | null;
    created_at: string | null;
  }>;

  const todayStart = startOfToday().getTime();
  const sevenStart = daysAgo(7).getTime();
  const thirtyStart = daysAgo(30).getTime();
  const byScope = new Map<string, number>();
  const byEventType = new Map<string, number>();
  const byHost = new Map<string, number>();
  const byPage = new Map<string, number>();
  const byProduct = new Map<string, { name: string; count: number }>();
  const byViewedProduct = new Map<string, { name: string; count: number }>();
  const bySharedProduct = new Map<string, { name: string; count: number }>();
  const byAddedProduct = new Map<string, { name: string; count: number }>();
  const byProductEngagement = new Map<string, { name: string; views: number; shares: number; addToCarts: number }>();

  let today = 0;
  let sevenDays = 0;
  let thirtyDays = 0;
  let productViews = 0;
  let productShares = 0;
  let addToCarts = 0;
  let checkoutStarts = 0;
  let ordersPlaced = 0;

  for (const row of rows) {
    const created = row.created_at ? new Date(row.created_at).getTime() : 0;
    if (created >= todayStart) today += 1;
    if (created >= sevenStart) sevenDays += 1;
    if (created >= thirtyStart) thirtyDays += 1;

    const eventType = row.event_type || "page_view";
    if (eventType === "product_view") productViews += 1;
    if (eventType === "product_share") productShares += 1;
    if (eventType === "add_to_cart") addToCarts += 1;
    if (eventType === "checkout_started") checkoutStarts += 1;
    if (eventType === "order_created" || eventType === "order_placed") ordersPlaced += 1;

    increment(byScope, row.scope);
    increment(byEventType, eventType);
    increment(byHost, row.host);
    increment(byPage, `${row.host || "Unknown"}${row.page_path || "/"}`);
    if (row.product_id || row.product_name) {
      const key = row.product_id || row.product_name || "unknown";
      const productName = row.product_name || "Unknown product";
      const current = byProduct.get(key) || { name: productName, count: 0 };
      current.count += 1;
      byProduct.set(key, current);

      const engagement = byProductEngagement.get(key) || { name: productName, views: 0, shares: 0, addToCarts: 0 };
      if (eventType === "product_view") {
        const viewed = byViewedProduct.get(key) || { name: productName, count: 0 };
        viewed.count += 1;
        byViewedProduct.set(key, viewed);
        engagement.views += 1;
      }
      if (eventType === "product_share") {
        const shared = bySharedProduct.get(key) || { name: productName, count: 0 };
        shared.count += 1;
        bySharedProduct.set(key, shared);
        engagement.shares += 1;
      }
      if (eventType === "add_to_cart") {
        const added = byAddedProduct.get(key) || { name: productName, count: 0 };
        added.count += 1;
        byAddedProduct.set(key, added);
        engagement.addToCarts += 1;
      }
      byProductEngagement.set(key, engagement);
    }
  }

  return {
    totals: { today, sevenDays, thirtyDays, productViews, productShares, addToCarts, checkoutStarts, ordersPlaced },
    byScope: topEntries(byScope, 10).map(([scope, count]) => ({ scope, count })),
    byEventType: topEntries(byEventType, 14).map(([eventType, count]) => ({ eventType, count })),
    topHosts: topEntries(byHost, 12).map(([host, count]) => ({ host, count })),
    topPages: topEntries(byPage, 12).map(([combined, count]) => {
      const slashIndex = combined.indexOf("/");
      return { host: slashIndex > 0 ? combined.slice(0, slashIndex) : "Unknown", pagePath: slashIndex > 0 ? combined.slice(slashIndex) : combined, count };
    }),
    topProducts: Array.from(byProduct.entries()).sort((a, b) => b[1].count - a[1].count).slice(0, 12).map(([productId, item]) => ({ productId, productName: item.name, count: item.count })),
    topViewedProducts: Array.from(byViewedProduct.entries()).sort((a, b) => b[1].count - a[1].count).slice(0, 8).map(([productId, item]) => ({ productId, productName: item.name, count: item.count })),
    topSharedProducts: Array.from(bySharedProduct.entries()).sort((a, b) => b[1].count - a[1].count).slice(0, 8).map(([productId, item]) => ({ productId, productName: item.name, count: item.count })),
    topAddedProducts: Array.from(byAddedProduct.entries()).sort((a, b) => b[1].count - a[1].count).slice(0, 8).map(([productId, item]) => ({ productId, productName: item.name, count: item.count })),
    productEngagement: Array.from(byProductEngagement.entries())
      .map(([productId, item]) => ({ productId, productName: item.name, views: item.views, shares: item.shares, addToCarts: item.addToCarts, total: item.views + item.shares + item.addToCarts }))
      .filter((item) => item.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 12),
    recentEvents: rows.slice(0, 20).map((row) => ({
      id: row.id,
      scope: row.scope || "unknown",
      eventType: row.event_type || "page_view",
      host: row.host || "Unknown",
      pagePath: row.page_path || "/",
      productName: row.product_name || null,
      createdAt: row.created_at || "",
    })),
  };
}
