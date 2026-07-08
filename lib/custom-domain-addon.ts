import { formatPlanPrice, getPricingCurrency, type PricingCurrencyCode } from "@/lib/pricing";

export type CustomDomainStatus =
  | "requested"
  | "billing_pending"
  | "pending_dns"
  | "pending_owner_review"
  | "approved"
  | "active"
  | "rejected"
  | "disabled";

export type CustomDomainBillingStatus =
  | "not_started"
  | "addon_pending"
  | "active"
  | "past_due"
  | "cancelled"
  | "manual";

export const CUSTOM_DOMAIN_ADDON_USD_MONTHLY = 5;

export const CUSTOM_DOMAIN_ADDON_MONTHLY: Record<PricingCurrencyCode, number> = {
  ZAR: 95,
  KES: 650,
  GBP: 4,
  USD: 5,
  EUR: 5,
};

export const CUSTOM_DOMAIN_DNS_TARGET = "orduva.com";

export function normaliseCustomDomain(value: unknown) {
  let text = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^\/\//, "")
    .split("/")[0]
    .split("?")[0]
    .replace(/:\d+$/, "")
    .replace(/\.$/, "");

  if (text.startsWith("www.")) text = text.slice(4);
  return text.slice(0, 253);
}

export function isValidCustomDomain(value: unknown) {
  const domain = normaliseCustomDomain(value);
  if (!domain || domain === "orduva.com" || domain.endsWith(".orduva.com")) return false;
  if (!domain.includes(".")) return false;
  if (domain.length > 253) return false;
  return domain
    .split(".")
    .every((part) => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(part));
}

export function customDomainAddonPrice(currencyCode: unknown) {
  const currency = getPricingCurrency(String(currencyCode || "USD"));
  const amount = CUSTOM_DOMAIN_ADDON_MONTHLY[currency.code] ?? CUSTOM_DOMAIN_ADDON_MONTHLY.USD;
  return {
    currencyCode: currency.code,
    amount,
    formatted: formatPlanPrice(amount, currency.code, { forceDecimals: currency.decimalPlaces > 0 }),
    label: `${formatPlanPrice(amount, currency.code, { forceDecimals: currency.decimalPlaces > 0 })} / month`,
  };
}

export function customDomainStripePriceEnvKey(currencyCode: PricingCurrencyCode) {
  return `STRIPE_PRICE_CUSTOM_DOMAIN_${currencyCode}_MONTHLY`;
}

export function customDomainVerificationToken(tenantSlug: string, domain: string) {
  const cleanTenant = String(tenantSlug || "store").toLowerCase().replace(/[^a-z0-9-]/g, "-");
  const cleanDomain = normaliseCustomDomain(domain).replace(/[^a-z0-9]+/g, "-").slice(0, 48);
  return `orduva-domain-${cleanTenant}-${cleanDomain}`.slice(0, 120);
}
