export const DEFAULT_CURRENCY_NAME = "Kenyan Shilling";
export const DEFAULT_CURRENCY_CODE = "KES";
export const DEFAULT_CURRENCY_SYMBOL = "";
export const DEFAULT_CURRENCY_DISPLAY_MODE = "code";
export const DEFAULT_CURRENCY_SYMBOL_POSITION = "before";
export const DEFAULT_CURRENCY_DECIMAL_PLACES = 0;
export const DEFAULT_CURRENCY_USE_THOUSANDS_SEPARATOR = true;
export const DEFAULT_CURRENCY_DECIMAL_SEPARATOR = ".";
export const DEFAULT_CURRENCY_THOUSANDS_SEPARATOR = ",";
export const DEFAULT_CURRENCY_SUFFIX = "/-";

export type CurrencyDisplayMode = "symbol" | "code" | "code_symbol" | "symbol_code" | "none";
export type CurrencySymbolPosition = "before" | "after";

export type MoneyFormatSettings = {
  currencyName?: string | null;
  currencyCode?: string | null;
  currencySymbol?: string | null;
  currencyDisplayMode?: CurrencyDisplayMode | null;
  currencySymbolPosition?: CurrencySymbolPosition | null;
  currencyDecimalPlaces?: number | null;
  currencyUseThousandsSeparator?: boolean | null;
  currencyDecimalSeparator?: string | null;
  currencyThousandsSeparator?: string | null;
  currencySuffix?: string | null;
};

export const DEFAULT_MONEY_SETTINGS: Required<MoneyFormatSettings> = {
  currencyName: DEFAULT_CURRENCY_NAME,
  currencyCode: DEFAULT_CURRENCY_CODE,
  currencySymbol: DEFAULT_CURRENCY_SYMBOL,
  currencyDisplayMode: DEFAULT_CURRENCY_DISPLAY_MODE,
  currencySymbolPosition: DEFAULT_CURRENCY_SYMBOL_POSITION,
  currencyDecimalPlaces: DEFAULT_CURRENCY_DECIMAL_PLACES,
  currencyUseThousandsSeparator: DEFAULT_CURRENCY_USE_THOUSANDS_SEPARATOR,
  currencyDecimalSeparator: DEFAULT_CURRENCY_DECIMAL_SEPARATOR,
  currencyThousandsSeparator: DEFAULT_CURRENCY_THOUSANDS_SEPARATOR,
  currencySuffix: DEFAULT_CURRENCY_SUFFIX,
};

export function buildMoneySettings(settings?: MoneyFormatSettings | null) {
  return {
    currencyName: settings?.currencyName || DEFAULT_MONEY_SETTINGS.currencyName,
    currencyCode: settings?.currencyCode || DEFAULT_MONEY_SETTINGS.currencyCode,
    currencySymbol: settings?.currencySymbol || DEFAULT_MONEY_SETTINGS.currencySymbol,
    currencyDisplayMode: (settings?.currencyDisplayMode || DEFAULT_MONEY_SETTINGS.currencyDisplayMode) as CurrencyDisplayMode,
    currencySymbolPosition: (settings?.currencySymbolPosition || DEFAULT_MONEY_SETTINGS.currencySymbolPosition) as CurrencySymbolPosition,
    currencyDecimalPlaces: Number.isInteger(settings?.currencyDecimalPlaces)
      ? Math.min(4, Math.max(0, Number(settings?.currencyDecimalPlaces)))
      : DEFAULT_MONEY_SETTINGS.currencyDecimalPlaces,
    currencyUseThousandsSeparator:
      typeof settings?.currencyUseThousandsSeparator === "boolean"
        ? settings.currencyUseThousandsSeparator
        : DEFAULT_MONEY_SETTINGS.currencyUseThousandsSeparator,
    currencyDecimalSeparator: settings?.currencyDecimalSeparator || DEFAULT_MONEY_SETTINGS.currencyDecimalSeparator,
    currencyThousandsSeparator: settings?.currencyThousandsSeparator || DEFAULT_MONEY_SETTINGS.currencyThousandsSeparator,
    currencySuffix: settings?.currencySuffix || DEFAULT_MONEY_SETTINGS.currencySuffix,
  };
}

function addThousandsSeparators(value: string, separator: string) {
  const [whole, decimal] = value.split(".");
  const formattedWhole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
  return decimal === undefined ? formattedWhole : `${formattedWhole}.${decimal}`;
}

export function formatMoney(amount: number | string, settings?: MoneyFormatSettings | null) {
  const money = buildMoneySettings(settings);
  const numericAmount = Number(amount || 0);
  const isNegative = numericAmount < 0;
  const absoluteAmount = Math.abs(numericAmount);
  const fixed = absoluteAmount.toFixed(money.currencyDecimalPlaces);
  const withThousands = money.currencyUseThousandsSeparator
    ? addThousandsSeparators(fixed, money.currencyThousandsSeparator)
    : fixed;
  const normalizedAmount = money.currencyDecimalSeparator === "."
    ? withThousands
    : withThousands.replace(".", money.currencyDecimalSeparator);

  const symbolPart = money.currencySymbol?.trim() || "";
  const codePart = money.currencyCode?.trim() || "";
  let prefix = "";
  let suffix = money.currencySuffix || "";

  if (money.currencyDisplayMode === "symbol") {
    if (money.currencySymbolPosition === "before") prefix = symbolPart;
    else suffix = `${suffix}${symbolPart}`;
  } else if (money.currencyDisplayMode === "code") {
    if (money.currencySymbolPosition === "before") prefix = codePart ? `${codePart} ` : "";
    else suffix = `${suffix}${codePart ? ` ${codePart}` : ""}`;
  } else if (money.currencyDisplayMode === "code_symbol") {
    if (money.currencySymbolPosition === "before") prefix = `${codePart ? `${codePart} ` : ""}${symbolPart}`;
    else suffix = `${suffix}${symbolPart}${codePart ? ` ${codePart}` : ""}`;
  } else if (money.currencyDisplayMode === "symbol_code") {
    if (money.currencySymbolPosition === "before") prefix = `${symbolPart}${codePart ? ` ${codePart}` : ""}`;
    else suffix = `${suffix}${codePart ? ` ${codePart}` : ""}${symbolPart}`;
  }

  const rendered = `${prefix}${normalizedAmount}${suffix}`.trim();
  return isNegative ? `-${rendered}` : rendered;
}
