export const DEFAULT_PUBLIC_AFFILIATE_REWARD_RATE_PERCENT = 10;
export const DEFAULT_AFFILIATE_REFERRING_TENANT_REWARD_RATE_PERCENT = 5;

export function normaliseAffiliateCode(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function normaliseAffiliateEmail(value: unknown) {
  return String(value || "").trim().toLowerCase().slice(0, 180);
}

export function looksLikeAffiliateEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function safeAffiliateText(value: unknown, maxLength = 500) {
  const text = String(value || "").trim();
  return text ? text.slice(0, maxLength) : null;
}

export function buildAffiliateCode(name: unknown, email: unknown) {
  const namePart = String(name || "affiliate")
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 28) || "affiliate";
  const emailPart = String(email || "")
    .trim()
    .toLowerCase()
    .split("@")[0]
    ?.replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 18) || "partner";
  const suffix = Math.random().toString(36).slice(2, 7);
  return normaliseAffiliateCode(`aff_${namePart}_${emailPart}_${suffix}`);
}

export function buildAffiliateAccessKey() {
  const first = Math.random().toString(36).slice(2, 8).toUpperCase();
  const second = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `ORD-${first}-${second}`;
}

export function buildAffiliateShareUrl(trackingCode: string) {
  const clean = normaliseAffiliateCode(trackingCode);
  return `https://www.orduva.com/?aff=${encodeURIComponent(clean)}&ref=${encodeURIComponent(clean)}&ref_source=affiliate_partner`;
}
