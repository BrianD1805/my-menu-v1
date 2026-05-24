export type DiscountScope = "sitewide" | "product" | "combo";
export type DiscountType = "percentage" | "fixed";

export type DiscountRule = {
  id: string;
  name: string;
  code?: string | null;
  type: DiscountType;
  value: number;
  scope: DiscountScope;
  productIds?: string[];
  startsAt?: string | null;
  endsAt?: string | null;
  isActive?: boolean;
  allowWithRewards?: boolean;
  onlyThisDiscount?: boolean;
  showOnCheckout?: boolean;
  popupEnabled?: boolean;
  popupTitle?: string | null;
  popupMessage?: string | null;
};

export type DiscountSettingsLike = {
  discounts_enabled?: boolean | null;
  discountsEnabled?: boolean | null;
  discount_popup_enabled?: boolean | null;
  discountPopupEnabled?: boolean | null;
  discount_popup_title?: string | null;
  discountPopupTitle?: string | null;
  discount_popup_message?: string | null;
  discountPopupMessage?: string | null;
  discount_rules?: unknown;
  discountRules?: unknown;
};

export type DiscountCartLine = {
  productId: string;
  quantity: number;
  lineTotal: number;
};

export type DiscountCalculation = {
  applied: boolean;
  ruleId: string | null;
  code: string | null;
  name: string | null;
  scope: DiscountScope | null;
  type: DiscountType | null;
  value: number;
  baseAmount: number;
  amount: number;
  totalAfterDiscount: number;
  allowWithRewards: boolean;
  onlyThisDiscount: boolean;
  rewardAllowed: boolean;
};

function cleanString(value: unknown, max = 120) {
  return String(value || "").trim().slice(0, max);
}

function toNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, Math.round(parsed * 100) / 100);
}

function toPercent(value: unknown, fallback = 0) {
  return Math.min(95, Math.max(0, toNumber(value, fallback)));
}

function toBool(value: unknown, fallback = false) {
  if (value === true || value === "true" || value === "1" || value === 1) return true;
  if (value === false || value === "false" || value === "0" || value === 0) return false;
  return fallback;
}

function toStringArray(value: unknown) {
  if (Array.isArray(value)) return value.map((item) => cleanString(item, 80)).filter(Boolean).slice(0, 3);
  return String(value || "").split(/[\n,]+/).map((item) => cleanString(item, 80)).filter(Boolean).slice(0, 3);
}

export function normalizeDiscountRules(input: unknown): DiscountRule[] {
  const raw = Array.isArray(input) ? input : [];
  return raw.map((item, index) => {
    const row = (item || {}) as Record<string, unknown>;
    const scope = ["sitewide", "product", "combo"].includes(String(row.scope)) ? String(row.scope) as DiscountScope : "sitewide";
    const type: DiscountType = String(row.type) === "fixed" ? "fixed" : "percentage";
    const value = type === "percentage" ? toPercent(row.value, 0) : toNumber(row.value, 0);
    const productIds = scope === "sitewide" ? [] : toStringArray(row.productIds || row.product_ids);
    return {
      id: cleanString(row.id, 80) || `discount-${index + 1}`,
      name: cleanString(row.name, 90) || `Discount ${index + 1}`,
      code: cleanString(row.code, 40).toUpperCase() || null,
      type,
      value,
      scope,
      productIds,
      startsAt: cleanString(row.startsAt || row.starts_at, 40) || null,
      endsAt: cleanString(row.endsAt || row.ends_at, 40) || null,
      isActive: toBool(row.isActive ?? row.is_active, true),
      allowWithRewards: toBool(row.allowWithRewards ?? row.allow_with_rewards, true),
      onlyThisDiscount: toBool(row.onlyThisDiscount ?? row.only_this_discount, false),
      showOnCheckout: toBool(row.showOnCheckout ?? row.show_on_checkout, true),
      popupEnabled: toBool(row.popupEnabled ?? row.popup_enabled, false),
      popupTitle: cleanString(row.popupTitle || row.popup_title, 120) || null,
      popupMessage: cleanString(row.popupMessage || row.popup_message, 220) || null,
    };
  }).filter((rule) => rule.name && rule.value > 0 && (rule.scope === "sitewide" || (rule.productIds || []).length > 0)).slice(0, 24);
}

export function serializeDiscountRules(input: unknown): DiscountRule[] {
  return normalizeDiscountRules(input).map((rule) => ({
    id: rule.id,
    name: rule.name,
    code: rule.code || null,
    type: rule.type,
    value: rule.value,
    scope: rule.scope,
    productIds: rule.productIds || [],
    startsAt: rule.startsAt || null,
    endsAt: rule.endsAt || null,
    isActive: rule.isActive !== false,
    allowWithRewards: rule.allowWithRewards !== false,
    onlyThisDiscount: rule.onlyThisDiscount === true,
    showOnCheckout: rule.showOnCheckout !== false,
    popupEnabled: rule.popupEnabled === true,
    popupTitle: rule.popupTitle || null,
    popupMessage: rule.popupMessage || null,
  }));
}

function inDateWindow(rule: DiscountRule, now = new Date()) {
  if (rule.startsAt) {
    const start = new Date(rule.startsAt);
    if (!Number.isNaN(start.getTime()) && now < start) return false;
  }
  if (rule.endsAt) {
    const end = new Date(rule.endsAt);
    if (!Number.isNaN(end.getTime()) && now > end) return false;
  }
  return true;
}

function eligibleBaseAmount(rule: DiscountRule, lines: DiscountCartLine[], subtotal: number) {
  if (rule.scope === "sitewide") return Math.max(0, subtotal);
  const ids = new Set((rule.productIds || []).map(String));
  if (!ids.size) return 0;
  const matching = lines.filter((line) => ids.has(String(line.productId)));
  if (rule.scope === "combo") {
    const present = new Set(matching.map((line) => String(line.productId)));
    for (const id of ids) if (!present.has(id)) return 0;
  }
  return Math.max(0, Math.round(matching.reduce((sum, line) => sum + Number(line.lineTotal || 0), 0) * 100) / 100);
}

export function calculateDiscountAmount(rule: DiscountRule, baseAmount: number) {
  const base = Math.max(0, Math.round(Number(baseAmount || 0) * 100) / 100);
  if (rule.type === "fixed") return Math.min(base, toNumber(rule.value, 0));
  return Math.min(base, Math.round((base * toPercent(rule.value, 0) / 100) * 100) / 100);
}

export function getApplicableDiscounts(input: { settings: DiscountSettingsLike | null | undefined; cartLines: DiscountCartLine[]; subtotal: number; code?: string | null; includeVisibleAutomatic?: boolean }) {
  if (input.settings?.discounts_enabled !== true && input.settings?.discountsEnabled !== true) return [];
  const requestedCode = cleanString(input.code, 40).toUpperCase();
  const rules = normalizeDiscountRules(input.settings.discount_rules ?? input.settings.discountRules);
  return rules
    .filter((rule) => rule.isActive !== false && inDateWindow(rule))
    .map((rule) => ({ rule, baseAmount: eligibleBaseAmount(rule, input.cartLines, input.subtotal) }))
    .filter(({ rule, baseAmount }) => {
      if (baseAmount <= 0) return false;
      const hasCode = Boolean(rule.code);
      if (requestedCode && rule.code === requestedCode) return true;
      if (hasCode && !requestedCode) return input.includeVisibleAutomatic === true && rule.showOnCheckout === true;
      return true;
    })
    .map(({ rule, baseAmount }) => ({ rule, baseAmount, amount: calculateDiscountAmount(rule, baseAmount) }))
    .filter((item) => item.amount > 0);
}

export function calculateBestDiscount(input: { settings: DiscountSettingsLike | null | undefined; cartLines: DiscountCartLine[]; subtotal: number; code?: string | null; rewardDiscountAmount?: number; }) : DiscountCalculation {
  const subtotal = Math.max(0, Math.round(Number(input.subtotal || 0) * 100) / 100);
  const candidates = getApplicableDiscounts({ settings: input.settings, cartLines: input.cartLines, subtotal, code: input.code, includeVisibleAutomatic: false });
  const best = candidates.sort((a, b) => b.amount - a.amount)[0];
  if (!best) {
    return { applied: false, ruleId: null, code: null, name: null, scope: null, type: null, value: 0, baseAmount: 0, amount: 0, totalAfterDiscount: subtotal, allowWithRewards: true, onlyThisDiscount: false, rewardAllowed: true };
  }
  const rewardAllowed = best.rule.allowWithRewards !== false && best.rule.onlyThisDiscount !== true;
  const totalBeforeDiscount = rewardAllowed ? Math.max(0, subtotal - Math.max(0, Number(input.rewardDiscountAmount || 0))) : subtotal;
  const baseAmount = best.rule.scope === "sitewide" ? totalBeforeDiscount : Math.min(best.baseAmount, totalBeforeDiscount);
  const amount = calculateDiscountAmount(best.rule, baseAmount);
  return {
    applied: true,
    ruleId: best.rule.id,
    code: best.rule.code || null,
    name: best.rule.name,
    scope: best.rule.scope,
    type: best.rule.type,
    value: best.rule.value,
    baseAmount,
    amount,
    totalAfterDiscount: Math.max(0, Math.round((totalBeforeDiscount - amount) * 100) / 100),
    allowWithRewards: best.rule.allowWithRewards !== false,
    onlyThisDiscount: best.rule.onlyThisDiscount === true,
    rewardAllowed,
  };
}
