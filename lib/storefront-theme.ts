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
  "rewardsPopupTopEdge",
  "rewardsPopupHeaderBackground",
  "rewardsPopupHeaderBlend",
  "rewardsPopupHeaderText",
  "rewardsPopupLabelText",
  "rewardsPopupBodyText",
  "rewardsPopupCardBackground",
  "rewardsPopupCardBorder",
  "rewardsPopupPillBackground",
  "rewardsPopupPillText",
  "rewardsPopupProgressBackground",
  "rewardsPopupProgressFill",
  "rewardsPopupFooterBackground",
  "rewardsPopupFooterBorder",
  "rewardsPopupButtonBackground",
  "rewardsPopupButtonText",
  "rewardsPopupCloseBackground",
  "rewardsPopupCloseText",
  "rewardsSilverTopEdge",
  "rewardsSilverHeaderBackground",
  "rewardsSilverHeaderBlend",
  "rewardsSilverHeaderText",
  "rewardsSilverLabelText",
  "rewardsSilverCurrentPanelBackground",
  "rewardsSilverCurrentPanelBorder",
  "rewardsSilverCurrentPillBackground",
  "rewardsSilverCurrentPillText",
  "rewardsSilverProgressFill",
  "rewardsGoldTopEdge",
  "rewardsGoldHeaderBackground",
  "rewardsGoldHeaderBlend",
  "rewardsGoldHeaderText",
  "rewardsGoldLabelText",
  "rewardsGoldCurrentPanelBackground",
  "rewardsGoldCurrentPanelBorder",
  "rewardsGoldCurrentPillBackground",
  "rewardsGoldCurrentPillText",
  "rewardsGoldProgressFill",
  "rewardsPlatinumTopEdge",
  "rewardsPlatinumHeaderBackground",
  "rewardsPlatinumHeaderBlend",
  "rewardsPlatinumHeaderText",
  "rewardsPlatinumLabelText",
  "rewardsPlatinumCurrentPanelBackground",
  "rewardsPlatinumCurrentPanelBorder",
  "rewardsPlatinumCurrentPillBackground",
  "rewardsPlatinumCurrentPillText",
  "rewardsPlatinumProgressFill",
  "offersPopupBackground",
  "offersPopupTopEdge",
  "offersPopupHeaderBackground",
  "offersPopupHeaderBlend",
  "offersPopupHeaderText",
  "offersPopupLabelText",
  "offersPopupBodyText",
  "offersPopupCardBackground",
  "offersPopupCardBorder",
  "offersPopupPillBackground",
  "offersPopupPillText",
  "offersPopupFooterBackground",
  "offersPopupFooterBorder",
  "offersPopupButtonBackground",
  "offersPopupButtonText",
  "offersPopupCloseBackground",
  "offersPopupCloseText",
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
  "storefrontMainLogoColor",
  "storefrontPopupTopEffect",
  "storefrontSplashAccent",
] as const;

export type StorefrontThemeKey = (typeof STOREFRONT_THEME_KEYS)[number];
export type StorefrontBannerFit = "cover" | "contain";
export type StorefrontTextAlign = "left" | "center" | "right";

export type StorefrontTheme = Partial<Record<StorefrontThemeKey, string>> & {
  selectedPreset?: string | null;
  customised?: boolean;
  logoPaletteColours?: string[];
  favouritesCardShadowEnabled?: boolean;
  welcomeBannerEnabled?: boolean;
  welcomeBannerImageUrl?: string;
  welcomeBannerOverlayColor?: string;
  welcomeBannerOverlayOpacity?: number;
  welcomeBannerFit?: StorefrontBannerFit;
  welcomeTextAlign?: StorefrontTextAlign;
  aboutUsEnabled?: boolean;
  aboutUsImageUrl?: string;
  aboutUsTitle?: string;
  aboutUsBody?: string;
  aboutUsTextAlign?: StorefrontTextAlign;
  aboutUsBackground?: string;
  aboutUsTextColor?: string;
};

export function isHexColor(value: unknown): value is string {
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value.trim());
}

export function normalizeThemeColor(value: unknown, fallback = "#FFFFFF") {
  return isHexColor(value) ? value.trim().toUpperCase() : fallback;
}

function normalizeStoredText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function normalizeOverlayOpacity(value: unknown) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return undefined;
  return Math.min(0.9, Math.max(0, numberValue));
}

function normalizeBannerFit(value: unknown): StorefrontBannerFit | undefined {
  return value === "cover" || value === "contain" ? value : undefined;
}

function normalizeTextAlign(value: unknown): StorefrontTextAlign | undefined {
  return value === "left" || value === "center" || value === "right" ? value : undefined;
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

  if (typeof input.welcomeBannerEnabled === "boolean") output.welcomeBannerEnabled = input.welcomeBannerEnabled;
  const welcomeBannerImageUrl = normalizeStoredText(input.welcomeBannerImageUrl, 800);
  if (welcomeBannerImageUrl) output.welcomeBannerImageUrl = welcomeBannerImageUrl;
  if (isHexColor(input.welcomeBannerOverlayColor)) output.welcomeBannerOverlayColor = String(input.welcomeBannerOverlayColor).trim().toUpperCase();
  const welcomeBannerOverlayOpacity = normalizeOverlayOpacity(input.welcomeBannerOverlayOpacity);
  if (typeof welcomeBannerOverlayOpacity === "number") output.welcomeBannerOverlayOpacity = welcomeBannerOverlayOpacity;
  const welcomeBannerFit = normalizeBannerFit(input.welcomeBannerFit);
  if (welcomeBannerFit) output.welcomeBannerFit = welcomeBannerFit;
  const welcomeTextAlign = normalizeTextAlign(input.welcomeTextAlign);
  if (welcomeTextAlign) output.welcomeTextAlign = welcomeTextAlign;

  if (typeof input.aboutUsEnabled === "boolean") output.aboutUsEnabled = input.aboutUsEnabled;
  const aboutUsImageUrl = normalizeStoredText(input.aboutUsImageUrl, 800);
  if (aboutUsImageUrl) output.aboutUsImageUrl = aboutUsImageUrl;
  const aboutUsTitle = normalizeStoredText(input.aboutUsTitle, 120);
  if (aboutUsTitle) output.aboutUsTitle = aboutUsTitle;
  const aboutUsBody = normalizeStoredText(input.aboutUsBody, 1600);
  if (aboutUsBody) output.aboutUsBody = aboutUsBody;
  const aboutUsTextAlign = normalizeTextAlign(input.aboutUsTextAlign);
  if (aboutUsTextAlign) output.aboutUsTextAlign = aboutUsTextAlign;
  if (isHexColor(input.aboutUsBackground)) output.aboutUsBackground = String(input.aboutUsBackground).trim().toUpperCase();
  if (isHexColor(input.aboutUsTextColor)) output.aboutUsTextColor = String(input.aboutUsTextColor).trim().toUpperCase();

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
    rewardsPopupTopEdge: accent,
    rewardsPopupHeaderBackground: "#F8FAFC",
    rewardsPopupHeaderBlend: background,
    rewardsPopupHeaderText: primary,
    rewardsPopupLabelText: accent,
    rewardsPopupBodyText: text,
    rewardsPopupCardBackground: background,
    rewardsPopupCardBorder: border,
    rewardsPopupPillBackground: accent,
    rewardsPopupPillText: "#FFFFFF",
    rewardsPopupProgressBackground: "#E5E7EB",
    rewardsPopupProgressFill: accent,
    rewardsPopupFooterBackground: "#FFFFFF",
    rewardsPopupFooterBorder: border,
    rewardsPopupButtonBackground: accent,
    rewardsPopupButtonText: "#FFFFFF",
    rewardsPopupCloseBackground: "#FFFFFF",
    rewardsPopupCloseText: primary,
    rewardsSilverTopEdge: "#C0C0C0",
    rewardsSilverHeaderBackground: "#F4F4F5",
    rewardsSilverHeaderBlend: "#C0C0C0",
    rewardsSilverHeaderText: "#1F2937",
    rewardsSilverLabelText: "#475569",
    rewardsSilverCurrentPanelBackground: "#FAFAFA",
    rewardsSilverCurrentPanelBorder: "#C0C0C0",
    rewardsSilverCurrentPillBackground: "#6B7280",
    rewardsSilverCurrentPillText: "#FFFFFF",
    rewardsSilverProgressFill: "#9CA3AF",
    rewardsGoldTopEdge: "#CCAD00",
    rewardsGoldHeaderBackground: "#FFF7CC",
    rewardsGoldHeaderBlend: "#CCAD00",
    rewardsGoldHeaderText: "#3F2F00",
    rewardsGoldLabelText: "#7A5B00",
    rewardsGoldCurrentPanelBackground: "#FFFBEB",
    rewardsGoldCurrentPanelBorder: "#CCAD00",
    rewardsGoldCurrentPillBackground: "#CCAD00",
    rewardsGoldCurrentPillText: "#1F1A00",
    rewardsGoldProgressFill: "#CCAD00",
    rewardsPlatinumTopEdge: "#E5E4E2",
    rewardsPlatinumHeaderBackground: "#FFFFFF",
    rewardsPlatinumHeaderBlend: "#E5E4E2",
    rewardsPlatinumHeaderText: "#111827",
    rewardsPlatinumLabelText: "#475569",
    rewardsPlatinumCurrentPanelBackground: "#F8FAFC",
    rewardsPlatinumCurrentPanelBorder: "#D8D6D1",
    rewardsPlatinumCurrentPillBackground: "#E5E4E2",
    rewardsPlatinumCurrentPillText: "#111827",
    rewardsPlatinumProgressFill: "#A8A29E",
    offersPopupBackground: "#FFFFFF",
    offersPopupTopEdge: accent,
    offersPopupHeaderBackground: "#F8FAFC",
    offersPopupHeaderBlend: background,
    offersPopupHeaderText: primary,
    offersPopupLabelText: accent,
    offersPopupBodyText: text,
    offersPopupCardBackground: background,
    offersPopupCardBorder: border,
    offersPopupPillBackground: accent,
    offersPopupPillText: "#FFFFFF",
    offersPopupFooterBackground: "#FFFFFF",
    offersPopupFooterBorder: border,
    offersPopupButtonBackground: accent,
    offersPopupButtonText: "#FFFFFF",
    offersPopupCloseBackground: "#FFFFFF",
    offersPopupCloseText: primary,
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
    storefrontMainLogoColor: primary,
    storefrontPopupTopEffect: accent,
    storefrontSplashAccent: accent,
  };
}
