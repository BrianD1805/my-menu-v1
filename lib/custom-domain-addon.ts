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

export type CustomDomainDnsStatus =
  | "not_started"
  | "not_required"
  | "pending"
  | "configured"
  | "verified"
  | "failed";
export type CustomDomainNetlifyStatus =
  "not_started" | "pending" | "added" | "verified" | "failed";
export type CustomDomainSslStatus =
  "not_started" | "pending" | "issued" | "failed";

export const CUSTOM_DOMAIN_ADDON_CURRENCY = "USD" as const;
export const CUSTOM_DOMAIN_ADDON_USD_MONTHLY = 7.5;
export const CUSTOM_DOMAIN_LEGACY_DNS_TARGET = "orduva.com";
export const CUSTOM_DOMAIN_DNS_TARGET = "orduva.netlify.app";
export const CUSTOM_DOMAIN_NETLIFY_APEX_TARGET =
  "apex-loadbalancer.netlify.com";
export const CUSTOM_DOMAIN_NETLIFY_APEX_FALLBACK_A = "75.2.60.5";
export const CUSTOM_DOMAIN_STRIPE_PRICE_ENV_KEY =
  "STRIPE_PRICE_CUSTOM_DOMAIN_USD_MONTHLY";

export function formatCustomDomainUsdPrice(amount: number) {
  const parsed = Number(amount);
  const safeAmount =
    Number.isFinite(parsed) && parsed > 0
      ? parsed
      : CUSTOM_DOMAIN_ADDON_USD_MONTHLY;
  return `$${safeAmount.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export type CustomDomainAddonPrice = {
  currencyCode: typeof CUSTOM_DOMAIN_ADDON_CURRENCY;
  amount: number;
  formatted: string;
  label: string;
  stripePriceId?: string | null;
  stripePriceEnvKey: string;
};

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
  if (!domain || domain === "orduva.com" || domain.endsWith(".orduva.com"))
    return false;
  if (!domain.includes(".")) return false;
  if (domain.length > 253) return false;
  return domain
    .split(".")
    .every((part) => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(part));
}

export function customDomainAddonPrice(
  monthlyUsd: unknown = CUSTOM_DOMAIN_ADDON_USD_MONTHLY,
  stripePriceId?: string | null,
): CustomDomainAddonPrice {
  const parsed = Number(monthlyUsd);
  const amount =
    Number.isFinite(parsed) && parsed > 0
      ? parsed
      : CUSTOM_DOMAIN_ADDON_USD_MONTHLY;
  const formatted = formatCustomDomainUsdPrice(amount);
  return {
    currencyCode: CUSTOM_DOMAIN_ADDON_CURRENCY,
    amount,
    formatted,
    label: `${formatted} / month`,
    stripePriceId: stripePriceId || null,
    stripePriceEnvKey: CUSTOM_DOMAIN_STRIPE_PRICE_ENV_KEY,
  };
}

export function customDomainStripePriceEnvKey() {
  return CUSTOM_DOMAIN_STRIPE_PRICE_ENV_KEY;
}

export function customDomainEffectiveDnsTarget(value: unknown) {
  const clean = String(value || "")
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/^\/\//, "")
    .split("/")[0]
    .split("?")[0]
    .replace(/:\d+$/, "")
    .replace(/\.$/, "")
    .toLowerCase();

  if (!clean || clean === CUSTOM_DOMAIN_LEGACY_DNS_TARGET) {
    return CUSTOM_DOMAIN_DNS_TARGET;
  }
  return clean;
}

export function customDomainVerificationToken(
  tenantSlug: string,
  domain: string,
) {
  const cleanTenant = String(tenantSlug || "store")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-");
  const cleanDomain = normaliseCustomDomain(domain)
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 48);
  return `orduva-domain-${cleanTenant}-${cleanDomain}`.slice(0, 120);
}

export function customDomainDnsRecords(
  domainName: string,
  dnsTarget: string | null | undefined,
) {
  const domain = normaliseCustomDomain(domainName);
  const target = customDomainEffectiveDnsTarget(dnsTarget);
  return {
    apexHost: "@",
    apexType: "ALIAS / ANAME / flattened CNAME",
    apexValue: CUSTOM_DOMAIN_NETLIFY_APEX_TARGET,
    apexFallbackType: "Fallback A",
    apexFallbackValue: CUSTOM_DOMAIN_NETLIFY_APEX_FALLBACK_A,
    wwwHost: "www",
    wwwType: "CNAME",
    wwwValue: target,
    verificationHost: "_orduva",
    verificationType: "Optional TXT",
    displayApexDomain: domain,
    displayWwwDomain: domain ? `www.${domain}` : "www.your-domain.com",
    netlifyRoutingNote:
      "For www, use the CNAME target shown here. For the root/apex, use ALIAS/ANAME/flattened CNAME if supported, or the fallback A record only if ALIAS/ANAME is not supported. Do not add both root options.",
    verificationNote:
      "This TXT record is optional Orduva ownership/checklist verification only. It does not route the website to Netlify.",
  };
}

export function isCustomDomainActivationReady(input: {
  status?: string | null;
  billingStatus?: string | null;
  dnsApexRecordStatus?: string | null;
  dnsWwwRecordStatus?: string | null;
  netlifyAliasStatus?: string | null;
  sslCertificateStatus?: string | null;
}) {
  const billingOk =
    input.billingStatus === "active" || input.billingStatus === "manual";
  const apexOk =
    input.dnsApexRecordStatus === "verified" ||
    input.dnsApexRecordStatus === "not_required";
  const wwwOk =
    input.dnsWwwRecordStatus === "verified" ||
    input.dnsWwwRecordStatus === "not_required";
  const hasAnyDns =
    input.dnsApexRecordStatus === "verified" ||
    input.dnsWwwRecordStatus === "verified";
  const netlifyOk = input.netlifyAliasStatus === "verified";
  const sslOk = input.sslCertificateStatus === "issued";
  return Boolean(
    billingOk && apexOk && wwwOk && hasAnyDns && netlifyOk && sslOk,
  );
}

export type CustomDomainActivationCheck = {
  key: string;
  label: string;
  ready: boolean;
  fix: string;
};

export function customDomainActivationChecks(input: {
  billingStatus?: string | null;
  dnsApexRecordStatus?: string | null;
  dnsWwwRecordStatus?: string | null;
  netlifyAliasStatus?: string | null;
  sslCertificateStatus?: string | null;
}): CustomDomainActivationCheck[] {
  const billingOk =
    input.billingStatus === "active" || input.billingStatus === "manual";
  const apexOk =
    input.dnsApexRecordStatus === "verified" ||
    input.dnsApexRecordStatus === "not_required";
  const wwwOk =
    input.dnsWwwRecordStatus === "verified" ||
    input.dnsWwwRecordStatus === "not_required";
  const hasAnyDns =
    input.dnsApexRecordStatus === "verified" ||
    input.dnsWwwRecordStatus === "verified";
  const netlifyOk = input.netlifyAliasStatus === "verified";
  const sslOk = input.sslCertificateStatus === "issued";

  return [
    {
      key: "billing",
      label: "Add-on billing is active or manually approved",
      ready: billingOk,
      fix: "Mark billing active/manual after the Stripe custom-domain add-on is active or manually approved.",
    },
    {
      key: "apex-dns",
      label: "Root/apex DNS is verified or marked not required",
      ready: apexOk,
      fix: "Set Root/apex DNS to verified, or not required if this store will only use the www domain.",
    },
    {
      key: "www-dns",
      label: "WWW DNS is verified or marked not required",
      ready: wwwOk,
      fix: "Set WWW DNS to verified, or not required if this store will only use the root domain.",
    },
    {
      key: "live-dns",
      label: "At least one live DNS record is verified",
      ready: hasAnyDns,
      fix: "Verify at least one working root/apex or www DNS record before activation.",
    },
    {
      key: "netlify",
      label: "Netlify domain alias is verified",
      ready: netlifyOk,
      fix: "Add the domain alias in Netlify and mark the Netlify alias as verified.",
    },
    {
      key: "ssl",
      label: "SSL certificate is issued",
      ready: sslOk,
      fix: "Confirm the certificate is issued/valid in Netlify before activation.",
    },
  ];
}

export function customDomainActivationBlockers(input: {
  billingStatus?: string | null;
  dnsApexRecordStatus?: string | null;
  dnsWwwRecordStatus?: string | null;
  netlifyAliasStatus?: string | null;
  sslCertificateStatus?: string | null;
}) {
  return customDomainActivationChecks(input)
    .filter((check) => !check.ready)
    .map((check) => check.fix);
}
