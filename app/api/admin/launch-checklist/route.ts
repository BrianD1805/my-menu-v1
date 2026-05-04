import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveAdminTenant } from "@/lib/admin-tenant";

type ChecklistDefinition = {
  key: string;
  title: string;
  body: string;
  actionLabel: string;
  actionHref: string;
  auto: boolean;
};

const CHECKLIST_ITEMS: ChecklistDefinition[] = [
  {
    key: "signin",
    title: "Sign in to admin",
    body: "You are signed in and ready to finish setting up your store.",
    actionLabel: "Open admin home",
    actionHref: "/admin",
    auto: true,
  },
  {
    key: "categories_added",
    title: "Add your first category",
    body: "Create at least one category so customers can browse your menu or catalogue clearly.",
    actionLabel: "Open categories",
    actionHref: "/admin/categories",
    auto: true,
  },
  {
    key: "products_added",
    title: "Add your first product",
    body: "Add at least one product with a price so the store starts to feel real.",
    actionLabel: "Open products",
    actionHref: "/admin/products",
    auto: true,
  },
  {
    key: "product_photos",
    title: "Add product photos",
    body: "Upload at least one product photo, or manually tick this if your store will launch without photos.",
    actionLabel: "Open products",
    actionHref: "/admin/products",
    auto: true,
  },
  {
    key: "branding_checked",
    title: "Check logo, colours, contact details and currency",
    body: "Open Settings and make sure the store looks and reads like your business.",
    actionLabel: "Open settings",
    actionHref: "/admin/settings",
    auto: false,
  },
  {
    key: "admin_installed",
    title: "Install Orduva Admin on your phone",
    body: "Use the install tool when you are ready, then tick this off once admin is easy to open on your phone.",
    actionLabel: "Open install tools",
    actionHref: "/admin#setup-tools",
    auto: false,
  },
  {
    key: "push_tested",
    title: "Enable and test new-order alerts",
    body: "Turn on admin push notifications and send a test alert before taking live orders.",
    actionLabel: "Open alert tools",
    actionHref: "/admin#setup-tools",
    auto: true,
  },
  {
    key: "test_order_placed",
    title: "Place one test order",
    body: "Use your storefront like a customer and confirm that the order appears in admin.",
    actionLabel: "Open orders",
    actionHref: "/admin/orders",
    auto: true,
  },
  {
    key: "store_shared",
    title: "Share your store address",
    body: "Once everything is checked, share the store address with customers.",
    actionLabel: "Open storefront",
    actionHref: "storefront",
    auto: false,
  },
];

const SPECIAL_KEYS = new Set(["__collapsed", "__dismissed"]);
const VALID_KEYS = new Set([...CHECKLIST_ITEMS.map((item) => item.key), ...SPECIAL_KEYS]);

function isCompleteStatus(value: unknown) {
  return String(value || "").toLowerCase() === "complete";
}

async function upsertChecklistRow({
  tenantId,
  key,
  title,
  status,
  completedBy,
  metadata,
}: {
  tenantId: string;
  key: string;
  title: string;
  status: "pending" | "complete";
  completedBy?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const completedAt = status === "complete" ? new Date().toISOString() : null;
  await db.from("tenant_launch_checklists").upsert(
    {
      tenant_id: tenantId,
      checklist_key: key,
      title,
      status,
      completed_at: completedAt,
      completed_by: status === "complete" ? completedBy || null : null,
      metadata: metadata || {},
      updated_at: new Date().toISOString(),
    },
    { onConflict: "tenant_id,checklist_key" }
  );
}

export async function GET(req: Request) {
  const tenantLookup = await resolveAdminTenant(req);
  if (!tenantLookup.ok) return tenantLookup.error;
  const { tenant, user } = tenantLookup;

  const [{ count: categoryCount }, { count: productCount }, { count: photoCount }, { count: pushCount }, { count: orderCount }, settingsResult, rowsResult] = await Promise.all([
    db.from("categories").select("id", { count: "exact", head: true }).eq("tenant_id", tenant.id),
    db.from("products").select("id", { count: "exact", head: true }).eq("tenant_id", tenant.id),
    db.from("products").select("id", { count: "exact", head: true }).eq("tenant_id", tenant.id).not("image_url", "is", null),
    db.from("admin_push_subscriptions").select("id", { count: "exact", head: true }).eq("tenant_id", tenant.id).eq("enabled", true),
    db.from("orders").select("id", { count: "exact", head: true }).eq("tenant_id", tenant.id),
    db.from("tenant_settings").select("logo_url, primary_color, accent_color, contact_phone, contact_email, contact_whatsapp, contact_address, currency_code").eq("tenant_id", tenant.id).maybeSingle(),
    db.from("tenant_launch_checklists").select("checklist_key, title, status, completed_at, completed_by, metadata").eq("tenant_id", tenant.id),
  ]);

  if (rowsResult.error) {
    return NextResponse.json({ error: "Failed to load launch checklist progress" }, { status: 500 });
  }

  const existing = new Map<string, any>();
  for (const row of rowsResult.data || []) existing.set(row.checklist_key, row);

  const settings = settingsResult.data || null;
  const brandingLooksStarted = Boolean(
    settings?.logo_url || settings?.primary_color || settings?.accent_color || settings?.contact_phone || settings?.contact_email || settings?.contact_whatsapp || settings?.contact_address || settings?.currency_code
  );

  const autoCompleteByKey: Record<string, boolean> = {
    signin: true,
    categories_added: (categoryCount || 0) > 0,
    products_added: (productCount || 0) > 0,
    product_photos: (photoCount || 0) > 0,
    branding_checked: false,
    admin_installed: false,
    push_tested: (pushCount || 0) > 0,
    test_order_placed: (orderCount || 0) > 0,
    store_shared: false,
  };

  const saveAutoRows = CHECKLIST_ITEMS.filter((item) => item.auto && autoCompleteByKey[item.key] && !isCompleteStatus(existing.get(item.key)?.status)).map((item) =>
    upsertChecklistRow({
      tenantId: tenant.id,
      key: item.key,
      title: item.title,
      status: "complete",
      completedBy: user.email || null,
      metadata: { source: "auto", detectedAt: new Date().toISOString() },
    })
  );
  if (saveAutoRows.length) await Promise.all(saveAutoRows);

  const collapsed = isCompleteStatus(existing.get("__collapsed")?.status);
  const dismissed = isCompleteStatus(existing.get("__dismissed")?.status);

  const items = CHECKLIST_ITEMS.map((item) => {
    const row = existing.get(item.key);
    const autoComplete = Boolean(autoCompleteByKey[item.key]);
    const manualComplete = isCompleteStatus(row?.status);
    const complete = autoComplete || manualComplete;
    return {
      ...item,
      status: complete ? "complete" : "pending",
      autoComplete,
      manualComplete,
      completedAt: row?.completed_at || null,
      completedBy: row?.completed_by || null,
    };
  });

  return NextResponse.json({
    tenant: {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      storefrontUrl: `https://${tenant.slug}.orduva.com`,
    },
    collapsed,
    dismissed,
    items,
    diagnostics: {
      categories: categoryCount || 0,
      products: productCount || 0,
      productPhotos: photoCount || 0,
      adminPushDevices: pushCount || 0,
      orders: orderCount || 0,
      brandingLooksStarted,
    },
  });
}

export async function PATCH(req: Request) {
  try {
    const tenantLookup = await resolveAdminTenant(req);
    if (!tenantLookup.ok) return tenantLookup.error;
    const { tenant, user } = tenantLookup;

    const body = await req.json();
    const checklistKey = String(body?.checklistKey || "").trim();
    const rawStatus = String(body?.status || "").trim().toLowerCase();
    const status = rawStatus === "complete" ? "complete" : "pending";

    if (!VALID_KEYS.has(checklistKey)) {
      return NextResponse.json({ error: "Unknown checklist item" }, { status: 400 });
    }

    const definition = CHECKLIST_ITEMS.find((item) => item.key === checklistKey);
    const title = definition?.title || (checklistKey === "__collapsed" ? "Checklist collapsed" : "Checklist hidden");

    await upsertChecklistRow({
      tenantId: tenant.id,
      key: checklistKey,
      title,
      status,
      completedBy: user.email || null,
      metadata: { source: "manual", updatedAt: new Date().toISOString() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update launch checklist";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
