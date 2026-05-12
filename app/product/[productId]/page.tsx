import type { Metadata } from "next";
import { notFound } from "next/navigation";
import StorefrontClientLoader from "@/components/menu/StorefrontClientLoader";
import { db } from "@/lib/db";
import { getTenantBySlug, resolveTenantSlug } from "@/lib/tenant-server";
import { LIVE_VERSION } from "@/lib/version";

type PageProps = {
  params: Promise<{ productId: string }>;
};

type ProductShareRow = {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean | null;
};

function stripHtml(value: string | null | undefined) {
  return String(value || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function trimDescription(value: string, fallback: string) {
  const clean = value || fallback;
  return clean.length > 155 ? `${clean.slice(0, 152).trim()}...` : clean;
}

function absoluteImageUrl(value: string | null | undefined, origin: string) {
  const image = String(value || "").trim();
  if (!image) return null;
  if (/^https?:\/\//i.test(image)) return image;
  if (image.startsWith("/")) return `${origin}${image}`;
  return null;
}

async function getSharedProduct(productId: string) {
  const tenantSlug = await resolveTenantSlug();
  const tenant = await getTenantBySlug(tenantSlug);
  const { data } = await db
    .from("products")
    .select("id, tenant_id, name, description, image_url, is_active")
    .eq("id", productId)
    .eq("tenant_id", tenant.id)
    .maybeSingle();

  return { tenantSlug, tenant, product: (data as ProductShareRow | null) || null };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { productId } = await params;
  const { tenantSlug, tenant, product } = await getSharedProduct(productId);
  const origin = `https://${tenantSlug}.orduva.com`;
  const url = `${origin}/product/${encodeURIComponent(productId)}`;

  if (!product || product.is_active === false) {
    const title = `${tenant.name} menu`;
    const description = `View the ${tenant.name} menu and order online.`;
    return {
      title,
      description,
      metadataBase: new URL(origin),
      openGraph: { title, description, url, type: "website" },
      twitter: { card: "summary", title, description },
    };
  }

  const title = `${product.name} | ${tenant.name}`;
  const description = trimDescription(stripHtml(product.description), `View ${product.name} on the ${tenant.name} menu.`);
  const imageUrl = absoluteImageUrl(product.image_url, origin);

  return {
    title,
    description,
    metadataBase: new URL(origin),
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      images: imageUrl ? [{ url: imageUrl, alt: product.name }] : undefined,
    },
    twitter: {
      card: imageUrl ? "summary_large_image" : "summary",
      title,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
  };
}

export default async function SharedProductPage({ params }: PageProps) {
  const { productId } = await params;
  const { tenantSlug, product } = await getSharedProduct(productId);

  if (!product || product.is_active === false) notFound();

  return <StorefrontClientLoader tenantSlug={tenantSlug} version={LIVE_VERSION} initialProductId={product.id} />;
}
