export const DEFAULT_CURRENCY_NAME = "Pounds Sterling";
export const DEFAULT_CURRENCY_CODE = "GBP";
export const DEFAULT_CURRENCY_SYMBOL = "£";

export function formatMoney(amount: number | string, currencySymbol?: string | null) {
  return `${currencySymbol || DEFAULT_CURRENCY_SYMBOL}${Number(amount || 0).toFixed(2)}`;
}
