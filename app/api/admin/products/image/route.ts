import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getTenantProductForAdmin, resolveAdminTenant } from "@/lib/admin-tenant";

const PRODUCT_IMAGE_BUCKET = "product-images";
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";

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

function getStorageObjectPathFromPublicUrl(imageUrl: string | null | undefined) {
  const value = (imageUrl || "").trim();
  if (!value || !supabaseUrl) return null;

  const publicBase = `${supabaseUrl}/storage/v1/object/public/${PRODUCT_IMAGE_BUCKET}/`;
  if (!value.startsWith(publicBase)) return null;

  const objectPath = value.slice(publicBase.length);
  return objectPath || null;
}

async function deleteStorageObjectIfManaged(imageUrl: string | null | undefined) {
  const objectPath = getStorageObjectPathFromPublicUrl(imageUrl);
  if (!objectPath) return;

  const { error } = await db.storage.from(PRODUCT_IMAGE_BUCKET).remove([objectPath]);
  if (error && !error.message.toLowerCase().includes("not found")) {
    throw error;
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const productId = String(body?.productId || "").trim();
    const imageUrl = (body?.imageUrl as string | null | undefined) ?? null;
    const normalizedImageUrl = imageUrl && imageUrl.trim() ? imageUrl.trim() : null;

    if (!productId) {
      return NextResponse.json({ error: "Missing productId" }, { status: 400 });
    }

    const tenantLookup = await resolveAdminTenant(req);
    if (tenantLookup.error) return tenantLookup.error;
    const tenant = tenantLookup.tenant!;

    const productLookup = await getTenantProductForAdmin(productId, tenant.id);
    if (productLookup.error) return productLookup.error;

    const previousImageUrl = productLookup.product?.image_url || null;

    const { data: product, error } = await db
      .from("products")
      .update({ image_url: normalizedImageUrl })
      .eq("id", productId)
      .eq("tenant_id", tenant.id)
      .select("id, image_url")
      .single();

    if (error || !product) {
      return NextResponse.json({ error: "Failed to update product image" }, { status: 500 });
    }

    if (previousImageUrl && previousImageUrl !== normalizedImageUrl) {
      await deleteStorageObjectIfManaged(previousImageUrl);
    }

    return NextResponse.json({ product });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update product image";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const productId = String(formData.get("productId") || "").trim();
    const file = formData.get("file");

    if (!productId || !(file instanceof File)) {
      return NextResponse.json({ error: "Missing productId or file" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "Image must be 5MB or smaller" }, { status: 400 });
    }

    const tenantLookup = await resolveAdminTenant(req);
    if (tenantLookup.error) return tenantLookup.error;
    const tenant = tenantLookup.tenant!;

    const productLookup = await getTenantProductForAdmin(productId, tenant.id);
    if (productLookup.error) return productLookup.error;

    await ensureBucket();

    const fileExt = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
    const safeName = sanitizeFilename(file.name.replace(/\.[^.]+$/, "")) || "product-image";
    const objectPath = `${tenant.slug}/${productId}/${Date.now()}-${safeName}.${fileExt}`;
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
    const previousImageUrl = productLookup.product?.image_url || null;

    const { data: product, error: updateError } = await db
      .from("products")
      .update({ image_url: publicUrl })
      .eq("id", productId)
      .eq("tenant_id", tenant.id)
      .select("id, image_url")
      .single();

    if (updateError || !product) {
      return NextResponse.json({ error: "Image uploaded but product update failed" }, { status: 500 });
    }

    if (previousImageUrl && previousImageUrl !== publicUrl) {
      await deleteStorageObjectIfManaged(previousImageUrl);
    }

    return NextResponse.json({ product });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
