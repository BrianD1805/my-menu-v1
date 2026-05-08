import { NextResponse } from "next/server";
import { requirePlatformAccess } from "@/lib/platform-security";
import { db } from "@/lib/db";

const CONFIRMATION_PHRASE = "DELETE ALL";
const TENANT_ASSETS_BUCKET = "tenant-assets";
const PRODUCT_IMAGES_BUCKET = "product-images";

type TenantDeleteRow = { id: string; name: string | null; slug: string | null };
type DeleteStep = { label: string; count: number; warning?: string };

function uniqueIds(values: unknown[]) {
  return Array.from(
    new Set(values.map((value) => String(value || "").trim()).filter(Boolean)),
  );
}

async function selectIds(table: string, column: string, tenantIds: string[]) {
  if (!tenantIds.length) return [];
  const { data, error } = await db
    .from(table)
    .select("id")
    .in(column, tenantIds);
  if (error) throw new Error(`Could not inspect ${table}: ${error.message}`);
  return uniqueIds(
    ((data || []) as Array<{ id?: string }>).map((row) => row.id),
  );
}

async function deleteWhereIn(
  table: string,
  column: string,
  values: string[],
  label: string,
  steps: DeleteStep[],
) {
  const cleanValues = uniqueIds(values);
  if (!cleanValues.length) {
    steps.push({ label, count: 0 });
    return 0;
  }
  const { count, error } = await db
    .from(table)
    .delete({ count: "exact" })
    .in(column, cleanValues);
  if (error) throw new Error(`Could not delete ${label}: ${error.message}`);
  const deleted = count || 0;
  steps.push({ label, count: deleted });
  return deleted;
}

async function deleteReferralRows(tenantIds: string[], steps: DeleteStep[]) {
  if (!tenantIds.length) return;

  const { data: sources, error: sourceError } = await db
    .from("referral_sources")
    .select("id")
    .in("referrer_tenant_id", tenantIds);
  if (sourceError)
    throw new Error(
      `Could not inspect referral sources: ${sourceError.message}`,
    );
  const sourceIds = uniqueIds(
    ((sources || []) as Array<{ id?: string }>).map((row) => row.id),
  );

  let signupIds: string[] = [];
  if (sourceIds.length) {
    const { data, error } = await db
      .from("referral_signups")
      .select("id")
      .in("referral_source_id", sourceIds);
    if (error)
      throw new Error(
        `Could not inspect referral signups by source: ${error.message}`,
      );
    signupIds = signupIds.concat(
      uniqueIds(((data || []) as Array<{ id?: string }>).map((row) => row.id)),
    );
  }
  const { data: referredSignups, error: referredSignupError } = await db
    .from("referral_signups")
    .select("id")
    .in("referred_tenant_id", tenantIds);
  if (referredSignupError)
    throw new Error(
      `Could not inspect referred signups: ${referredSignupError.message}`,
    );
  const referredSignupIds = uniqueIds(
    ((referredSignups || []) as Array<{ id?: string }>).map((row) => row.id),
  );
  signupIds = uniqueIds(signupIds.concat(referredSignupIds));

  let rewardIds: string[] = [];
  for (const lookup of [
    { column: "referrer_tenant_id", values: tenantIds },
    { column: "referred_tenant_id", values: tenantIds },
    { column: "referral_signup_id", values: signupIds },
    { column: "referral_source_id", values: sourceIds },
  ]) {
    if (!lookup.values.length) continue;
    const { data, error } = await db
      .from("referral_rewards")
      .select("id")
      .in(lookup.column, lookup.values);
    if (error)
      throw new Error(`Could not inspect referral rewards: ${error.message}`);
    rewardIds = rewardIds.concat(
      uniqueIds(((data || []) as Array<{ id?: string }>).map((row) => row.id)),
    );
  }
  rewardIds = uniqueIds(rewardIds);

  await deleteWhereIn(
    "referral_reward_credits",
    "reward_rule_id",
    rewardIds,
    "referral credit ledger rows",
    steps,
  );
  await deleteWhereIn(
    "referral_reward_credits",
    "referral_signup_id",
    signupIds,
    "referral credit signup links",
    steps,
  );
  await deleteWhereIn(
    "referral_reward_credits",
    "referrer_tenant_id",
    tenantIds,
    "referral credits earned by deleted stores",
    steps,
  );
  await deleteWhereIn(
    "referral_reward_credits",
    "referred_tenant_id",
    tenantIds,
    "referral credits for deleted stores",
    steps,
  );

  await deleteWhereIn(
    "tenant_subscription_payments",
    "referral_reward_id",
    rewardIds,
    "subscription payments linked to deleted referral rewards",
    steps,
  );
  await deleteWhereIn(
    "tenant_subscription_payments",
    "referral_signup_id",
    signupIds,
    "subscription payments linked to deleted referral signups",
    steps,
  );
  await deleteWhereIn(
    "tenant_subscription_payments",
    "tenant_id",
    tenantIds,
    "tenant subscription payments",
    steps,
  );

  await deleteWhereIn(
    "referral_rewards",
    "id",
    rewardIds,
    "referral reward rules",
    steps,
  );
  await deleteWhereIn(
    "referral_signups",
    "id",
    signupIds,
    "referral signup records",
    steps,
  );
  await deleteWhereIn(
    "referral_sources",
    "id",
    sourceIds,
    "tenant referral source records",
    steps,
  );
}

async function listStoragePaths(
  bucket: string,
  prefix: string,
): Promise<string[]> {
  const { data, error } = await db.storage
    .from(bucket)
    .list(prefix, { limit: 1000 });
  if (error) {
    const message = error.message || "Storage list failed";
    if (
      message.toLowerCase().includes("not found") ||
      message.toLowerCase().includes("does not exist")
    )
      return [];
    throw new Error(`Could not inspect ${bucket}/${prefix}: ${message}`);
  }
  const entries = data || [];
  const paths: string[] = [];
  for (const entry of entries) {
    const childPath = `${prefix}/${entry.name}`;
    // Supabase folders are represented by entries without an id/metadata in most clients.
    if (
      (entry as { id?: string | null }).id ||
      (entry as { metadata?: unknown }).metadata
    ) {
      paths.push(childPath);
    } else {
      paths.push(...(await listStoragePaths(bucket, childPath)));
    }
  }
  return paths;
}

async function removeStoragePrefix(
  bucket: string,
  slug: string,
  steps: DeleteStep[],
) {
  if (!slug) return;
  try {
    const paths = await listStoragePaths(bucket, slug);
    if (!paths.length) {
      steps.push({ label: `${bucket} storage objects for ${slug}`, count: 0 });
      return;
    }
    const { error } = await db.storage.from(bucket).remove(paths);
    if (error) throw error;
    steps.push({
      label: `${bucket} storage objects for ${slug}`,
      count: paths.length,
    });
  } catch (error) {
    steps.push({
      label: `${bucket} storage cleanup for ${slug}`,
      count: 0,
      warning:
        error instanceof Error ? error.message : "Storage cleanup warning",
    });
  }
}

export async function POST(req: Request) {
  const accessError = await requirePlatformAccess(req);
  if (accessError) return accessError;

  try {
    const body = await req.json().catch(() => ({}));
    const tenantIds = uniqueIds(
      Array.isArray(body?.tenantIds) ? body.tenantIds : [],
    );
    const confirmation = String(body?.confirmation || "").trim();

    if (!tenantIds.length)
      return NextResponse.json(
        { error: "Select at least one store to delete." },
        { status: 400 },
      );
    if (tenantIds.length > 25)
      return NextResponse.json(
        { error: "Please delete a maximum of 25 stores at a time." },
        { status: 400 },
      );
    if (confirmation !== CONFIRMATION_PHRASE) {
      return NextResponse.json(
        {
          error: `Type ${CONFIRMATION_PHRASE} in capitals to confirm deletion.`,
        },
        { status: 400 },
      );
    }

    const { data: tenants, error: tenantError } = await db
      .from("tenants")
      .select("id, name, slug")
      .in("id", tenantIds);
    if (tenantError)
      return NextResponse.json({ error: tenantError.message }, { status: 500 });
    const tenantRows = (tenants || []) as TenantDeleteRow[];
    if (tenantRows.length !== tenantIds.length)
      return NextResponse.json(
        { error: "One or more selected stores could not be found." },
        { status: 404 },
      );

    const steps: DeleteStep[] = [];
    const slugs = tenantRows
      .map((tenant) => String(tenant.slug || "").trim())
      .filter(Boolean);

    for (const slug of slugs) {
      await removeStoragePrefix(TENANT_ASSETS_BUCKET, slug, steps);
      await removeStoragePrefix(PRODUCT_IMAGES_BUCKET, slug, steps);
    }

    const orderIds = await selectIds("orders", "tenant_id", tenantIds);
    await deleteWhereIn(
      "order_items",
      "order_id",
      orderIds,
      "order items",
      steps,
    );
    await deleteWhereIn("orders", "tenant_id", tenantIds, "orders", steps);

    await deleteReferralRows(tenantIds, steps);

    await deleteWhereIn(
      "customer_favourites",
      "tenant_id",
      tenantIds,
      "customer favourites",
      steps,
    );
    await deleteWhereIn(
      "customer_push_subscriptions",
      "tenant_id",
      tenantIds,
      "customer push subscriptions",
      steps,
    );
    await deleteWhereIn(
      "customer_accounts",
      "tenant_id",
      tenantIds,
      "customer accounts",
      steps,
    );
    await deleteWhereIn(
      "admin_push_subscriptions",
      "tenant_id",
      tenantIds,
      "admin push subscriptions",
      steps,
    );
    await deleteWhereIn(
      "notification_events",
      "tenant_id",
      tenantIds,
      "notification events",
      steps,
    );
    await deleteWhereIn(
      "tenant_launch_checklists",
      "tenant_id",
      tenantIds,
      "launch checklist records",
      steps,
    );
    await deleteWhereIn("products", "tenant_id", tenantIds, "products", steps);
    await deleteWhereIn(
      "categories",
      "tenant_id",
      tenantIds,
      "categories",
      steps,
    );
    await deleteWhereIn(
      "tenant_settings",
      "tenant_id",
      tenantIds,
      "tenant settings",
      steps,
    );
    await deleteWhereIn(
      "tenant_users",
      "tenant_id",
      tenantIds,
      "tenant users",
      steps,
    );
    await deleteWhereIn("tenants", "id", tenantIds, "tenant stores", steps);

    return NextResponse.json({
      ok: true,
      deletedStores: tenantRows.map((tenant) => ({
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
      })),
      steps,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Store deletion failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
