import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const PRODUCT_IMAGE_BUCKET = "product-images";
const MAX_FILE_SIZE = 5 * 1024 * 1024;

async function getTenantId(tenantSlug: string) {
  const { data: tenant, error: tenantError } = await db
    .from("tenants")
    .select("id")
    .eq("slug", tenantSlug)
    .single();

  if (tenantError || !tenant) {
    return { error: NextResponse.json({ error: "Tenant not found" }, { status: 404 }) };
  }

  return { tenantId: tenant.id };
}

async function ensureProductBelongsToTenant(productId: string, tenantId: string) {
  const { data: existingProduct, error: productLookupError } = await db
    .from("products")
    .select("id")
    .eq("id", productId)
    .eq("tenant_id", tenantId)
    .single();

  if (productLookupError || !existingProduct) {
    return { error: NextResponse.json({ error: "Product not found" }, { status: 404 }) };
  }

  return { ok: true };
}

async function ensureBucket() {
  const { data: buckets } = await db.storage.listBuckets();
  const exists = buckets?.some((bucket) => bucket.name === PRODUCT_IMAGE_BUCKET);

  if (!exists) {
    const { error } = await db.storage.createBucket(PRODUCT_IMAGE_BUCKET, {
      public: true,
      fileSizeLimit: MAX_FILE_SIZE,
      allowedMimeTypes: ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"],
    });

    if (error && !error.message.toLowerCase().includes("already exists")) {
      throw error;
    }
  }
}

function sanitizeFilename(filename: string) {
  return filename
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tenantSlug = searchParams.get("tenantSlug");

  if (!tenantSlug) {
    return NextResponse.json({ error: "Missing tenantSlug" }, { status: 400 });
  }

  const tenantLookup = await getTenantId(tenantSlug);
  if (tenantLookup.error) return tenantLookup.error;

  const { data: products, error } = await db
    .from("products")
    .select("id, name, description, image_url, price, is_active, category_id")
    .eq("tenant_id", tenantLookup.tenantId)
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "Failed to load products" }, { status: 500 });
  }

  return NextResponse.json({ products });
}

export async function PATCH(req: Request) {
  const body = await req.json();
  const tenantSlug = body?.tenantSlug as string | undefined;
  const productId = body?.productId as string | undefined;
  const imageUrl = (body?.imageUrl as string | null | undefined) ?? null;

  if (!tenantSlug || !productId) {
    return NextResponse.json({ error: "Missing tenantSlug or productId" }, { status: 400 });
  }

  const tenantLookup = await getTenantId(tenantSlug);
  if (tenantLookup.error) return tenantLookup.error;

  const productCheck = await ensureProductBelongsToTenant(productId, tenantLookup.tenantId!);
  if (productCheck.error) return productCheck.error;

  const { data: product, error } = await db
    .from("products")
    .update({ image_url: imageUrl && imageUrl.trim() ? imageUrl.trim() : null })
    .eq("id", productId)
    .eq("tenant_id", tenantLookup.tenantId)
    .select("id, image_url")
    .single();

  if (error || !product) {
    return NextResponse.json({ error: "Failed to update product image" }, { status: 500 });
  }

  return NextResponse.json({ product });
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const tenantSlug = String(formData.get("tenantSlug") || "").trim();
    const productId = String(formData.get("productId") || "").trim();
    const file = formData.get("file");

    if (!tenantSlug || !productId || !(file instanceof File)) {
      return NextResponse.json({ error: "Missing tenantSlug, productId, or file" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "Image must be 5MB or smaller" }, { status: 400 });
    }

    const tenantLookup = await getTenantId(tenantSlug);
    if (tenantLookup.error) return tenantLookup.error;

    const productCheck = await ensureProductBelongsToTenant(productId, tenantLookup.tenantId!);
    if (productCheck.error) return productCheck.error;

    await ensureBucket();

    const fileExt = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
    const safeName = sanitizeFilename(file.name.replace(/\.[^.]+$/, "")) || "product-image";
    const objectPath = `${tenantSlug}/${productId}/${Date.now()}-${safeName}.${fileExt}`;
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await db.storage
      .from(PRODUCT_IMAGE_BUCKET)
      .upload(objectPath, fileBuffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 });
    }

    const { data: publicUrlData } = db.storage.from(PRODUCT_IMAGE_BUCKET).getPublicUrl(objectPath);
    const publicUrl = publicUrlData.publicUrl;

    const { data: product, error: updateError } = await db
      .from("products")
      .update({ image_url: publicUrl })
      .eq("id", productId)
      .eq("tenant_id", tenantLookup.tenantId)
      .select("id, image_url")
      .single();

    if (updateError || !product) {
      return NextResponse.json({ error: "Image uploaded but product update failed" }, { status: 500 });
    }

    return NextResponse.json({ product });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
