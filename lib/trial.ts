export const DEFAULT_TRIAL_DAYS = 7;
export const DEFAULT_TRIAL_PLAN = "orduva_trial";
export const TRIAL_EXPIRY_CUSTOMER_MESSAGE = "This store is temporarily unable to accept checkout orders while the owner renews their Orduva plan. You can still browse the menu.";

export type TenantTrialInsertFields = {
  trial_status: "active";
  trial_started_at: string;
  trial_ends_at: string;
  subscription_status: "trial";
  plan_name: string;
};

export type TenantTrialState = {
  trialStatus: string;
  subscriptionStatus: string;
  planName: string;
  trialStartedAt: string | null;
  trialEndsAt: string | null;
  trialDaysTotal: number;
  trialDaysRemaining: number | null;
  isTrialActive: boolean;
  isTrialExpired: boolean;
  isSubscriptionActive: boolean;
  checkoutBlocked: boolean;
  customerMessage: string | null;
};

export function createTrialInsertFields(now = new Date(), trialDays = DEFAULT_TRIAL_DAYS, planName = DEFAULT_TRIAL_PLAN): TenantTrialInsertFields {
  const trialStartedAt = new Date(now);
  const trialEndsAt = new Date(trialStartedAt);
  trialEndsAt.setUTCDate(trialEndsAt.getUTCDate() + trialDays);

  return {
    trial_status: "active",
    trial_started_at: trialStartedAt.toISOString(),
    trial_ends_at: trialEndsAt.toISOString(),
    subscription_status: "trial",
    plan_name: planName || DEFAULT_TRIAL_PLAN,
  };
}

export function calculateTenantTrialState(
  tenant: {
    trial_status?: string | null;
    subscription_status?: string | null;
    plan_name?: string | null;
    trial_started_at?: string | null;
    trial_ends_at?: string | null;
  },
  now = new Date(),
): TenantTrialState {
  const trialStatus = tenant.trial_status || "not_started";
  const subscriptionStatus = tenant.subscription_status || "trial";
  const planName = tenant.plan_name || DEFAULT_TRIAL_PLAN;
  const trialStartedAt = tenant.trial_started_at || null;
  const trialEndsAt = tenant.trial_ends_at || null;
  const endTime = trialEndsAt ? new Date(trialEndsAt).getTime() : NaN;
  const startTime = trialStartedAt ? new Date(trialStartedAt).getTime() : NaN;
  const msRemaining = Number.isFinite(endTime) ? endTime - now.getTime() : NaN;
  const totalMs = Number.isFinite(endTime) && Number.isFinite(startTime) ? Math.max(86400000, endTime - startTime) : DEFAULT_TRIAL_DAYS * 86400000;
  const trialDaysTotal = Math.max(1, Math.ceil(totalMs / 86400000));
  const trialDaysRemaining = Number.isFinite(msRemaining) ? Math.max(0, Math.ceil(msRemaining / 86400000)) : null;
  const isSubscriptionActive = subscriptionStatus === "active" || trialStatus === "converted";
  const elapsed = Number.isFinite(msRemaining) && msRemaining <= 0;
  const isTrialExpired = !isSubscriptionActive && (trialStatus === "expired" || (trialStatus === "active" && elapsed) || subscriptionStatus === "expired");
  const isTrialActive = !isSubscriptionActive && subscriptionStatus === "trial" && trialStatus === "active" && !isTrialExpired;
  const checkoutBlocked = isTrialExpired;

  return {
    trialStatus,
    subscriptionStatus,
    planName,
    trialStartedAt,
    trialEndsAt,
    trialDaysTotal,
    trialDaysRemaining,
    isTrialActive,
    isTrialExpired,
    isSubscriptionActive,
    checkoutBlocked,
    customerMessage: checkoutBlocked ? TRIAL_EXPIRY_CUSTOMER_MESSAGE : null,
  };
}

export function calculateExtendedTrialEnd(
  currentTrialEndsAt: string | null | undefined,
  additionalDays: number,
  now = new Date(),
) {
  const safeDays = Math.max(1, Math.min(365, Math.floor(Number(additionalDays) || 0)));
  const currentEnd = currentTrialEndsAt ? new Date(currentTrialEndsAt) : null;
  const base = currentEnd && Number.isFinite(currentEnd.getTime()) && currentEnd.getTime() > now.getTime() ? currentEnd : new Date(now);
  const nextEnd = new Date(base);
  nextEnd.setUTCDate(nextEnd.getUTCDate() + safeDays);
  return nextEnd.toISOString();
}
