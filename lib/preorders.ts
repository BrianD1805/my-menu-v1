export type PreorderFinancials = {
  hasPreorder: boolean;
  hasStandard: boolean;
  orderFlow: "standard" | "preorder" | "mixed";
  depositPercent: number;
  preorderSubtotal: number;
  standardSubtotal: number;
  depositAmount: number;
  balanceAmount: number;
  amountDueNow: number;
};

export function normalizePreorderDepositPercent(value: unknown) {
  const num = Number(value);
  if (!Number.isFinite(num)) return 25;
  return Math.min(95, Math.max(1, Number(num.toFixed(2))));
}

export function moneyRound(value: number) {
  return Math.max(0, Math.round(Number(value || 0) * 100) / 100);
}

export function isPreorderProduct(product: any, selectedVariant: any | null = null) {
  const isCustomAmountProduct = product?.product_type === "customer_amount" || product?.custom_amount_enabled === true;
  if (isCustomAmountProduct) return false;
  if (product?.preorder_enabled === true) return true;

  const tracked = selectedVariant ? selectedVariant?.stockEnabled === true : product?.stock_enabled === true;
  const available = selectedVariant
    ? Math.floor(Number(selectedVariant?.stockQuantity || 0))
    : Math.floor(Number(product?.stock_quantity || 0));

  return product?.preorder_when_out_of_stock === true && tracked && available <= 0;
}

export function calculatePreorderFinancials(input: {
  lineSubtotal: number;
  preorderSubtotal: number;
  depositPercent: number;
}): PreorderFinancials {
  const preorderSubtotal = moneyRound(input.preorderSubtotal);
  const standardSubtotal = moneyRound(input.lineSubtotal - preorderSubtotal);
  const depositPercent = normalizePreorderDepositPercent(input.depositPercent);
  const depositAmount = preorderSubtotal > 0 ? moneyRound(preorderSubtotal * (depositPercent / 100)) : 0;
  const balanceAmount = preorderSubtotal > 0 ? moneyRound(preorderSubtotal - depositAmount) : 0;
  const amountDueNow = moneyRound(standardSubtotal + depositAmount);
  const hasPreorder = preorderSubtotal > 0;
  const hasStandard = standardSubtotal > 0;
  return {
    hasPreorder,
    hasStandard,
    orderFlow: hasPreorder ? (hasStandard ? "mixed" : "preorder") : "standard",
    depositPercent,
    preorderSubtotal,
    standardSubtotal,
    depositAmount,
    balanceAmount,
    amountDueNow,
  };
}
