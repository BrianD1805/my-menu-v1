import { db } from "@/lib/db";

export type RewardTierName = "silver" | "gold" | "platinum";

export type RewardsSettingsLike = {
  rewards_enabled?: boolean | null;
  rewards_program_name?: string | null;
  rewards_silver_min_spend?: number | string | null;
  rewards_silver_discount_percent?: number | string | null;
  rewards_gold_min_spend?: number | string | null;
  rewards_gold_discount_percent?: number | string | null;
  rewards_platinum_min_spend?: number | string | null;
  rewards_platinum_discount_percent?: number | string | null;
};

export type CustomerRewardSummary = {
  enabled: boolean;
  programName: string;
  tier: RewardTierName;
  tierLabel: string;
  discountPercent: number;
  qualifyingSpend: number;
  nextTier: RewardTierName | null;
  nextTierLabel: string | null;
  spendToNextTier: number;
  progressPercent: number;
};

function toMoneyNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, Math.round(parsed * 100) / 100);
}

function toPercent(value: unknown, fallback = 0) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(95, Math.max(0, Math.round(parsed * 100) / 100));
}

export function normaliseRewardsSettings(settings: RewardsSettingsLike | null | undefined) {
  const silverMin = 0;
  const goldMin = toMoneyNumber(settings?.rewards_gold_min_spend, 1000);
  const platinumMin = Math.max(goldMin, toMoneyNumber(settings?.rewards_platinum_min_spend, 2500));

  return {
    enabled: settings?.rewards_enabled === true,
    programName: String(settings?.rewards_program_name || "Rewards Club").trim().slice(0, 80) || "Rewards Club",
    silverMinSpend: silverMin,
    silverDiscountPercent: toPercent(settings?.rewards_silver_discount_percent, 0),
    goldMinSpend: goldMin,
    goldDiscountPercent: toPercent(settings?.rewards_gold_discount_percent, 5),
    platinumMinSpend: platinumMin,
    platinumDiscountPercent: toPercent(settings?.rewards_platinum_discount_percent, 10),
  };
}

function tierLabel(tier: RewardTierName) {
  if (tier === "platinum") return "Platinum";
  if (tier === "gold") return "Gold";
  return "Silver";
}

export function resolveRewardTierFromSpend(settings: RewardsSettingsLike | null | undefined, qualifyingSpend: number): CustomerRewardSummary {
  const config = normaliseRewardsSettings(settings);
  const spend = toMoneyNumber(qualifyingSpend, 0);

  let tier: RewardTierName = "silver";
  let discountPercent = config.silverDiscountPercent;
  let nextTier: RewardTierName | null = "gold";
  let nextThreshold = config.goldMinSpend;

  if (spend >= config.platinumMinSpend) {
    tier = "platinum";
    discountPercent = config.platinumDiscountPercent;
    nextTier = null;
    nextThreshold = config.platinumMinSpend;
  } else if (spend >= config.goldMinSpend) {
    tier = "gold";
    discountPercent = config.goldDiscountPercent;
    nextTier = "platinum";
    nextThreshold = config.platinumMinSpend;
  }

  const spendToNextTier = nextTier ? Math.max(0, Math.round((nextThreshold - spend) * 100) / 100) : 0;
  const progressBase = nextTier === "platinum" ? config.goldMinSpend : config.silverMinSpend;
  const progressTarget = nextTier ? nextThreshold : Math.max(config.platinumMinSpend, 1);
  const progressSpan = Math.max(1, progressTarget - progressBase);
  const progressPercent = nextTier ? Math.min(100, Math.max(0, Math.round(((spend - progressBase) / progressSpan) * 100))) : 100;

  return {
    enabled: config.enabled,
    programName: config.programName,
    tier,
    tierLabel: tierLabel(tier),
    discountPercent,
    qualifyingSpend: spend,
    nextTier,
    nextTierLabel: nextTier ? tierLabel(nextTier) : null,
    spendToNextTier,
    progressPercent,
  };
}

export async function getCustomerQualifyingSpend(tenantId: string, customerAccountId: string | null | undefined) {
  const accountId = String(customerAccountId || "").trim();
  if (!accountId) return 0;

  const { data, error } = await db
    .from("orders")
    .select("total,status,payment_status")
    .eq("tenant_id", tenantId)
    .eq("customer_account_id", accountId)
    .not("status", "in", "(cancelled,refunded)")
    .not("payment_status", "in", "(failed,refunded,cancelled)");

  if (error || !Array.isArray(data)) return 0;
  return data.reduce((sum, order) => sum + toMoneyNumber((order as Record<string, unknown>).total, 0), 0);
}

export async function getCustomerRewardSummary(input: { tenantId: string; customerAccountId?: string | null; settings: RewardsSettingsLike | null | undefined }) {
  const config = normaliseRewardsSettings(input.settings);
  if (!config.enabled) return resolveRewardTierFromSpend(input.settings, 0);
  const spend = await getCustomerQualifyingSpend(input.tenantId, input.customerAccountId || null);
  return resolveRewardTierFromSpend(input.settings, spend);
}

export function calculateRewardDiscount(subtotal: number, discountPercent: number) {
  const safeSubtotal = toMoneyNumber(subtotal, 0);
  const safePercent = toPercent(discountPercent, 0);
  const discountAmount = Math.min(safeSubtotal, Math.round(safeSubtotal * safePercent) / 100);
  const totalAfterDiscount = Math.max(0, Math.round((safeSubtotal - discountAmount) * 100) / 100);
  return { subtotal: safeSubtotal, discountPercent: safePercent, discountAmount, totalAfterDiscount };
}
