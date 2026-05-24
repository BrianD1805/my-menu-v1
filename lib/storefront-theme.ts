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
  "welcomeActionText",
  "welcomeActionIconText",
  "welcomeActionIconBackground",
  "welcomeActionBorder",
  "rewardsPopupBackground",
  "rewardsPopupHeaderBackground",
  "rewardsPopupHeaderText",
  "rewardsPopupBodyText",
  "rewardsPopupCardBackground",
  "rewardsPopupCardBorder",
  "rewardsPopupPillBackground",
  "rewardsPopupPillText",
  "offersPopupBackground",
  "offersPopupHeaderBackground",
  "offersPopupHeaderText",
  "offersPopupBodyText",
  "offersPopupCardBackground",
  "offersPopupCardBorder",
  "offersPopupPillBackground",
  "offersPopupPillText",
  "productCardBackground",
  "productCardBorder",
  "productTitle",
  "productHeartTickedBackground",
  "productHeartTickedText",
  "productHeartUntickedBackground",
  "productHeartUntickedText",
  "priceBoxBackground",
  "priceBoxBorder",
  "priceText",
  "addButtonBackground",
  "addButtonBorder",
  "addButtonText",
  "moreButtonBackground",
  "moreButtonBorder",
  "moreButtonText",
  "favouritesBackground",
  "favouritesBorder",
  "favouritesText",
  "favouritesLabelText",
  "favouritesCardBackground",
  "favouritesCardBorder",
  "favouritesCardShadow",
  "favouritesCardTitle",
  "favouritesPriceBackground",
  "favouritesPriceBorder",
  "favouritesPriceText",
  "favouritesAddBackground",
  "favouritesAddBorder",
  "favouritesAddText",
  "favouritesRemoveBackground",
  "favouritesRemoveText",
  "favouritesSwipeText",
  "footerBackground",
  "footerText",
  "footerBadgeBackground",
] as const;

export type StorefrontThemeKey = (typeof STOREFRONT_THEME_KEYS)[number];
export type StorefrontTheme = Partial<Record<StorefrontThemeKey, string>> & { selectedPreset?: string | null; customised?: boolean; logoPaletteColours?: string[]; favouritesCardShadowEnabled?: boolean };

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
  if (typeof input.favouritesCardShadowEnabled === "boolean") output.favouritesCardShadowEnabled = input.favouritesCardShadowEnabled;
  if (Array.isArray(input.logoPaletteColours)) {
    const colours = input.logoPaletteColours
      .map((colour) => (typeof colour === "string" ? colour.trim().toUpperCase() : ""))
      .filter(isHexColor);
    if (colours.length) output.logoPaletteColours = Array.from(new Set(colours)).slice(0, 12);
  }

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
    welcomeActionText: primary,
    welcomeActionIconText: "#FFFFFF",
    welcomeActionIconBackground: accent,
    welcomeActionBorder: border,
    rewardsPopupBackground: "#FFFFFF",
    rewardsPopupHeaderBackground: primary,
    rewardsPopupHeaderText: "#FFFFFF",
    rewardsPopupBodyText: text,
    rewardsPopupCardBackground: background,
    rewardsPopupCardBorder: border,
    rewardsPopupPillBackground: accent,
    rewardsPopupPillText: "#FFFFFF",
    offersPopupBackground: "#FFFFFF",
    offersPopupHeaderBackground: primary,
    offersPopupHeaderText: "#FFFFFF",
    offersPopupBodyText: text,
    offersPopupCardBackground: background,
    offersPopupCardBorder: border,
    offersPopupPillBackground: accent,
    offersPopupPillText: "#FFFFFF",
    productCardBackground: "#FFFFFF",
    productCardBorder: border,
    productTitle: "#0F172A",
    productHeartTickedBackground: "#FEF3C7",
    productHeartTickedText: accent,
    productHeartUntickedBackground: "#FFFFFF",
    productHeartUntickedText: text,
    priceBoxBackground: "#FFFFFF",
    priceBoxBorder: accent,
    priceText: primary,
    addButtonBackground: "#FFFFFF",
    addButtonBorder: accent,
    addButtonText: primary,
    moreButtonBackground: "#FFFFFF",
    moreButtonBorder: accent,
    moreButtonText: primary,
    favouritesBackground: primary,
    favouritesBorder: accent,
    favouritesText: "#FFFFFF",
    favouritesLabelText: accent,
    favouritesCardBackground: "#FFFFFF",
    favouritesCardBorder: border,
    favouritesCardShadow: accent,
    favouritesCardShadowEnabled: true,
    favouritesCardTitle: primary,
    favouritesPriceBackground: "#FFFFFF",
    favouritesPriceBorder: accent,
    favouritesPriceText: primary,
    favouritesAddBackground: primary,
    favouritesAddBorder: accent,
    favouritesAddText: "#FFFFFF",
    favouritesRemoveBackground: "#FFFFFF",
    favouritesRemoveText: accent,
    favouritesSwipeText: accent,
    footerBackground: "#FFFFFF",
    footerText: text,
    footerBadgeBackground: accent,
  };
}
