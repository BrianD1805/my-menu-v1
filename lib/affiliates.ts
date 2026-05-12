export const DEFAULT_PUBLIC_AFFILIATE_REWARD_RATE_PERCENT = 10;
export const DEFAULT_AFFILIATE_REFERRING_TENANT_REWARD_RATE_PERCENT = 5;

export const AFFILIATE_PAYOUT_CURRENCIES = [
  { code: "ZAR", label: "South African Rand", regionLabel: "South Africa" },
  { code: "KES", label: "Kenyan Shilling", regionLabel: "Kenya" },
  { code: "GBP", label: "British Pound", regionLabel: "United Kingdom" },
  { code: "USD", label: "US Dollar", regionLabel: "United States of America" },
  { code: "EUR", label: "Euro", regionLabel: "Europe" },
  { code: "AUD", label: "Australian Dollar", regionLabel: "Australia" },
  { code: "NZD", label: "New Zealand dollar", regionLabel: "New Zealand" },
] as const;

export const AFFILIATE_EARNING_REGIONS = [
  "South Africa",
  "Kenya",
  "United Kingdom",
  "Europe",
  "United States of America",
  "Australia",
  "New Zealand",
  "Other",
] as const;

export type AffiliatePayoutCurrencyCode = (typeof AFFILIATE_PAYOUT_CURRENCIES)[number]["code"];

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

export function normaliseAffiliatePayoutCurrency(value: unknown) {
  const clean = String(value || "").trim().toUpperCase();
  return AFFILIATE_PAYOUT_CURRENCIES.some((currency) => currency.code === clean) ? clean : "GBP";
}

export function affiliatePayoutCurrencyLabel(value: unknown) {
  const code = normaliseAffiliatePayoutCurrency(value);
  const match = AFFILIATE_PAYOUT_CURRENCIES.find((currency) => currency.code === code);
  return match ? `${match.code} — ${match.label}` : code;
}

export function normaliseAffiliateEarningRegion(value: unknown, otherValue?: unknown) {
  const clean = String(value || "").trim();
  if (!clean) return null;
  const match = AFFILIATE_EARNING_REGIONS.find((region) => region.toLowerCase() === clean.toLowerCase());
  if (match === "Other") return safeAffiliateText(otherValue, 120) || "Other";
  return match || "Other";
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
