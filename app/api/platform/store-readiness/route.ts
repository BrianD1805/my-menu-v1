import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { calculateTenantTrialState } from "@/lib/trial";

function getPlatformKey() {
  return (process.env.ORDUVA_PLATFORM_ACCESS_KEY || process.env.ADMIN_ACCESS_KEY || "").trim();
}

function requirePlatformKey(req: Request) {
  const expected = getPlatformKey();
  const supplied = (req.headers.get("x-orduva-platform-key") || "").trim();
  if (!expected || supplied !== expected) return NextResponse.json({ error: "Platform access key required" }, { status: 401 });
  return null;
}

type TenantRow = { id: string; name: string; slug: string; status: string | null; created_at: string | null; trial_status?: string | null; trial_started_at?: string | null; trial_ends_at?: string | null; subscription_status?: string | null; plan_name?: string | null };
type SettingsRow = { tenant_id: string; logo_url: string | null; favicon_url?: string | null; currency_code: string | null; currency_symbol: string | null; primary_color: string | null; accent_color: string | null; contact_phone: string | null; contact_email: string | null; contact_whatsapp: string | null };
type TenantUserRow = { tenant_id: string; email: string | null; role: string | null };
type CategoryRow = { tenant_id: string };
type ProductRow = { tenant_id: string; is_active: boolean | null; image_url: string | null };
type PushRow = { tenant_id: string; enabled: boolean | null };
type OrderRow = { tenant_id: string; status: string | null };
type EventRow = { tenant_id: string | null; event_type: string | null; status: string | null; channel: string | null };

function storeAddress(slug: string) { return `${slug}.orduva.com`; }
function storeUrl(slug: string) { return `https://${storeAddress(slug)}`; }
function adminLoginUrl(slug: string) { return `https://admin.orduva.com/admin/login?tenant=${encodeURIComponent(slug)}`; }
function increment(map: Map<string, number>, key: string, amount = 1) { map.set(key, (map.get(key) || 0) + amount); }
function readinessLabel(score: number, blockingIssues: number) { if (blockingIssues === 0 && score >= 80) return "Ready"; if (score >= 55) return "Nearly ready"; return "Needs setup"; }
function readinessTone(label: string) { if (label === "Ready") return "ready"; if (label === "Nearly ready") return "attention"; return "setup"; }
function isOnboardingEmail(event: EventRow) { const type = String(event.event_type || ""); return type.startsWith("client_onboarding_email_") || type.startsWith("owner_new_store_email_"); }

export async function GET(req: Request) {
  const accessError = requirePlatformKey(req);
  if (accessError) return accessError;

  try {
    const { data: tenants, error: tenantsError } = await db.from("tenants").select("id, name, slug, status, created_at, trial_status, trial_started_at, trial_ends_at, subscription_status, plan_name").order("created_at", { ascending: false }).limit(60);
    if (tenantsError) return NextResponse.json({ error: "Failed to load stores" }, { status: 500 });

    const tenantRows = (tenants || []) as TenantRow[];
    const tenantIds = tenantRows.map((tenant) => tenant.id);

    let settingsRows: SettingsRow[] = [];
    let ownerUsers: TenantUserRow[] = [];
    let categoryRows: CategoryRow[] = [];
    let productRows: ProductRow[] = [];
    let pushRows: PushRow[] = [];
    let orderRows: OrderRow[] = [];
    let emailRows: EventRow[] = [];

    if (tenantIds.length) {
      const [settingsResult, usersResult, categoriesResult, productsResult, pushResult, ordersResult, emailResult] = await Promise.all([
        db.from("tenant_settings").select("tenant_id, logo_url, favicon_url, currency_code, currency_symbol, primary_color, accent_color, contact_phone, contact_email, contact_whatsapp").in("tenant_id", tenantIds),
        db.from("tenant_users").select("tenant_id, email, role").in("tenant_id", tenantIds).eq("role", "owner"),
        db.from("categories").select("tenant_id").in("tenant_id", tenantIds),
        db.from("products").select("tenant_id, is_active, image_url").in("tenant_id", tenantIds),
        db.from("admin_push_subscriptions").select("tenant_id, enabled").in("tenant_id", tenantIds),
        db.from("orders").select("tenant_id, status").in("tenant_id", tenantIds),
        db.from("notification_events").select("tenant_id, event_type, status, channel").in("tenant_id", tenantIds).eq("channel", "email"),
      ]);
      settingsRows = (settingsResult.data || []) as SettingsRow[];
      ownerUsers = (usersResult.data || []) as TenantUserRow[];
      categoryRows = (categoriesResult.data || []) as CategoryRow[];
      productRows = (productsResult.data || []) as ProductRow[];
      pushRows = (pushResult.data || []) as PushRow[];
      orderRows = (ordersResult.data || []) as OrderRow[];
      emailRows = ((emailResult.data || []) as EventRow[]).filter(isOnboardingEmail);
    }

    const settingsByTenant = new Map(settingsRows.map((settings) => [settings.tenant_id, settings]));
    const ownerByTenant = new Map<string, TenantUserRow>();
    for (const user of ownerUsers) if (!ownerByTenant.has(user.tenant_id)) ownerByTenant.set(user.tenant_id, user);

    const categoriesByTenant = new Map<string, number>();
    for (const category of categoryRows) increment(categoriesByTenant, category.tenant_id);

    const productsByTenant = new Map<string, number>();
    const activeProductsByTenant = new Map<string, number>();
    const imageProductsByTenant = new Map<string, number>();
    for (const product of productRows) {
      increment(productsByTenant, product.tenant_id);
      if (product.is_active !== false) increment(activeProductsByTenant, product.tenant_id);
      if (product.image_url) increment(imageProductsByTenant, product.tenant_id);
    }

    const pushByTenant = new Map<string, number>();
    for (const push of pushRows) if (push.enabled === true) increment(pushByTenant, push.tenant_id);

    const ordersByTenant = new Map<string, number>();
    for (const order of orderRows) increment(ordersByTenant, order.tenant_id);

    const emailSentByTenant = new Map<string, number>();
    const emailFailedByTenant = new Map<string, number>();
    for (const event of emailRows) {
      if (!event.tenant_id) continue;
      if (event.status === "sent") increment(emailSentByTenant, event.tenant_id);
      if (event.status === "failed") increment(emailFailedByTenant, event.tenant_id);
    }

    const stores = tenantRows.map((tenant) => {
      const settings = settingsByTenant.get(tenant.id) || null;
      const owner = ownerByTenant.get(tenant.id) || null;
      const categoryCount = categoriesByTenant.get(tenant.id) || 0;
      const productCount = productsByTenant.get(tenant.id) || 0;
      const activeProductCount = activeProductsByTenant.get(tenant.id) || 0;
      const imageProductCount = imageProductsByTenant.get(tenant.id) || 0;
      const adminPushDevices = pushByTenant.get(tenant.id) || 0;
      const orderCount = ordersByTenant.get(tenant.id) || 0;
      const emailSentCount = emailSentByTenant.get(tenant.id) || 0;
      const emailFailedCount = emailFailedByTenant.get(tenant.id) || 0;
      const hasSettings = Boolean(settings);
      const hasOwnerLogin = Boolean(owner?.email);
      const hasBranding = Boolean(settings?.logo_url || settings?.primary_color || settings?.accent_color);
      const hasLogo = Boolean(settings?.logo_url);
      const hasCurrency = Boolean(settings?.currency_code || settings?.currency_symbol);
      const hasContact = Boolean(settings?.contact_phone || settings?.contact_email || settings?.contact_whatsapp);
      const hasCategories = categoryCount > 0;
      const hasProducts = productCount > 0;
      const hasActiveProducts = activeProductCount > 0;
      const hasProductPhotos = imageProductCount > 0;
      const hasAdminPush = adminPushDevices > 0;
      const hasTestOrder = orderCount > 0;
      const hasLaunchEmail = emailSentCount > 0 && emailFailedCount === 0;
      const trial = calculateTenantTrialState(tenant);
      const checks = [
        { key: "foundation", label: "Store foundation", ready: hasSettings && hasCategories, important: true, detail: hasSettings ? `${categoryCount} categories` : "Settings row missing" },
        { key: "owner-login", label: "Owner login", ready: hasOwnerLogin, important: true, detail: hasOwnerLogin ? owner?.email || "Owner email saved" : "No owner login found" },
        { key: "currency", label: "Currency", ready: hasCurrency, important: true, detail: hasCurrency ? [settings?.currency_code, settings?.currency_symbol].filter(Boolean).join(" / ") : "Currency not set" },
        { key: "products", label: "Menu products", ready: hasProducts && hasActiveProducts, important: true, detail: `${activeProductCount} active / ${productCount} total` },
        { key: "branding", label: "Branding", ready: hasBranding, important: false, detail: hasLogo ? "Logo uploaded" : hasBranding ? "Colours set" : "Logo/colours still default" },
        { key: "product-photos", label: "Product photos", ready: hasProductPhotos, important: false, detail: `${imageProductCount} products with photos` },
        { key: "contact", label: "Contact details", ready: hasContact, important: false, detail: hasContact ? "Contact details present" : "No phone/email/WhatsApp saved" },
        { key: "admin-push", label: "Admin push", ready: hasAdminPush, important: false, detail: hasAdminPush ? `${adminPushDevices} enabled device(s)` : "No enabled admin push device" },
        { key: "test-order", label: "Test order", ready: hasTestOrder, important: false, detail: hasTestOrder ? `${orderCount} order(s) recorded` : "No test order yet" },
        { key: "launch-email", label: "Launch email", ready: hasLaunchEmail, important: false, detail: emailFailedCount ? `${emailFailedCount} email issue(s)` : emailSentCount ? `${emailSentCount} sent email event(s)` : "No onboarding email event" },
      ];
      const readyCount = checks.filter((check) => check.ready).length;
      const blockingIssues = checks.filter((check) => check.important && !check.ready).length;
      const score = Math.round((readyCount / checks.length) * 100);
      const label = readinessLabel(score, blockingIssues);
      return { id: tenant.id, name: tenant.name, slug: tenant.slug, status: tenant.status || "setup", createdAt: tenant.created_at, trial, storeAddress: storeAddress(tenant.slug), storefrontUrl: storeUrl(tenant.slug), adminLoginUrl: adminLoginUrl(tenant.slug), readiness: { score, label, tone: readinessTone(label), readyCount, totalChecks: checks.length, blockingIssues }, counts: { categories: categoryCount, products: productCount, activeProducts: activeProductCount, productPhotos: imageProductCount, adminPushDevices, orders: orderCount, emailSent: emailSentCount, emailFailed: emailFailedCount }, checks };
    });

    return NextResponse.json({
      stores,
      summary: {
        totalStores: stores.length,
        readyStores: stores.filter((store) => store.readiness.label === "Ready").length,
        nearlyReadyStores: stores.filter((store) => store.readiness.label === "Nearly ready").length,
        needsSetupStores: stores.filter((store) => store.readiness.label === "Needs setup").length,
        missingProducts: stores.filter((store) => store.counts.activeProducts === 0).length,
        missingAdminPush: stores.filter((store) => store.counts.adminPushDevices === 0).length,
        trialActiveStores: stores.filter((store) => store.trial?.isTrialActive).length,
        trialExpiringStores: stores.filter((store) => store.trial?.isTrialActive && (store.trial.trialDaysRemaining ?? 99) <= 2).length,
        trialExpiredStores: stores.filter((store) => store.trial?.isTrialExpired).length,
        payingClients: stores.filter((store) => store.trial?.isSubscriptionActive || store.trial?.subscriptionStatus === "active" || store.trial?.trialStatus === "converted").length,
        checkoutPausedStores: stores.filter((store) => store.trial?.checkoutBlocked || store.trial?.isTrialExpired).length,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load store readiness";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
