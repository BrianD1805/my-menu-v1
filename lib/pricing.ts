export type PricingCurrencyCode = "ZAR" | "KES" | "GBP" | "USD" | "EUR";
export type BillingInterval = "monthly" | "yearly";
export type PricingPlanCode = "starter" | "growth" | "pro";

export type PricingCurrency = {
  code: PricingCurrencyCode;
  countryCode: "ZA" | "KE" | "GB" | "US" | "EU";
  label: string;
  shortLabel: string;
  symbol: string;
  symbolPosition: "before" | "after";
  suffix?: string;
  decimalPlaces: number;
  stripeFriendly: boolean;
};

export type PricingPlan = {
  code: PricingPlanCode;
  name: string;
  productLimitLabel: string;
  productLimit: number | null;
  description: string;
  highlight?: string;
  monthly: Record<PricingCurrencyCode, number>;
};

export const PRICING_CURRENCIES: PricingCurrency[] = [
  { code: "ZAR", countryCode: "ZA", label: "South African Rand", shortLabel: "South Africa", symbol: "R", symbolPosition: "before", decimalPlaces: 0, stripeFriendly: true },
  { code: "KES", countryCode: "KE", label: "Kenyan Shilling", shortLabel: "Kenya", symbol: "KES", symbolPosition: "before", suffix: "/-", decimalPlaces: 0, stripeFriendly: true },
  { code: "GBP", countryCode: "GB", label: "British Pound", shortLabel: "United Kingdom", symbol: "£", symbolPosition: "before", decimalPlaces: 2, stripeFriendly: true },
  { code: "USD", countryCode: "US", label: "US Dollar", shortLabel: "United States", symbol: "$", symbolPosition: "before", decimalPlaces: 0, stripeFriendly: true },
  { code: "EUR", countryCode: "EU", label: "Euro", shortLabel: "Europe", symbol: "€", symbolPosition: "before", decimalPlaces: 2, stripeFriendly: true },
];

export const PRICING_PLANS: PricingPlan[] = [
  {
    code: "starter",
    name: "Starter",
    productLimitLabel: "25 product store",
    productLimit: 25,
    description: "A polished online store for smaller menus, cafés, home sellers and simple product ranges.",
    monthly: { ZAR: 125, KES: 1025, GBP: 6, USD: 8, EUR: 7 },
  },
  {
    code: "growth",
    name: "Growth",
    productLimitLabel: "50 product store",
    productLimit: 50,
    description: "More space for growing stores with a wider catalogue, regular updates and more customer choice.",
    highlight: "Most popular",
    monthly: { ZAR: 225, KES: 1665, GBP: 9.5, USD: 13, EUR: 11 },
  },
  {
    code: "pro",
    name: "Pro",
    productLimitLabel: "100+ product store",
    productLimit: null,
    description: "For larger stores that need a fuller catalogue and more room to grow without feeling boxed in.",
    monthly: { ZAR: 325, KES: 2450, GBP: 14, USD: 19, EUR: 16 },
  },
];

export const DEFAULT_PRICING_CURRENCY: PricingCurrencyCode = "ZAR";
export const DEFAULT_PRICING_PLAN: PricingPlanCode = "starter";
export const YEARLY_DISCOUNT_PERCENT = 20;

export function getPricingCurrency(code: string | null | undefined) {
  const normalised = String(code || "").trim().toUpperCase();
  return PRICING_CURRENCIES.find((currency) => currency.code === normalised) || PRICING_CURRENCIES[0];
}

export function getPricingPlan(code: string | null | undefined) {
  const normalised = String(code || "").trim().toLowerCase();
  return PRICING_PLANS.find((plan) => plan.code === normalised) || PRICING_PLANS[0];
}

export function normalisePricingCurrencyCode(code: unknown): PricingCurrencyCode {
  return getPricingCurrency(String(code || "")).code;
}

export function normalisePricingPlanCode(code: unknown): PricingPlanCode {
  return getPricingPlan(String(code || "")).code;
}

export function pricingCountryCodeForCurrency(code: unknown) {
  return getPricingCurrency(String(code || "")).countryCode;
}

export function monthlyPriceForPlan(planCode: PricingPlanCode, currencyCode: PricingCurrencyCode) {
  return getPricingPlan(planCode).monthly[getPricingCurrency(currencyCode).code];
}

export function yearlyPriceFromMonthly(monthlyPrice: number) {
  return Math.round(monthlyPrice * 12 * 0.8);
}

export function priceForPlan(planCode: PricingPlanCode, currencyCode: PricingCurrencyCode, interval: BillingInterval) {
  const monthly = monthlyPriceForPlan(planCode, currencyCode);
  return interval === "yearly" ? yearlyPriceFromMonthly(monthly) : monthly;
}

export function formatPlanPrice(amount: number, currencyCode: PricingCurrencyCode, options?: { forceDecimals?: boolean }) {
  const currency = getPricingCurrency(currencyCode);
  const useDecimals = currency.decimalPlaces > 0 && (options?.forceDecimals || !Number.isInteger(amount));
  const formatted = new Intl.NumberFormat("en-GB", {
    minimumFractionDigits: useDecimals ? currency.decimalPlaces : 0,
    maximumFractionDigits: useDecimals ? currency.decimalPlaces : 0,
  }).format(amount);
  const withSymbol = currency.symbolPosition === "before" ? `${currency.symbol}${currency.symbol === "KES" ? " " : ""}${formatted}` : `${formatted}${currency.symbol}`;
  return `${withSymbol}${currency.suffix || ""}`;
}

export function suggestedCurrencyFromBrowser(language: string | undefined, timeZone: string | undefined): PricingCurrencyCode {
  const source = `${language || ""} ${timeZone || ""}`.toLowerCase();
  if (source.includes("nairobi") || source.includes("ke-") || source.includes("-ke") || source.includes("kenya")) return "KES";
  if (source.includes("johannesburg") || source.includes("za-") || source.includes("-za") || source.includes("south africa")) return "ZAR";
  if (source.includes("london") || source.includes("gb-") || source.includes("-gb") || source.includes("united kingdom")) return "GBP";
  if (source.includes("new_york") || source.includes("los_angeles") || source.includes("chicago") || source.includes("us-") || source.includes("-us")) return "USD";
  if (source.includes("berlin") || source.includes("paris") || source.includes("madrid") || source.includes("rome") || source.includes("amsterdam") || source.includes("europe/")) return "EUR";
  return DEFAULT_PRICING_CURRENCY;
}
