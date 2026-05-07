export const DEFAULT_TRIAL_DAYS = 7;
export const DEFAULT_TRIAL_PLAN = "orduva_trial";

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
};

export function createTrialInsertFields(now = new Date(), trialDays = DEFAULT_TRIAL_DAYS): TenantTrialInsertFields {
  const trialStartedAt = new Date(now);
  const trialEndsAt = new Date(trialStartedAt);
  trialEndsAt.setUTCDate(trialEndsAt.getUTCDate() + trialDays);

  return {
    trial_status: "active",
    trial_started_at: trialStartedAt.toISOString(),
    trial_ends_at: trialEndsAt.toISOString(),
    subscription_status: "trial",
    plan_name: DEFAULT_TRIAL_PLAN,
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
  const msRemaining = Number.isFinite(endTime) ? endTime - now.getTime() : NaN;
  const trialDaysRemaining = Number.isFinite(msRemaining) ? Math.max(0, Math.ceil(msRemaining / 86400000)) : null;
  const isTrialExpired = trialStatus === "active" && Number.isFinite(msRemaining) && msRemaining <= 0;
  const isTrialActive = trialStatus === "active" && !isTrialExpired;

  return {
    trialStatus,
    subscriptionStatus,
    planName,
    trialStartedAt,
    trialEndsAt,
    trialDaysTotal: DEFAULT_TRIAL_DAYS,
    trialDaysRemaining,
    isTrialActive,
    isTrialExpired,
  };
}
