export const DEFAULT_REFERRAL_REWARD_RATE_PERCENT = 15;
export const DEFAULT_REFERRAL_REWARD_STATUS = "trial";
export const DEFAULT_REFERRAL_CURRENCY = "GBP";

export type ReferralRewardStatus = "trial" | "active" | "paused" | "cancelled";
export type ReferralCreditStatus = "pending" | "credited" | "paid" | "void";

export function normaliseRewardRate(value: unknown, fallback = DEFAULT_REFERRAL_REWARD_RATE_PERCENT) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, Math.min(100, Math.round(parsed * 100) / 100));
}

export function normaliseMoneyAmount(value: unknown, fallback = 0) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, Math.round(parsed * 100) / 100);
}

export function calculateReferralRewardAmount(subscriptionAmount: unknown, rewardRatePercent: unknown) {
  const amount = normaliseMoneyAmount(subscriptionAmount);
  const rate = normaliseRewardRate(rewardRatePercent);
  return Math.round(amount * (rate / 100) * 100) / 100;
}

export function normaliseRewardStatus(value: unknown): ReferralRewardStatus {
  const status = String(value || "").trim().toLowerCase();
  if (["trial", "active", "paused", "cancelled"].includes(status)) return status as ReferralRewardStatus;
  return DEFAULT_REFERRAL_REWARD_STATUS;
}

export function normaliseCreditStatus(value: unknown): ReferralCreditStatus {
  const status = String(value || "").trim().toLowerCase();
  if (["pending", "credited", "paid", "void"].includes(status)) return status as ReferralCreditStatus;
  return "pending";
}

export function normaliseCurrency(value: unknown, fallback = DEFAULT_REFERRAL_CURRENCY) {
  const currency = String(value || fallback).trim().toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3);
  return currency || fallback;
}

export function monthStart(value: unknown = new Date()) {
  const date = value instanceof Date ? value : new Date(String(value || new Date().toISOString()));
  if (Number.isNaN(date.getTime())) {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().slice(0, 10);
  }
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1)).toISOString().slice(0, 10);
}
