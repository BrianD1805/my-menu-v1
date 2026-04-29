export const STOREFRONT_THEME_KEYS = [
  "globalPageBackground",
  "globalText",
  "globalSoftText",
  "globalBorder",
  "headerBackground",
  "headerText",
  "headerButtonBorder",
  "welcomeBackground",
  "welcomeLabel",
  "welcomeHeading",
  "welcomeBody",
  "welcomeBorder",
  "welcomeShadow",
  "productCardBackground",
  "productCardBorder",
  "productTitle",
  "priceBoxBackground",
  "priceBoxBorder",
  "priceText",
  "addButtonBackground",
  "addButtonBorder",
  "addButtonText",
  "moreButtonBackground",
  "moreButtonBorder",
  "moreButtonText",
  "footerBackground",
  "footerText",
  "footerBadgeBackground",
] as const;

export type StorefrontThemeKey = (typeof STOREFRONT_THEME_KEYS)[number];
export type StorefrontTheme = Partial<Record<StorefrontThemeKey, string>> & { selectedPreset?: string | null; customised?: boolean };

export function isHexColor(value: unknown): value is string {
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value.trim());
}

export function normalizeThemeColor(value: unknown, fallback = "#FFFFFF") {
  return isHexColor(value) ? value.trim().toUpperCase() : fallback;
}

export function normalizeStorefrontTheme(value: unknown): StorefrontTheme | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>;
  const output: StorefrontTheme = {};

  for (const key of STOREFRONT_THEME_KEYS) {
    if (isHexColor(input[key])) output[key] = String(input[key]).trim().toUpperCase();
  }

  if (typeof input.selectedPreset === "string") output.selectedPreset = input.selectedPreset.slice(0, 80);
  if (typeof input.customised === "boolean") output.customised = input.customised;

  return Object.keys(output).length ? output : null;
}

export function buildThemeFromCore(input: {
  primaryColor?: string | null;
  accentColor?: string | null;
  backgroundTint?: string | null;
  borderColor?: string | null;
  textColor?: string | null;
  presetName?: string | null;
}): StorefrontTheme {
  const primary = normalizeThemeColor(input.primaryColor, "#0F172A");
  const accent = normalizeThemeColor(input.accentColor, "#10B981");
  const background = normalizeThemeColor(input.backgroundTint, "#F8F4F0");
  const border = normalizeThemeColor(input.borderColor, "#D9C7A3");
  const text = normalizeThemeColor(input.textColor, "#2B2B2B");

  return {
    selectedPreset: input.presetName || null,
    customised: false,
    globalPageBackground: background,
    globalText: text,
    globalSoftText: text,
    globalBorder: border,
    headerBackground: background,
    headerText: text,
    headerButtonBorder: accent,
    welcomeBackground: "#FFFFFF",
    welcomeLabel: accent,
    welcomeHeading: primary,
    welcomeBody: text,
    welcomeBorder: border,
    welcomeShadow: accent,
    productCardBackground: "#FFFFFF",
    productCardBorder: border,
    productTitle: "#0F172A",
    priceBoxBackground: "#FFFFFF",
    priceBoxBorder: accent,
    priceText: primary,
    addButtonBackground: "#FFFFFF",
    addButtonBorder: accent,
    addButtonText: primary,
    moreButtonBackground: "#FFFFFF",
    moreButtonBorder: accent,
    moreButtonText: primary,
    footerBackground: "#FFFFFF",
    footerText: text,
    footerBadgeBackground: accent,
  };
}
