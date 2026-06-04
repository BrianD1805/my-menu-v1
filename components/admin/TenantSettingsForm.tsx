"use client";

import type { ReactNode } from "react";
import { Fragment, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_MONEY_SETTINGS, formatMoney } from "@/lib/money";
import { buildThemeFromCore, normalizeThemeColor, type StorefrontTheme, type StorefrontThemeKey } from "@/lib/storefront-theme";

type DiscountRuleForm = {
  id: string;
  name: string;
  code: string;
  type: "percentage" | "fixed";
  value: string;
  scope: "sitewide" | "product" | "combo";
  productIds: string[];
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  allowWithRewards: boolean;
  onlyThisDiscount: boolean;
  showOnCheckout: boolean;
  popupEnabled: boolean;
  popupTitle: string;
  popupMessage: string;
};

type AdminProductOption = { id: string; name: string; price?: number | null };

type FormState = {
  businessDisplayName: string;
  storefrontHeading: string;
  storefrontSubheading: string;
  adminHeadingLabel: string;
  logoUrl: string;
  faviconUrl: string;
  primaryColor: string;
  accentColor: string;
  backgroundTint: string;
  borderColor: string;
  textColor: string;
  storefrontTheme: StorefrontTheme | null;
  contactPhone: string;
  contactEmail: string;
  contactWhatsApp: string;
  contactAddress: string;
  footerBlurb: string;
  footerNotice: string;
  showOrduvaReferralAd: boolean;
  showAdminLaunchChecklist: boolean;
  socialFacebookUrl: string;
  socialInstagramUrl: string;
  socialTikTokUrl: string;
  socialXUrl: string;
  socialWebsiteUrl: string;
  currencyName: string;
  currencyCode: string;
  currencySymbol: string;
  currencyDisplayMode: "symbol" | "code" | "code_symbol" | "symbol_code" | "none";
  currencySymbolPosition: "before" | "after";
  currencyDecimalPlaces: string;
  currencyUseThousandsSeparator: boolean;
  currencyDecimalSeparator: string;
  currencyThousandsSeparator: string;
  currencySuffix: string;
  enableCashOnCollection: boolean;
  enableCashOnDelivery: boolean;
  enableStripeCustomerPayments: boolean;
  stripeConnectionStatus: string;
  stripeCustomerPaymentMode: "manual_keys" | "stripe_connect";
  stripeCustomerPublishableKey: string;
  stripeCustomerSecretKeyInput: string;
  stripeCustomerSecretKeySet: boolean;
  stripeCustomerSecretKeyHint: string;
  stripeCustomerWebhookSecretInput: string;
  stripeCustomerWebhookSecretSet: boolean;
  stripeCustomerWebhookSecretHint: string;
  stripeCustomerAccountLabel: string;
  stripeCustomerTestMode: boolean;
  stripeCustomerSetupNotes: string;
  stripeCustomerPaymentsLive: boolean;
  enableYocoCustomerPayments: boolean;
  yocoConnectionStatus: string;
  yocoCustomerMode: "test" | "live";
  yocoCustomerSecretKeyInput: string;
  yocoCustomerSecretKeySet: boolean;
  yocoCustomerSecretKeyHint: string;
  yocoCustomerWebhookSecretInput: string;
  yocoCustomerWebhookSecretSet: boolean;
  yocoCustomerWebhookSecretHint: string;
  yocoCustomerWebhookId: string;
  yocoCustomerWebhookUrl: string;
  yocoCustomerAccountLabel: string;
  yocoCustomerSetupNotes: string;
  yocoCustomerPaymentsLive: boolean;
  enableMpesaCustomerPayments: boolean;
  mpesaConnectionStatus: string;
  mpesaCustomerMode: "test" | "live";
  mpesaCustomerConsumerKey: string;
  mpesaCustomerConsumerSecretInput: string;
  mpesaCustomerConsumerSecretSet: boolean;
  mpesaCustomerConsumerSecretHint: string;
  mpesaCustomerIpnId: string;
  mpesaCustomerAccountLabel: string;
  mpesaCustomerSetupNotes: string;
  mpesaCustomerPaymentsLive: boolean;
  enableDarajaCustomerPayments: boolean;
  darajaConnectionStatus: string;
  darajaCustomerMode: "sandbox" | "live";
  darajaConsumerKey: string;
  darajaConsumerSecretInput: string;
  darajaConsumerSecretSet: boolean;
  darajaConsumerSecretHint: string;
  darajaShortcode: string;
  darajaPasskeyInput: string;
  darajaPasskeySet: boolean;
  darajaPasskeyHint: string;
  darajaTransactionType: "CustomerPayBillOnline" | "CustomerBuyGoodsOnline";
  darajaAccountReferencePrefix: string;
  darajaCallbackUrl: string;
  darajaAccountLabel: string;
  darajaSetupNotes: string;
  darajaPaymentsLive: boolean;
  rewardsEnabled: boolean;
  rewardsProgramName: string;
  rewardsSilverDiscountPercent: string;
  rewardsGoldMinSpend: string;
  rewardsGoldDiscountPercent: string;
  rewardsPlatinumMinSpend: string;
  rewardsPlatinumDiscountPercent: string;
  discountsEnabled: boolean;
  discountPopupEnabled: boolean;
  discountPopupTitle: string;
  discountPopupMessage: string;
  discountRules: DiscountRuleForm[];
  receiptDocumentName: string;
  receiptTaxLabel: "VAT" | "GST";
  receiptTaxNumber: string;
  receiptTaxRatePercent: string;
  receiptExtraField1Enabled: boolean;
  receiptExtraField1Label: string;
  receiptExtraField1Value: string;
  receiptExtraField2Enabled: boolean;
  receiptExtraField2Label: string;
  receiptExtraField2Value: string;
  receiptFooterMessage: string;
  receiptBrandImageMode: "logo" | "favicon";
  seoPageName: string;
  seoMetaDescription: string;
  seoKeywords: string;
  seoCanonicalUrl: string;
  seoStructuredDataEnabled: boolean;
  googleTrackingId: string;
  googleTagManagerId: string;
  invoicePaymentsEnabled: boolean;
  invoicePaymentsSectionTitle: string;
  invoicePaymentsIntroText: string;
};



type MpesaDiagnosticsResult = {
  ok?: boolean;
  message?: string;
  safeToCreateOrder?: boolean;
  completed?: boolean;
  failed?: boolean;
  orderId?: string | null;
  intent?: {
    id?: string | null;
    status?: string | null;
    orderId?: string | null;
    amountTotal?: number | null;
    currencyCode?: string | null;
    pesapalOrderTrackingId?: string | null;
    pesapalMerchantReference?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
  } | null;
  pesapal?: {
    ok?: boolean;
    httpStatus?: number;
    status?: string | null;
    statusCode?: string | number | null;
    paymentMethod?: string | null;
    confirmationCode?: string | null;
    errorMessage?: string | null;
    raw?: Record<string, unknown> | null;
  } | null;
  error?: string;
};

type PreviewTarget = "global" | "header" | "welcome" | "products" | "favourites" | "footer";
type ToastTone = "success" | "error" | "info";
type AdminToast = { id: number; message: string; tone: ToastTone };

type ThemePreset = {
  name: string;
  description: string;
  primaryColor: string;
  accentColor: string;
  backgroundTint: string;
  borderColor: string;
  textColor: string;
  theme: StorefrontTheme;
};

const LOGO_PALETTE_PRESET_NAME = "Logo palette";

const THEME_PRESETS: ThemePreset[] = [
  makePreset("Premium Blue & Orange", "Clean, professional and tech-led.", "#336699", "#F28C28", "#F3F8FC", "#BED3E8", "#16283A"),
  makePreset("Forest Green & Gold", "Warm, natural and restaurant-friendly.", "#1F5C3B", "#D8A63A", "#F4F7EF", "#C9D8B8", "#1D2B22"),
  makePreset("Charcoal & Teal", "Modern, cool and premium.", "#263238", "#16A3A3", "#F2F6F6", "#B8D8D8", "#172326"),
  makePreset("Cream & Berry", "Soft, boutique and welcoming.", "#7A2E55", "#E0A458", "#FFF7EE", "#E8CDB7", "#35232B"),
];

const THEME_GROUPS: Array<{
  id: PreviewTarget;
  title: string;
  description: string;
  fields: Array<{ key: StorefrontThemeKey; label: string }>;
  options?: Array<{ key: "favouritesCardShadowEnabled"; label: string; help: string }>;
}> = [
  {
    id: "global",
    title: "Global",
    description: "The page canvas, general text and soft borders.",
    fields: [
      { key: "globalPageBackground", label: "Page background" },
      { key: "globalText", label: "Main text" },
      { key: "globalSoftText", label: "Soft text" },
      { key: "globalBorder", label: "General border" },
    ],
  },
  {
    id: "header",
    title: "Header",
    description: "The sticky storefront header and small action buttons.",
    fields: [
      { key: "headerBackground", label: "Header background" },
      { key: "headerText", label: "Header text" },
      { key: "headerButtonBorder", label: "Search/cart button edge" },
    ],
  },
  {
    id: "welcome",
    title: "Welcome Card",
    description: "The opening welcome panel customers see first.",
    fields: [
      { key: "welcomeBackground", label: "Card background" },
      { key: "welcomeLabel", label: "Welcome label" },
      { key: "welcomeHeading", label: "Heading" },
      { key: "welcomeBody", label: "Body text" },
      { key: "welcomeBorder", label: "Border" },
      { key: "welcomeShadow", label: "Soft shadow tint" },
      { key: "welcomeActionText", label: "Rewards/offers text" },
      { key: "welcomeActionIconText", label: "Rewards/offers icon" },
      { key: "welcomeActionIconBackground", label: "Rewards/offers icon background" },
      { key: "welcomeActionBorder", label: "Rewards button edge" },
      { key: "rewardsPopupBackground", label: "Rewards popup background" },
      { key: "rewardsPopupHeaderBackground", label: "Rewards popup header" },
      { key: "rewardsPopupHeaderText", label: "Rewards popup header text" },
      { key: "rewardsPopupBodyText", label: "Rewards popup body text" },
      { key: "rewardsPopupCardBackground", label: "Rewards popup card" },
      { key: "rewardsPopupCardBorder", label: "Rewards popup card edge" },
      { key: "rewardsPopupPillBackground", label: "Rewards popup pill" },
      { key: "rewardsPopupPillText", label: "Rewards popup pill text" },
      { key: "offersPopupBackground", label: "Offers popup background" },
      { key: "offersPopupHeaderBackground", label: "Offers popup header" },
      { key: "offersPopupHeaderText", label: "Offers popup header text" },
      { key: "offersPopupBodyText", label: "Offers popup body text" },
      { key: "offersPopupCardBackground", label: "Offers popup card" },
      { key: "offersPopupCardBorder", label: "Offers popup card edge" },
      { key: "offersPopupPillBackground", label: "Offers popup pill" },
      { key: "offersPopupPillText", label: "Offers popup pill text" },
    ],
  },
  {
    id: "products",
    title: "Product Cards",
    description: "Product card surfaces, titles, price box and Add/More buttons.",
    fields: [
      { key: "productCardBackground", label: "Card background" },
      { key: "productCardBorder", label: "Card border" },
      { key: "productTitle", label: "Product title" },
      { key: "productHeartTickedBackground", label: "Heart ticked background" },
      { key: "productHeartTickedText", label: "Heart ticked colour" },
      { key: "productHeartUntickedBackground", label: "Heart unticked background" },
      { key: "productHeartUntickedText", label: "Heart unticked colour" },
      { key: "priceBoxBackground", label: "Price background" },
      { key: "priceBoxBorder", label: "Price border" },
      { key: "priceText", label: "Price text" },
      { key: "addButtonBackground", label: "Add background" },
      { key: "addButtonBorder", label: "Add border" },
      { key: "addButtonText", label: "Add text" },
      { key: "moreButtonBackground", label: "More background" },
      { key: "moreButtonBorder", label: "More border" },
      { key: "moreButtonText", label: "More text" },
    ],
  },
  {
    id: "favourites",
    title: "Favourites",
    description: "The swipeable favourite products strip after the welcome card.",
    fields: [
      { key: "favouritesBackground", label: "Section background" },
      { key: "favouritesBorder", label: "Section border" },
      { key: "favouritesText", label: "Section heading text" },
      { key: "favouritesLabelText", label: "Small label text" },
      { key: "favouritesCardBackground", label: "Card background" },
      { key: "favouritesCardBorder", label: "Card border" },
      { key: "favouritesCardShadow", label: "Card shadow colour" },
      { key: "favouritesCardTitle", label: "Product title" },
      { key: "favouritesPriceBackground", label: "Price background" },
      { key: "favouritesPriceBorder", label: "Price border" },
      { key: "favouritesPriceText", label: "Price text" },
      { key: "favouritesAddBackground", label: "Add button background" },
      { key: "favouritesAddBorder", label: "Add button border" },
      { key: "favouritesAddText", label: "Add button text" },
      { key: "favouritesRemoveBackground", label: "Remove heart background" },
      { key: "favouritesRemoveText", label: "Remove heart text" },
      { key: "favouritesSwipeText", label: "Swipe hint text" },
    ],
    options: [
      { key: "favouritesCardShadowEnabled", label: "Card shadow", help: "Turn the favourite card shadow on or off." },
    ],
  },
  {
    id: "footer",
    title: "Footer",
    description: "Storefront footer and business details panel.",
    fields: [
      { key: "footerBackground", label: "Footer background" },
      { key: "footerText", label: "Footer text" },
      { key: "footerBadgeBackground", label: "Footer badge" },
    ],
  },
];

function makePreset(name: string, description: string, primaryColor: string, accentColor: string, backgroundTint: string, borderColor: string, textColor: string): ThemePreset {
  return {
    name,
    description,
    primaryColor,
    accentColor,
    backgroundTint,
    borderColor,
    textColor,
    theme: buildThemeFromCore({ primaryColor, accentColor, backgroundTint, borderColor, textColor, presetName: name }),
  };
}

function hexToRgb(hex: string) {
  const safe = normalizeThemeColor(hex, "#000000").replace("#", "");
  return {
    r: parseInt(safe.slice(0, 2), 16),
    g: parseInt(safe.slice(2, 4), 16),
    b: parseInt(safe.slice(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b]
    .map((value) => Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, "0"))
    .join("")}`.toUpperCase();
}

function colourLuminance(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

function colourSaturation(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return max === 0 ? 0 : (max - min) / max;
}

function rgbToHsl(r: number, g: number, b: number) {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const lightness = (max + min) / 2;

  if (max === min) return { h: 0, s: 0, l: lightness };

  const delta = max - min;
  const saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);
  let hue = 0;

  if (max === red) hue = (green - blue) / delta + (green < blue ? 6 : 0);
  else if (max === green) hue = (blue - red) / delta + 2;
  else hue = (red - green) / delta + 4;

  return { h: hue * 60, s: saturation, l: lightness };
}

function blendHex(hex: string, target: string, amount: number) {
  const sourceRgb = hexToRgb(hex);
  const targetRgb = hexToRgb(target);
  return rgbToHex(
    sourceRgb.r + (targetRgb.r - sourceRgb.r) * amount,
    sourceRgb.g + (targetRgb.g - sourceRgb.g) * amount,
    sourceRgb.b + (targetRgb.b - sourceRgb.b) * amount,
  );
}

function buildLogoPalettePreset(colours: string[]): ThemePreset {
  const unique = Array.from(new Set(colours.map((colour) => normalizeThemeColor(colour, "")).filter(Boolean)));
  const sortedByDark = [...unique].sort((a, b) => colourLuminance(a) - colourLuminance(b));
  const sortedByLight = [...unique].sort((a, b) => colourLuminance(b) - colourLuminance(a));
  const sortedBySaturation = [...unique].sort((a, b) => colourSaturation(b) - colourSaturation(a));
  const primaryColor = sortedByDark.find((colour) => colourLuminance(colour) < 0.58) || unique[0] || "#0F172A";
  const accentColor = sortedBySaturation.find((colour) => colour !== primaryColor && colourLuminance(colour) > 0.18 && colourLuminance(colour) < 0.82) || unique.find((colour) => colour !== primaryColor) || "#FF6A3D";
  const lightBase = sortedByLight.find((colour) => colour !== primaryColor && colour !== accentColor) || accentColor;
  const textColor = sortedByDark[0] || primaryColor;
  const backgroundTint = blendHex(lightBase, "#FFFFFF", 0.86);
  const borderColor = blendHex(accentColor, "#FFFFFF", 0.55);

  return {
    name: LOGO_PALETTE_PRESET_NAME,
    description: "Generated from the uploaded logo. Review it, then save if it suits this store.",
    primaryColor,
    accentColor,
    backgroundTint,
    borderColor,
    textColor,
    theme: {
      ...buildThemeFromCore({ primaryColor, accentColor, backgroundTint, borderColor, textColor, presetName: LOGO_PALETTE_PRESET_NAME }),
      logoPaletteColours: unique.slice(0, 12),
      selectedPreset: LOGO_PALETTE_PRESET_NAME,
      customised: false,
      headerBackground: backgroundTint,
      welcomeLabel: accentColor,
      welcomeHeading: primaryColor,
      welcomeShadow: accentColor,
      addButtonBorder: accentColor,
      moreButtonBorder: accentColor,
      productHeartTickedBackground: "#FEF3C7",
      productHeartTickedText: accentColor,
      productHeartUntickedBackground: "#FFFFFF",
      productHeartUntickedText: textColor,
      favouritesBackground: primaryColor,
      favouritesBorder: accentColor,
      favouritesText: "#FFFFFF",
      favouritesLabelText: accentColor,
      favouritesCardBackground: "#FFFFFF",
      favouritesCardBorder: borderColor,
      favouritesCardShadow: accentColor,
      favouritesCardShadowEnabled: true,
      favouritesCardTitle: primaryColor,
      favouritesPriceBackground: "#FFFFFF",
      favouritesPriceBorder: accentColor,
      favouritesPriceText: primaryColor,
      favouritesAddBackground: primaryColor,
      favouritesAddBorder: accentColor,
      favouritesAddText: "#FFFFFF",
      favouritesRemoveBackground: "#FFFFFF",
      favouritesRemoveText: accentColor,
      favouritesSwipeText: accentColor,
      footerBadgeBackground: accentColor,
    },
  };
}

async function extractLogoColours(logoUrl: string): Promise<string[]> {
  const response = await fetch(logoUrl, { cache: "no-store" });
  if (!response.ok) throw new Error("Could not read the uploaded logo. Please refresh and try again.");

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Could not analyse this logo image."));
      img.src = objectUrl;
    });

    const canvas = document.createElement("canvas");
    const maxSize = 140;
    const ratio = Math.min(maxSize / Math.max(image.naturalWidth || 1, image.naturalHeight || 1), 1);
    canvas.width = Math.max(1, Math.round((image.naturalWidth || maxSize) * ratio));
    canvas.height = Math.max(1, Math.round((image.naturalHeight || maxSize) * ratio));
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new Error("Could not analyse this logo image.");
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const buckets = new Map<string, { count: number; score: number; hue: number; saturation: number; luminance: number }>();

    for (let i = 0; i < pixels.length; i += 8) {
      const alpha = pixels[i + 3];
      if (alpha < 140) continue;

      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
      const sat = max === 0 ? 0 : (max - min) / max;
      const hsl = rgbToHsl(r, g, b);

      const isNearWhite = lum > 0.94 && sat < 0.28;
      const isWashedCream = lum > 0.82 && sat < 0.18;
      const isNearBlack = lum < 0.035;
      const isTooNeutral = sat < 0.055;
      if (isNearWhite || isWashedCream || isNearBlack || isTooNeutral) continue;

      const quantiseBy = sat > 0.35 ? 18 : 28;
      const key = rgbToHex(Math.round(r / quantiseBy) * quantiseBy, Math.round(g / quantiseBy) * quantiseBy, Math.round(b / quantiseBy) * quantiseBy);
      const existing = buckets.get(key);
      const midToneBoost = 1 - Math.min(Math.abs(lum - 0.52) * 1.35, 0.58);
      const saturationBoost = 0.45 + sat * 1.8;
      const vividBoost = hsl.s > 0.38 ? 1.22 : 1;
      const pixelScore = saturationBoost * (0.62 + midToneBoost) * vividBoost;

      buckets.set(key, {
        count: (existing?.count || 0) + 1,
        score: (existing?.score || 0) + pixelScore,
        hue: hsl.h,
        saturation: Math.max(existing?.saturation || 0, sat),
        luminance: lum,
      });
    }

    const ranked = Array.from(buckets.entries())
      .map(([colour, data]) => ({ colour, ...data, hueFamily: Math.floor(data.hue / 30) }))
      .sort((a, b) => b.score - a.score || b.saturation - a.saturation || b.count - a.count);

    const selected: string[] = [];
    const usedHueFamilies = new Set<number>();

    function colourDistance(a: string, b: string) {
      const first = hexToRgb(a);
      const second = hexToRgb(b);
      return Math.sqrt((first.r - second.r) ** 2 + (first.g - second.g) ** 2 + (first.b - second.b) ** 2);
    }

    function addDistinctColour(colour: string, distanceThreshold: number) {
      if (selected.length >= 8) return false;
      if (selected.some((existing) => colourDistance(existing, colour) < distanceThreshold)) return false;
      selected.push(colour);
      return true;
    }

    for (const candidate of ranked) {
      if (selected.length >= 8) break;
      if (usedHueFamilies.has(candidate.hueFamily)) continue;
      if (addDistinctColour(candidate.colour, 48)) usedHueFamilies.add(candidate.hueFamily);
    }

    for (const candidate of ranked) {
      if (selected.length >= 8) break;
      addDistinctColour(candidate.colour, 64);
    }

    for (const candidate of ranked) {
      if (selected.length >= 8) break;
      addDistinctColour(candidate.colour, 38);
    }

    const fallback = ranked.slice(0, 6).map((candidate) => candidate.colour);
    return selected.length >= 2 ? selected : fallback;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function normaliseTheme(theme: StorefrontTheme | null | undefined, form: Pick<FormState, "primaryColor" | "accentColor" | "backgroundTint" | "borderColor" | "textColor">): StorefrontTheme {
  return {
    ...buildThemeFromCore({
      primaryColor: form.primaryColor,
      accentColor: form.accentColor,
      backgroundTint: form.backgroundTint,
      borderColor: form.borderColor,
      textColor: form.textColor,
    }),
    ...(theme || {}),
  };
}

export default function TenantSettingsForm({ initial, tenantName }: { initial: FormState; tenantName: string }) {
  const initialForm = useMemo(() => ({ ...initial, storefrontTheme: normaliseTheme(initial.storefrontTheme, initial) }), [initial]);
  const [form, setForm] = useState<FormState>(initialForm);
  const [savedForm, setSavedForm] = useState<FormState>(initialForm);
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState<"idle" | "success" | "error" | "info">("idle");
  const [toast, setToast] = useState<AdminToast | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [previewTarget, setPreviewTarget] = useState<PreviewTarget>("welcome");
  const [customSuggestedHex, setCustomSuggestedHex] = useState("#FFFFFF");
  const [extraSuggestedColours, setExtraSuggestedColours] = useState<string[]>([]);
  const [logoPalettePreset, setLogoPalettePreset] = useState<ThemePreset | null>(initialForm.storefrontTheme?.selectedPreset === LOGO_PALETTE_PRESET_NAME ? buildLogoPalettePreset(initialForm.storefrontTheme.logoPaletteColours?.length ? initialForm.storefrontTheme.logoPaletteColours : [initialForm.primaryColor, initialForm.accentColor, initialForm.backgroundTint, initialForm.borderColor, initialForm.textColor]) : null);
  const [generatingLogoPalette, setGeneratingLogoPalette] = useState(false);
  const previewPanelRef = useRef<HTMLDivElement | null>(null);
  const themePresetsRef = useRef<HTMLDivElement | null>(null);
  const suggestedColoursRef = useRef<HTMLDivElement | null>(null);
  const [mobileThemeModal, setMobileThemeModal] = useState<null | "preview" | "suggested">(null);
  const [stripeGuideOpen, setStripeGuideOpen] = useState(false);
  const [yocoWebhookRegistering, setYocoWebhookRegistering] = useState(false);
  const [mpesaDiagnosticReference, setMpesaDiagnosticReference] = useState("");
  const [mpesaDiagnosticChecking, setMpesaDiagnosticChecking] = useState(false);
  const [mpesaDiagnosticAction, setMpesaDiagnosticAction] = useState<"check" | "create_order" | "mark_failed" | null>(null);
  const [mpesaDiagnosticResult, setMpesaDiagnosticResult] = useState<MpesaDiagnosticsResult | null>(null);
  const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);
  const [discountProductOptions, setDiscountProductOptions] = useState<AdminProductOption[]>([]);
  const [openThemeGroup, setOpenThemeGroup] = useState<PreviewTarget | null>(null);
  const settingsTopRef = useRef<HTMLDivElement | null>(null);

  const theme = normaliseTheme(form.storefrontTheme, form);
  const previewName = form.businessDisplayName.trim() || tenantName;
  const previewHeading = form.storefrontHeading.trim() || "Browse the menu";
  const previewSubheading = form.storefrontSubheading.trim() || "Tap into the details for more information, or add favourites straight to your order.";
  const footerBlurb = form.footerBlurb.trim() || "Thank you for ordering with us.";
  const footerNotice = form.footerNotice.trim() || "Prices and availability may change without notice.";
  const moneySettings = {
    currencyName: form.currencyName.trim() || DEFAULT_MONEY_SETTINGS.currencyName,
    currencyCode: form.currencyCode.trim() || DEFAULT_MONEY_SETTINGS.currencyCode,
    currencySymbol: form.currencySymbol.trim() || DEFAULT_MONEY_SETTINGS.currencySymbol,
    currencyDisplayMode: form.currencyDisplayMode,
    currencySymbolPosition: form.currencySymbolPosition,
    currencyDecimalPlaces: Number(form.currencyDecimalPlaces || "0"),
    currencyUseThousandsSeparator: form.currencyUseThousandsSeparator,
    currencyDecimalSeparator: form.currencyDecimalSeparator || ".",
    currencyThousandsSeparator: form.currencyThousandsSeparator || ",",
    currencySuffix: form.currencySuffix,
  };

  const savedTheme = normaliseTheme(savedForm.storefrontTheme, savedForm);
  const formValueChanged = (keys: Array<keyof FormState>) => keys.some((key) => JSON.stringify(form[key]) !== JSON.stringify(savedForm[key]));
  const brandingDirty = formValueChanged(["businessDisplayName", "adminHeadingLabel", "storefrontHeading", "storefrontSubheading"]);
  const themeDirty = JSON.stringify(theme) !== JSON.stringify(savedTheme) || formValueChanged(["primaryColor", "accentColor", "backgroundTint", "borderColor", "textColor"]);
  const contactDirty = formValueChanged(["contactPhone", "contactWhatsApp", "contactEmail", "contactAddress", "footerBlurb", "footerNotice", "showOrduvaReferralAd", "socialFacebookUrl", "socialInstagramUrl", "socialTikTokUrl", "socialXUrl", "socialWebsiteUrl"]);
  const adminWorkspaceDirty = formValueChanged(["showAdminLaunchChecklist"]);
  const currencyDirty = formValueChanged(["currencyName", "currencyCode", "currencySymbol", "currencyDisplayMode", "currencySymbolPosition", "currencyDecimalPlaces", "currencyUseThousandsSeparator", "currencyDecimalSeparator", "currencyThousandsSeparator", "currencySuffix"]);
  const rewardsDirty = formValueChanged(["rewardsEnabled", "rewardsProgramName", "rewardsSilverDiscountPercent", "rewardsGoldMinSpend", "rewardsGoldDiscountPercent", "rewardsPlatinumMinSpend", "rewardsPlatinumDiscountPercent"]);
  const discountsDirty = formValueChanged(["discountsEnabled", "discountPopupEnabled", "discountPopupTitle", "discountPopupMessage", "discountRules"]);
  const receiptInfoDirty = formValueChanged(["receiptDocumentName", "receiptTaxLabel", "receiptTaxNumber", "receiptTaxRatePercent", "receiptExtraField1Enabled", "receiptExtraField1Label", "receiptExtraField1Value", "receiptExtraField2Enabled", "receiptExtraField2Label", "receiptExtraField2Value", "receiptFooterMessage", "receiptBrandImageMode"]);
  const seoDirty = formValueChanged(["seoPageName", "seoMetaDescription", "seoKeywords", "seoCanonicalUrl", "seoStructuredDataEnabled", "googleTrackingId", "googleTagManagerId"]);
  const invoicePaymentsDirty = formValueChanged(["invoicePaymentsEnabled", "invoicePaymentsSectionTitle", "invoicePaymentsIntroText"]);
  const paymentDirty = formValueChanged(["enableCashOnCollection", "enableCashOnDelivery", "enableStripeCustomerPayments", "stripeConnectionStatus", "stripeCustomerPaymentMode", "stripeCustomerPublishableKey", "stripeCustomerSecretKeyInput", "stripeCustomerWebhookSecretInput", "stripeCustomerAccountLabel", "stripeCustomerTestMode", "stripeCustomerSetupNotes", "enableYocoCustomerPayments", "yocoConnectionStatus", "yocoCustomerMode", "yocoCustomerSecretKeyInput", "yocoCustomerWebhookSecretInput", "yocoCustomerAccountLabel", "yocoCustomerSetupNotes", "yocoCustomerPaymentsLive", "enableMpesaCustomerPayments", "mpesaConnectionStatus", "mpesaCustomerMode", "mpesaCustomerConsumerKey", "mpesaCustomerConsumerSecretInput", "mpesaCustomerIpnId", "mpesaCustomerAccountLabel", "mpesaCustomerSetupNotes", "mpesaCustomerPaymentsLive", "enableDarajaCustomerPayments", "darajaConnectionStatus", "darajaCustomerMode", "darajaConsumerKey", "darajaConsumerSecretInput", "darajaShortcode", "darajaPasskeyInput", "darajaTransactionType", "darajaAccountReferencePrefix", "darajaCallbackUrl", "darajaAccountLabel", "darajaSetupNotes", "darajaPaymentsLive"]);
  const stripeCredentialReady = Boolean(form.stripeCustomerPublishableKey.trim() && (form.stripeCustomerSecretKeySet || form.stripeCustomerSecretKeyInput.trim()) && (form.stripeCustomerWebhookSecretSet || form.stripeCustomerWebhookSecretInput.trim()));
  const yocoCurrencyAllowed = String(form.currencyCode || "").trim().toUpperCase() === "ZAR";
  const yocoCredentialReady = Boolean(form.yocoCustomerSecretKeySet || form.yocoCustomerSecretKeyInput.trim());
  const yocoWebhookReady = Boolean(form.yocoCustomerWebhookSecretSet || form.yocoCustomerWebhookSecretInput.trim());
  const yocoModeDirty = form.yocoCustomerMode !== savedForm.yocoCustomerMode;
  const yocoSecretDirty = Boolean(form.yocoCustomerSecretKeyInput.trim());
  const yocoSetupNeedsSaveBeforeWebhook = yocoModeDirty || yocoSecretDirty;
  const yocoLiveMode = form.yocoCustomerMode === "live";
  const yocoReadyForCheckout = Boolean(form.enableYocoCustomerPayments && form.yocoCustomerPaymentsLive && yocoCurrencyAllowed && yocoCredentialReady);
  const mpesaCurrencyAllowed = String(form.currencyCode || "").trim().toUpperCase() === "KES";
  const mpesaCredentialReady = Boolean(form.mpesaCustomerConsumerKey.trim() && (form.mpesaCustomerConsumerSecretSet || form.mpesaCustomerConsumerSecretInput.trim()) && form.mpesaCustomerIpnId.trim());
  const darajaCurrencyAllowed = String(form.currencyCode || "").trim().toUpperCase() === "KES";
  const darajaCredentialReady = Boolean(form.darajaConsumerKey.trim() && (form.darajaConsumerSecretSet || form.darajaConsumerSecretInput.trim()) && form.darajaShortcode.trim() && (form.darajaPasskeySet || form.darajaPasskeyInput.trim()));
  const darajaModeLive = form.darajaCustomerMode === "live";
  const darajaUsesSandboxShortcode = form.darajaShortcode.trim() === "174379";
  const darajaLiveReadinessOk = Boolean(darajaCurrencyAllowed && darajaCredentialReady && (!darajaModeLive || !darajaUsesSandboxShortcode));
  const mpesaReadyForCheckout = Boolean(form.enableMpesaCustomerPayments && form.mpesaCustomerPaymentsLive && mpesaCurrencyAllowed && mpesaCredentialReady);
  const hasUnsavedChanges = brandingDirty || themeDirty || contactDirty || currencyDirty || paymentDirty || rewardsDirty || discountsDirty || receiptInfoDirty || seoDirty || invoicePaymentsDirty || adminWorkspaceDirty;
  const themeGroupDirty = (group: typeof THEME_GROUPS[number]) =>
    group.fields.some((field) => String(theme[field.key] || "") !== String(savedTheme[field.key] || "")) ||
    Boolean(group.options?.some((option) => Boolean(theme[option.key]) !== Boolean(savedTheme[option.key])));

  const suggestedColours = useMemo(() => {
    const base = [
      theme.globalPageBackground,
      theme.globalText,
      theme.globalSoftText,
      theme.globalBorder,
      theme.headerBackground,
      theme.welcomeBackground,
      theme.welcomeLabel,
      theme.productCardBackground,
      theme.productHeartTickedBackground,
      theme.productHeartTickedText,
      theme.productHeartUntickedBackground,
      theme.productHeartUntickedText,
      theme.addButtonBorder,
      theme.moreButtonBorder,
      theme.favouritesBackground,
      theme.favouritesCardBackground,
      theme.favouritesCardShadow,
      theme.favouritesAddBackground,
      theme.favouritesRemoveBackground,
      theme.footerBadgeBackground,
      form.primaryColor,
      form.accentColor,
      form.backgroundTint,
      form.borderColor,
      form.textColor,
      ...extraSuggestedColours,
    ]
      .map((colour) => normalizeThemeColor(String(colour || ""), ""))
      .filter((colour) => /^#[0-9A-F]{6}$/i.test(colour));
    return Array.from(new Set(base.map((colour) => colour.toUpperCase()))).slice(0, 18);
  }, [theme, form.primaryColor, form.accentColor, form.backgroundTint, form.borderColor, form.textColor, extraSuggestedColours]);

  const availableThemePresets = logoPalettePreset ? [...THEME_PRESETS, logoPalettePreset] : THEME_PRESETS;
  const activePreset = availableThemePresets.find((preset) => theme.selectedPreset === preset.name);
  const messageClass = useMemo(() => {
    if (tone === "success") return "border-emerald-200 bg-emerald-50 text-emerald-800";
    if (tone === "error") return "border-rose-200 bg-rose-50 text-rose-800";
    if (tone === "info") return "border-orange-200 bg-orange-50 text-orange-900";
    return "hidden";
  }, [tone]);

  useEffect(() => {
    let cancelled = false;
    async function loadDiscountProducts() {
      try {
        const res = await fetch("/api/admin/products", { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (!cancelled && res.ok && Array.isArray(data.products)) {
          setDiscountProductOptions(data.products.map((product: any) => ({ id: String(product.id), name: String(product.name || "Unnamed product"), price: Number(product.price || 0) })));
        }
      } catch {
        if (!cancelled) setDiscountProductOptions([]);
      }
    }
    void loadDiscountProducts();
    return () => { cancelled = true; };
  }, []);

  function showToast(message: string, tone: ToastTone = "success") {
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    setToast({ id: Date.now(), message, tone });
    toastTimerRef.current = window.setTimeout(() => setToast(null), 3000);
  }

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    };
  }, []);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function addDiscountRule() {
    const next: DiscountRuleForm = {
      id: `discount-${Date.now()}`,
      name: "New discount",
      code: `SAVE${Math.floor(Math.random() * 900 + 100)}`,
      type: "percentage",
      value: "10",
      scope: "sitewide",
      productIds: [],
      startsAt: "",
      endsAt: "",
      isActive: true,
      allowWithRewards: true,
      onlyThisDiscount: false,
      showOnCheckout: true,
      popupEnabled: false,
      popupTitle: "Special offer",
      popupMessage: "Apply this discount at checkout.",
    };
    setForm((current) => ({ ...current, discountRules: [...(current.discountRules || []), next] }));
  }

  function updateDiscountRule(index: number, patch: Partial<DiscountRuleForm>) {
    setForm((current) => ({
      ...current,
      discountRules: (current.discountRules || []).map((rule, ruleIndex) => ruleIndex === index ? { ...rule, ...patch } : rule),
    }));
  }

  function removeDiscountRule(index: number) {
    setForm((current) => ({ ...current, discountRules: (current.discountRules || []).filter((_, ruleIndex) => ruleIndex !== index) }));
  }

  function toggleDiscountProduct(index: number, productId: string, checked: boolean) {
    const rule = form.discountRules[index];
    if (!rule) return;
    const current = Array.isArray(rule.productIds) ? rule.productIds : [];
    const next = checked ? Array.from(new Set([...current, productId])).slice(0, 3) : current.filter((id) => id !== productId);
    updateDiscountRule(index, { productIds: next });
  }

  function updateThemeColor(key: StorefrontThemeKey, value: string) {
    const next = value.toUpperCase();
    setForm((current) => ({
      ...current,
      storefrontTheme: {
        ...normaliseTheme(current.storefrontTheme, current),
        [key]: next,
        customised: true,
      },
    }));
  }

  function updateThemeOption(key: "favouritesCardShadowEnabled", value: boolean) {
    setForm((current) => ({
      ...current,
      storefrontTheme: {
        ...normaliseTheme(current.storefrontTheme, current),
        [key]: value,
        customised: true,
      },
    }));
  }

  function addCustomSuggestedColour() {
    const next = normalizeThemeColor(customSuggestedHex, "").toUpperCase();
    if (!/^#[0-9A-F]{6}$/i.test(next)) {
      setTone("error");
      setMessage("Enter a valid 6-digit hex colour, for example #FF6A3D.");
      return;
    }
    setExtraSuggestedColours((current) => (current.includes(next) ? current : [...current, next]));
    setTone("info");
    setMessage(`Added ${next} to suggested colours for this editing session.`);
  }

  async function generateLogoPalette() {
    if (!form.logoUrl.trim()) {
      setTone("error");
      setMessage("Upload a logo first, then generate a palette from it.");
      return;
    }

    setGeneratingLogoPalette(true);
    setTone("info");
    setMessage("Generating a colour palette from the uploaded logo...");

    try {
      const colours = await extractLogoColours(form.logoUrl.trim());
      if (colours.length < 2) throw new Error("Could not find enough usable colours in this logo.");
      const preset = buildLogoPalettePreset(colours);
      setLogoPalettePreset(preset);
      applyThemePreset(preset);
      setPreviewTarget("welcome");
      setTone("success");
      setMessage("Generated a suggested logo palette. Review it in Theme presets, then save that section to make it live.");
      window.setTimeout(() => {
        themePresetsRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 80);
    } catch (error) {
      setTone("error");
      setMessage(error instanceof Error ? error.message : "Could not generate a palette from this logo.");
    } finally {
      setGeneratingLogoPalette(false);
    }
  }

  function applyThemePreset(preset: ThemePreset) {
    setForm((current) => ({
      ...current,
      primaryColor: preset.primaryColor,
      accentColor: preset.accentColor,
      backgroundTint: preset.backgroundTint,
      borderColor: preset.borderColor,
      textColor: preset.textColor,
      storefrontTheme: { ...preset.theme, selectedPreset: preset.name, customised: false },
    }));
    setPreviewTarget("welcome");
    setTone("info");
    setMessage(`Applied ${preset.name}. You can now fine-tune each storefront item before saving.`);
  }

  function isMobileThemeEditor() {
    return typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches;
  }

  function showPreview(target: PreviewTarget) {
    setPreviewTarget(target);
    if (isMobileThemeEditor()) {
      setMobileThemeModal("preview");
      return;
    }
    window.setTimeout(() => {
      previewPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 50);
  }

  function showSuggestedColours() {
    if (isMobileThemeEditor()) {
      setMobileThemeModal("suggested");
      return;
    }
    window.setTimeout(() => {
      suggestedColoursRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 50);
  }

  function scrollToSettingsSection(id: string) {
    setSettingsMenuOpen(false);
    window.setTimeout(() => {
      const target = document.getElementById(id) as HTMLDetailsElement | null;
      if (target && target.tagName === "DETAILS") target.open = true;
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  }

  function scrollSettingsToTop() {
    settingsTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function uploadAsset(file: File, kind: "logo" | "favicon") {
    const setUploading = kind === "logo" ? setUploadingLogo : setUploadingFavicon;
    const label = kind === "logo" ? "logo" : "favicon";
    setUploading(true);
    setTone("info");
    setMessage(`Uploading ${label}...`);

    try {
      const body = new FormData();
      body.append("file", file);
      body.append("kind", kind);
      const response = await fetch("/api/admin/upload-tenant-asset", { method: "POST", body });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || `Failed to upload ${kind}`);
      const uploadedUrl = payload.url || "";
      setForm((current) => ({
        ...current,
        [kind === "logo" ? "logoUrl" : "faviconUrl"]: uploadedUrl,
      }));
      setSavedForm((current) => ({
        ...current,
        [kind === "logo" ? "logoUrl" : "faviconUrl"]: uploadedUrl,
      }));
      if (kind === "logo") setPreviewTarget("header");
      const successMessage = payload.message || `${kind === "logo" ? "Logo" : "Favicon"} uploaded and saved.`;
      setTone("success");
      setMessage(successMessage);
      showToast(successMessage, "success");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `Failed to upload ${kind}`;
      setTone("error");
      setMessage(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setTone("info");
    setMessage("Saving tenant settings...");

    try {
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, storefrontTheme: theme }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Failed to save settings");

      if (adminWorkspaceDirty) {
        const checklistResponse = await fetch("/api/admin/launch-checklist", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ checklistKey: "__dismissed", status: form.showAdminLaunchChecklist ? "pending" : "complete" }),
        });
        const checklistPayload = await checklistResponse.json().catch(() => ({}));
        if (!checklistResponse.ok) throw new Error(checklistPayload?.error || "Failed to save admin checklist setting");
      }
      const nextStripeSecretSet = form.stripeCustomerSecretKeySet || Boolean(form.stripeCustomerSecretKeyInput.trim());
      const nextStripeWebhookSet = form.stripeCustomerWebhookSecretSet || Boolean(form.stripeCustomerWebhookSecretInput.trim());
      const nextYocoSecretSet = form.yocoCustomerSecretKeySet || Boolean(form.yocoCustomerSecretKeyInput.trim());
      const nextYocoWebhookSet = form.yocoCustomerWebhookSecretSet || Boolean(form.yocoCustomerWebhookSecretInput.trim());
      const nextMpesaConsumerSecretSet = form.mpesaCustomerConsumerSecretSet || Boolean(form.mpesaCustomerConsumerSecretInput.trim());
      const nextDarajaConsumerSecretSet = form.darajaConsumerSecretSet || Boolean(form.darajaConsumerSecretInput.trim());
      const nextDarajaPasskeySet = form.darajaPasskeySet || Boolean(form.darajaPasskeyInput.trim());
      const savedPayload = {
        ...form,
        storefrontTheme: theme,
        stripeConnectionStatus: stripeCredentialReady ? (form.stripeConnectionStatus === "not_configured" ? "configured" : form.stripeConnectionStatus || "configured") : "not_configured",
        stripeCustomerSecretKeyInput: "",
        stripeCustomerSecretKeySet: nextStripeSecretSet,
        stripeCustomerSecretKeyHint: nextStripeSecretSet ? form.stripeCustomerSecretKeyHint || "saved" : "",
        stripeCustomerWebhookSecretInput: "",
        stripeCustomerWebhookSecretSet: nextStripeWebhookSet,
        stripeCustomerWebhookSecretHint: nextStripeWebhookSet ? form.stripeCustomerWebhookSecretHint || "saved" : "",
        yocoConnectionStatus: yocoCredentialReady ? (form.yocoConnectionStatus === "not_configured" ? "configured" : form.yocoConnectionStatus || "configured") : "not_configured",
        yocoCustomerSecretKeyInput: "",
        yocoCustomerSecretKeySet: nextYocoSecretSet,
        yocoCustomerSecretKeyHint: nextYocoSecretSet ? form.yocoCustomerSecretKeyHint || "saved" : "",
        yocoCustomerWebhookSecretInput: "",
        yocoCustomerWebhookSecretSet: nextYocoWebhookSet,
        yocoCustomerWebhookSecretHint: nextYocoWebhookSet ? form.yocoCustomerWebhookSecretHint || "saved" : "",
        yocoCustomerWebhookId: form.yocoCustomerWebhookId,
        yocoCustomerWebhookUrl: form.yocoCustomerWebhookUrl,
        yocoCustomerPaymentsLive: form.enableYocoCustomerPayments && form.yocoCustomerPaymentsLive && nextYocoSecretSet && yocoCurrencyAllowed,
        mpesaConnectionStatus: mpesaCredentialReady ? (form.mpesaConnectionStatus === "not_configured" ? "configured" : form.mpesaConnectionStatus || "configured") : "not_configured",
        mpesaCustomerConsumerSecretInput: "",
        mpesaCustomerConsumerSecretSet: nextMpesaConsumerSecretSet,
        mpesaCustomerConsumerSecretHint: nextMpesaConsumerSecretSet ? form.mpesaCustomerConsumerSecretHint || "saved" : "",
        mpesaCustomerPaymentsLive: form.enableMpesaCustomerPayments && form.mpesaCustomerPaymentsLive && nextMpesaConsumerSecretSet && mpesaCurrencyAllowed,
        darajaConnectionStatus: darajaCredentialReady ? (form.darajaConnectionStatus === "not_configured" ? "configured" : form.darajaConnectionStatus || "configured") : "not_configured",
        darajaConsumerSecretInput: "",
        darajaConsumerSecretSet: nextDarajaConsumerSecretSet,
        darajaConsumerSecretHint: nextDarajaConsumerSecretSet ? form.darajaConsumerSecretHint || "saved" : "",
        darajaPasskeyInput: "",
        darajaPasskeySet: nextDarajaPasskeySet,
        darajaPasskeyHint: nextDarajaPasskeySet ? form.darajaPasskeyHint || "saved" : "",
        darajaPaymentsLive: form.enableDarajaCustomerPayments && form.darajaPaymentsLive && nextDarajaConsumerSecretSet && nextDarajaPasskeySet && darajaLiveReadinessOk,
      };
      setForm(savedPayload);
      setSavedForm(savedPayload);
      setTone("success");
      setMessage("Tenant settings saved.");
      showToast("Tenant settings saved.", "success");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to save settings";
      setTone("error");
      setMessage(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setSaving(false);
    }
  }

  function setYocoMode(value: FormState["yocoCustomerMode"]) {
    setForm((current) => ({
      ...current,
      yocoCustomerMode: value,
      yocoCustomerPaymentsLive: false,
      yocoCustomerWebhookSecretInput: "",
      yocoCustomerWebhookSecretSet: false,
      yocoCustomerWebhookSecretHint: "",
      yocoCustomerWebhookId: "",
      yocoCustomerWebhookUrl: "",
    }));
  }

  async function registerYocoWebhook() {
    setYocoWebhookRegistering(true);
    setTone("info");
    setMessage("Registering the Yoco webhook with Yoco...");
    try {
      const response = await fetch("/api/admin/settings/yoco-webhook", { method: "POST" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || "Failed to register Yoco webhook");

      const nextForm = {
        ...form,
        yocoConnectionStatus: "configured",
        yocoCustomerWebhookSecretInput: "",
        yocoCustomerWebhookSecretSet: true,
        yocoCustomerWebhookSecretHint: payload?.webhookSecretHint || "saved",
        yocoCustomerWebhookId: payload?.webhookId || form.yocoCustomerWebhookId || "",
        yocoCustomerWebhookUrl: payload?.webhookUrl || form.yocoCustomerWebhookUrl || "https://www.orduva.com/api/storefront/yoco/webhook",
      };
      setForm(nextForm);
      setSavedForm({ ...savedForm, ...nextForm, yocoCustomerWebhookSecretInput: "" });
      const successMessage = payload?.message || "Yoco webhook registered and saved.";
      setTone("success");
      setMessage(successMessage);
      showToast(successMessage, "success");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to register Yoco webhook";
      setTone("error");
      setMessage(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setYocoWebhookRegistering(false);
    }
  }

  async function runMpesaDiagnostic(action: "check" | "create_order" | "mark_failed") {
    const reference = mpesaDiagnosticReference.trim();
    if (!reference) {
      setMpesaDiagnosticResult({ error: "Enter a checkout ID, Pesapal OrderTrackingId, or merchant reference first." });
      return;
    }

    setMpesaDiagnosticChecking(true);
    setMpesaDiagnosticAction(action);
    setMpesaDiagnosticResult(null);

    try {
      const body: Record<string, string> = { action };
      if (reference.startsWith("ORDUVA-")) body.merchantReference = reference;
      else if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(reference)) body.orderTrackingId = reference;
      else body.checkoutId = reference;

      const response = await fetch("/api/admin/settings/mpesa-diagnostics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = (await response.json().catch(() => ({}))) as MpesaDiagnosticsResult;
      if (!response.ok) throw new Error(payload.error || "Could not run M-Pesa/Pesapal diagnostic check.");
      setMpesaDiagnosticResult(payload);
    } catch (error) {
      setMpesaDiagnosticResult({ error: error instanceof Error ? error.message : "Could not run M-Pesa/Pesapal diagnostic check." });
    } finally {
      setMpesaDiagnosticChecking(false);
      setMpesaDiagnosticAction(null);
    }
  }

  function renderLogoPaletteGeneratorCard() {
    return (
      <div className="rounded-[20px] border border-orange-200 bg-orange-50/70 p-3 text-left">
        <div className="flex h-full flex-col justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-900">Suggested logo palette</p>
            <p className="mt-1 text-xs leading-5 text-slate-600">Create or refresh a selectable palette from the uploaded logo.</p>
          </div>
          <button
            type="button"
            onClick={generateLogoPalette}
            disabled={generatingLogoPalette || !form.logoUrl.trim()}
            className="inline-flex min-h-10 w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 sm:w-auto"
          >
            {generatingLogoPalette ? "Generating..." : logoPalettePreset ? "Refresh logo palette" : "Generate from logo"}
          </button>
        </div>
      </div>
    );
  }

  function renderSuggestedColoursPanel(compact = false) {
    return (
      <div className={compact ? "rounded-[24px] border border-orange-100 bg-orange-50 p-4 text-sm leading-5 text-orange-950" : "rounded-[24px] border border-orange-100 bg-orange-50 p-4 text-sm leading-5 text-orange-950 shadow-[0_12px_30px_rgba(15,23,42,0.04)] sm:p-4"}>
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-orange-900">Suggested colours</p>
        <p className="mt-1.5 text-xs leading-5 text-orange-950/80">Use these as reference colours while editing, or add your own hex colour below.</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {suggestedColours.map((colour) => (
            <button
              key={colour}
              type="button"
              onClick={() => {
                void navigator.clipboard?.writeText(colour);
                setTone("info");
                setMessage(`Copied ${colour}. Paste it into any colour field.`);
                if (compact) setMobileThemeModal(null);
              }}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/70 bg-white px-2 py-1 text-[10px] font-bold text-slate-700 shadow-sm"
              title={`Copy ${colour}`}
            >
              <span className="h-3.5 w-3.5 rounded-full border border-black/10" style={{ backgroundColor: colour }} />
              {colour}
            </button>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-[1fr_38px_auto] gap-2">
          <input
            value={customSuggestedHex}
            onChange={(event) => setCustomSuggestedHex(event.target.value.toUpperCase())}
            className="rounded-xl border border-orange-200 bg-white px-3 py-1.5 text-xs font-bold uppercase text-slate-800 outline-none focus:border-orange-400"
            placeholder="#FF6A3D"
          />
          <input
            type="color"
            value={/^#[0-9a-fA-F]{6}$/.test(customSuggestedHex) ? customSuggestedHex : "#ffffff"}
            onChange={(event) => setCustomSuggestedHex(event.target.value.toUpperCase())}
            className="h-9 w-full rounded-xl border border-orange-200 bg-white p-1"
            aria-label="Custom suggested colour picker"
          />
          <button type="button" onClick={addCustomSuggestedColour} className="rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-slate-800">Add</button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl">
      <form onSubmit={onSubmit} className="mx-auto w-full max-w-6xl rounded-[30px] border border-emerald-200 bg-white p-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:p-6">
        <div ref={settingsTopRef} className="mb-6 scroll-mt-28">
          <div className="mb-5 rounded-[24px] border border-orange-200/70 bg-gradient-to-br from-orange-50 via-white to-slate-50 p-4 shadow-[0_16px_38px_rgba(15,23,42,0.07)] sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-orange-700">Store workspace</p>
                <h2 className="mt-1 text-lg font-black text-slate-950 sm:text-xl">Settings shortcuts</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  Jump straight to the part of settings you want to work on, instead of scrolling through the full page.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSettingsMenuOpen(true)}
                className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-2xl border border-orange-200 bg-white px-4 py-2.5 text-xs font-black uppercase tracking-[0.14em] text-orange-900 shadow-[0_12px_28px_rgba(255,106,61,0.12)] transition hover:-translate-y-[1px] hover:border-orange-300 hover:bg-orange-50"
              >
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-orange-100 text-sm text-orange-800">☰</span>
                Settings menu
              </button>
            </div>
          </div>

          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Tenant settings</p>
          <div className="mt-2">
            <h2 className="text-2xl font-bold text-slate-900">Store settings workspace</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Desktop settings now use the full working width. The live preview only appears inside the theme editor area, where it helps with colour and storefront styling decisions.
            </p>
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              <div className="rounded-[22px] border border-orange-100 bg-orange-50/70 p-4">
                <p className="text-sm font-black text-slate-950">Theme editor with preview</p>
                <p className="mt-1 text-xs leading-5 text-slate-600">Logo, wording, presets and per-item colours keep a local preview where it is useful.</p>
              </div>
              <div className="rounded-[22px] border border-emerald-100 bg-emerald-50/70 p-4">
                <p className="text-sm font-black text-slate-950">Operational settings full width</p>
                <p className="mt-1 text-xs leading-5 text-slate-600">Payments, rewards, discounts, contact and currency settings now get the full page width instead of being squeezed beside a preview.</p>
              </div>
            </div>
          </div>
        </div>

        <Section id="admin-workspace" title="Admin workspace" dirty={adminWorkspaceDirty} saving={saving} defaultOpen>
          <div className="rounded-[22px] border border-orange-100 bg-orange-50/70 p-4">
            <ToggleRow
              label="Show new client setup checklist"
              help="Switch this off once the store owner no longer needs the launch checklist button in the tenant admin header. You can switch it back on here later."
              checked={form.showAdminLaunchChecklist}
              onChange={(checked) => update("showAdminLaunchChecklist", checked)}
            />
          </div>
        </Section>

        <Section id="logo-and-favicon" title="Logo and favicon" showSave={false}>
          <div className="mb-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs leading-5 text-emerald-800">
            Logo and favicon uploads save automatically. No Save button is needed for this section.
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-[22px] border border-slate-200 bg-white p-4">
              <div className="flex flex-col gap-4">
                {form.logoUrl ? (
                  <div className="flex min-h-28 w-full items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <img src={form.logoUrl} alt="Current logo preview" className="max-h-24 max-w-full object-contain" />
                  </div>
                ) : (
                  <div className="flex min-h-28 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-center text-xs font-semibold text-slate-500">
                    No logo uploaded yet.
                  </div>
                )}
                <UploadField
                  label={form.logoUrl ? "Change logo" : "Upload logo"}
                  saved={Boolean(form.logoUrl)}
                  busy={uploadingLogo}
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  help="PNG, JPG, WebP or SVG. Max 3MB. Autosaves immediately."
                  onFile={(file) => uploadAsset(file, "logo")}
                />
                {form.logoUrl ? (
                  <ReadOnlyAssetUrl label="Saved logo URL" value={form.logoUrl} />
                ) : null}
              </div>
            </div>

            <div className="rounded-[22px] border border-slate-200 bg-white p-4">
              <div className="flex flex-col gap-4">
                {form.faviconUrl ? (
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-xs text-slate-600">
                    <img src={form.faviconUrl} alt="Current favicon preview" className="h-12 w-12 rounded-lg border border-slate-100 bg-white object-contain" />
                    <span>Current favicon preview. Browser tabs may need a hard refresh before the new icon appears.</span>
                  </div>
                ) : (
                  <div className="flex min-h-28 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-center text-xs font-semibold text-slate-500">
                    No favicon uploaded yet.
                  </div>
                )}
                <UploadField
                  label={form.faviconUrl ? "Change favicon" : "Upload favicon"}
                  saved={Boolean(form.faviconUrl)}
                  busy={uploadingFavicon}
                  accept=".ico,image/x-icon,image/vnd.microsoft.icon,image/png,image/svg+xml,image/webp"
                  help="ICO, PNG, SVG or WebP. Max 1MB. Autosaves immediately."
                  onFile={(file) => uploadAsset(file, "favicon")}
                />
                {form.faviconUrl ? (
                  <ReadOnlyAssetUrl label="Saved favicon URL" value={form.faviconUrl} />
                ) : null}
              </div>
            </div>
          </div>
        </Section>

        <Section id="branding-and-wording" title="Branding and wording" dirty={brandingDirty} saving={saving}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Business display name"><input value={form.businessDisplayName} onChange={(e) => update("businessDisplayName", e.target.value)} className="input" placeholder={tenantName} /></Field>
            <Field label="Admin heading label"><input value={form.adminHeadingLabel} onChange={(e) => update("adminHeadingLabel", e.target.value)} className="input" placeholder="Used in the admin shell" /></Field>
            <div className="md:col-span-2"><Field label="Storefront heading"><input value={form.storefrontHeading} onChange={(e) => update("storefrontHeading", e.target.value)} className="input" placeholder="Browse the menu" /></Field></div>
            <div className="md:col-span-2"><Field label="Storefront subheading"><textarea value={form.storefrontSubheading} onChange={(e) => update("storefrontSubheading", e.target.value)} rows={3} className="input" placeholder="A short welcome line for this business" /></Field></div>
          </div>
        </Section>

        <Section id="theme-presets" title="Theme presets" dirty={themeDirty} saving={saving}>
          <div className="mb-4 rounded-[22px] border border-orange-100 bg-orange-50/70 p-4">
            <p className="text-sm font-semibold text-slate-900">
              Active preset: {activePreset ? `${activePreset.name}${theme.customised ? " — customised" : ""}` : "Custom"}
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-600">Selected presets now populate the full colour list below.</p>
          </div>
          <div ref={themePresetsRef} className="grid gap-3 md:grid-cols-2">
            {availableThemePresets.map((preset) => {
              const selected = activePreset?.name === preset.name;
              return (
                <Fragment key={preset.name}>
                  <button
                    type="button"
                    onClick={() => applyThemePreset(preset)}
                    className={`rounded-[20px] border bg-white p-3 text-left transition hover:-translate-y-[1px] ${selected ? "border-orange-400 ring-2 ring-orange-200" : "border-slate-200 hover:border-slate-300"}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        {[preset.primaryColor, preset.accentColor, preset.backgroundTint, preset.borderColor, preset.textColor].map((color) => (
                          <span key={color} className="h-4 w-4 rounded-full border border-black/5" style={{ backgroundColor: color }} />
                        ))}
                      </div>
                      {selected ? <span className="rounded-full bg-orange-100 px-2.5 py-1 text-[11px] font-bold text-orange-800">✓ Active</span> : null}
                    </div>
                    <p className="mt-3 text-sm font-semibold text-slate-900">{preset.name}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{preset.description}</p>
                  </button>
                  {preset.name === LOGO_PALETTE_PRESET_NAME ? renderLogoPaletteGeneratorCard() : null}
                </Fragment>
              );
            })}
            {!logoPalettePreset ? renderLogoPaletteGeneratorCard() : null}
          </div>
        </Section>

        <Section id="per-item-storefront-colours" title="Per-item storefront colours" showSave={false}>
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(360px,420px)] xl:items-start">
            <div className="space-y-4">
            {THEME_GROUPS.map((group) => {
              const isOpen = openThemeGroup === group.id;
              return (
                <div key={group.id} className="rounded-[22px] border border-slate-200 bg-white p-4">
                  <button
                    type="button"
                    onClick={() => {
                      setOpenThemeGroup((current) => (current === group.id ? null : group.id));
                      setPreviewTarget(group.id);
                    }}
                    className="flex w-full items-start justify-between gap-3 text-left"
                    aria-expanded={isOpen}
                  >
                    <span>
                      <span className="block text-sm font-bold text-slate-900">{group.title}</span>
                      <span className="mt-1 block text-xs font-normal leading-5 text-slate-500">{group.description}</span>
                    </span>
                    <span className={`mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-bold transition ${isOpen ? "border-orange-200 bg-orange-50 text-orange-800" : "border-slate-200 bg-slate-50 text-slate-500"}`} aria-hidden="true">
                      {isOpen ? "−" : "+"}
                    </span>
                  </button>

                  {isOpen ? (
                    <>
                      <div className="mt-4 flex flex-wrap items-center justify-center gap-2 md:hidden">
                        <button
                          type="button"
                          onClick={() => showPreview(group.id)}
                          className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-bold text-orange-900 transition hover:border-orange-300 hover:bg-orange-100"
                          title={`Show ${group.title} preview`}
                        >
                          <span aria-hidden="true">👁</span> Preview
                        </button>
                        <button
                          type="button"
                          onClick={showSuggestedColours}
                          className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-slate-300 hover:bg-white"
                          title="Show suggested colours"
                        >
                          <span aria-hidden="true">🎨</span> Suggested
                        </button>
                      </div>
                      {group.options?.length ? (
                        <div className="mt-4 space-y-3">
                          {group.options.map((option) => (
                            <ToggleRow
                              key={option.key}
                              label={option.label}
                              help={option.help}
                              checked={theme[option.key] !== false}
                              onChange={(checked) => {
                                updateThemeOption(option.key, checked);
                                setPreviewTarget(group.id);
                              }}
                            />
                          ))}
                        </div>
                      ) : null}

                      <div className="mt-4 space-y-3">
                        {group.fields.map((field) => (
                          <ColorRow
                            key={field.key}
                            label={field.label}
                            value={String(theme[field.key] || "#FFFFFF")}
                            onChange={(value) => {
                              updateThemeColor(field.key, value);
                              setPreviewTarget(group.id);
                            }}
                          />
                        ))}
                      </div>
                      <div className="mt-4 flex justify-end border-t border-slate-100 pt-4">
                        <button type="submit" disabled={saving || !themeGroupDirty(group)} className="inline-flex min-h-10 w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 disabled:opacity-100 sm:w-auto">
                          {saving ? "Saving..." : themeGroupDirty(group) ? `Save ${group.title}` : "Nothing to save"}
                        </button>
                      </div>
                    </>
                  ) : null}
                </div>
              );
            })}
            </div>
            <div ref={previewPanelRef} className="hidden space-y-3 xl:block">
              <div className="rounded-[24px] border border-orange-100 bg-white p-4 shadow-[0_14px_34px_rgba(15,23,42,0.06)]">
                <div className="flex flex-col gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Theme editor preview</p>
                    <h3 className="mt-1 text-lg font-bold text-slate-900">{labelForPreview(previewTarget)}</h3>
                    <p className="mt-1 text-xs leading-5 text-slate-500">Preview stays with the colour editor only, so operational settings can use the full desktop width.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {THEME_GROUPS.map((group) => (
                      <button key={group.id} type="button" onClick={() => setPreviewTarget(group.id)} className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${previewTarget === group.id ? "border-orange-300 bg-orange-50 text-orange-900" : "border-slate-200 bg-white text-slate-600"}`}>{group.title}</button>
                    ))}
                  </div>
                </div>

                <PreviewPanel
                  target={previewTarget}
                  theme={theme}
                  previewName={previewName}
                  previewHeading={previewHeading}
                  previewSubheading={previewSubheading}
                  footerBlurb={footerBlurb}
                  footerNotice={footerNotice}
                  money={formatMoney(295, moneySettings)}
                  logoUrl={form.logoUrl}
                  faviconUrl={form.faviconUrl}
                />
              </div>

              <div ref={suggestedColoursRef}>
                {renderSuggestedColoursPanel()}
              </div>
            </div>
          </div>
        </Section>

        <Section id="business-contact-details" title="Business contact details" dirty={contactDirty} saving={saving}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Contact phone"><input value={form.contactPhone} onChange={(e) => update("contactPhone", e.target.value)} className="input" placeholder="+254..." /></Field>
            <Field label="WhatsApp"><input value={form.contactWhatsApp} onChange={(e) => update("contactWhatsApp", e.target.value)} className="input" placeholder="+254..." /></Field>
            <Field label="Email"><input value={form.contactEmail} onChange={(e) => update("contactEmail", e.target.value)} className="input" placeholder="hello@example.com" /></Field>
            <Field label="Business address"><input value={form.contactAddress} onChange={(e) => update("contactAddress", e.target.value)} className="input" placeholder="Street, area, city" /></Field>
            <div className="md:col-span-2"><Field label="Footer blurb"><input value={form.footerBlurb} onChange={(e) => update("footerBlurb", e.target.value)} className="input" placeholder="Thank you for ordering with us." /></Field></div>
            <div className="md:col-span-2"><Field label="Footer notice"><input value={form.footerNotice} onChange={(e) => update("footerNotice", e.target.value)} className="input" placeholder="Prices and availability may change without notice." /></Field></div>
            <div className="md:col-span-2 rounded-[22px] border border-orange-100 bg-orange-50/70 p-4">
              <label className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <span>
                  <span className="block text-sm font-black text-slate-900">Show Orduva referral advert</span>
                  <span className="mt-1 block text-xs leading-5 text-slate-600">Adds a tasteful “Do you need a store like this?” advert at the bottom of the storefront. Later, signups from this link can be tied to tenant referral rewards.</span>
                </span>
                <input
                  type="checkbox"
                  checked={form.showOrduvaReferralAd}
                  onChange={(e) => update("showOrduvaReferralAd", e.target.checked)}
                  className="mt-1 h-5 w-5 rounded border-slate-300 text-orange-600 focus:ring-orange-200"
                />
              </label>
            </div>
          </div>
          <div className="mt-5 rounded-[22px] border border-slate-100 bg-slate-50 p-4">
            <p className="text-sm font-bold text-slate-900">Optional social links</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">These appear in the storefront footer as centred icon-only links, with up to 8 icons shown in rows of 4. Leave blank to hide an icon.</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="Facebook URL"><input value={form.socialFacebookUrl} onChange={(e) => update("socialFacebookUrl", e.target.value)} className="input" placeholder="https://facebook.com/..." /></Field>
              <Field label="Instagram URL"><input value={form.socialInstagramUrl} onChange={(e) => update("socialInstagramUrl", e.target.value)} className="input" placeholder="https://instagram.com/..." /></Field>
              <Field label="TikTok URL"><input value={form.socialTikTokUrl} onChange={(e) => update("socialTikTokUrl", e.target.value)} className="input" placeholder="https://tiktok.com/@..." /></Field>
              <Field label="X / Twitter URL"><input value={form.socialXUrl} onChange={(e) => update("socialXUrl", e.target.value)} className="input" placeholder="https://x.com/..." /></Field>
              <div className="md:col-span-2"><Field label="Website URL"><input value={form.socialWebsiteUrl} onChange={(e) => update("socialWebsiteUrl", e.target.value)} className="input" placeholder="https://example.com" /></Field></div>
            </div>
          </div>
        </Section>

        <Section id="invoice-payments" title="Invoice payments" dirty={invoicePaymentsDirty} saving={saving}>
          <div className="rounded-[22px] border border-blue-200 bg-blue-50/80 p-4 text-sm leading-6 text-blue-950">
            <p className="font-semibold text-slate-950">Let customers pay invoices, deposits and statement balances</p>
            <p className="mt-1 text-xs leading-5 text-blue-900">When enabled, customer-entered amount payment cards are shown in their own first storefront section. These cards use a separate layout with no product image, variants, favourites or normal product details popup.</p>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2 rounded-[22px] border border-slate-200 bg-white p-4">
              <label className="flex items-start justify-between gap-4">
                <span>
                  <span className="block text-sm font-semibold text-slate-900">Allow customers to pay invoices online</span>
                  <span className="mt-1 block text-xs leading-5 text-slate-600">Switch this on after creating customer-entered amount products such as Pay Your Invoice, Pay a Deposit and Pay Statement Balance.</span>
                </span>
                <input type="checkbox" checked={form.invoicePaymentsEnabled} onChange={(e) => update("invoicePaymentsEnabled", e.target.checked)} className="mt-1 h-5 w-5 rounded border-slate-300 text-blue-700 focus:ring-blue-200" />
              </label>
            </div>
            <Field label="Section title">
              <input value={form.invoicePaymentsSectionTitle} onChange={(e) => update("invoicePaymentsSectionTitle", e.target.value)} className="input" placeholder="Payments" />
            </Field>
            <Field label="Intro text">
              <input value={form.invoicePaymentsIntroText} onChange={(e) => update("invoicePaymentsIntroText", e.target.value)} className="input" placeholder="Pay an invoice, deposit or statement balance securely online." />
            </Field>
            <div className="md:col-span-2 rounded-[22px] border border-slate-200 bg-slate-50 p-4 text-xs leading-5 text-slate-600">
              Suggested cards: <span className="font-semibold text-slate-800">Pay Your Invoice</span>, <span className="font-semibold text-slate-800">Pay a Deposit</span>, and <span className="font-semibold text-slate-800">Pay Statement Balance</span>. Create these as customer-entered amount products in Products. Orduva will display them here first when this setting is switched on.
            </div>
          </div>
        </Section>

        <Section id="receipt-information" title="Receipt information" dirty={receiptInfoDirty} saving={saving}>
          <div className="rounded-[22px] border border-emerald-200 bg-emerald-50/80 p-4 text-sm leading-6 text-emerald-950">
            <p className="font-black text-slate-950">Receipt wording and business details</p>
            <p className="mt-1 text-xs leading-5 text-emerald-900">These details appear near the order number on the customer receipt and generated PDF. Leave optional fields blank, or unticked, to hide them.</p>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Field label="Document name">
              <input value={form.receiptDocumentName} onChange={(e) => update("receiptDocumentName", e.target.value)} className="input" placeholder="Receipt" />
            </Field>
            <Field label="Tax label">
              <select value={form.receiptTaxLabel} onChange={(e) => update("receiptTaxLabel", e.target.value as FormState["receiptTaxLabel"])} className="input">
                <option value="VAT">VAT</option>
                <option value="GST">GST</option>
              </select>
            </Field>
            <Field label="Tax number">
              <input value={form.receiptTaxNumber} onChange={(e) => update("receiptTaxNumber", e.target.value)} className="input" placeholder="VAT / GST number" />
            </Field>
            <Field label="VAT / GST rate %">
              <input value={form.receiptTaxRatePercent} onChange={(e) => update("receiptTaxRatePercent", e.target.value)} className="input" inputMode="decimal" placeholder="0" />
            </Field>
            <Field label="Receipt image">
              <select value={form.receiptBrandImageMode} onChange={(e) => update("receiptBrandImageMode", e.target.value as FormState["receiptBrandImageMode"])} className="input">
                <option value="logo">Use store logo</option>
                <option value="favicon">Use favicon / app icon</option>
              </select>
            </Field>

            <div className="md:col-span-2 grid gap-4 rounded-[22px] border border-slate-200 bg-slate-50 p-4 md:grid-cols-[auto_1fr_1fr]">
              <label className="flex items-center gap-3 text-sm font-bold text-slate-800">
                <input type="checkbox" checked={form.receiptExtraField1Enabled} onChange={(e) => update("receiptExtraField1Enabled", e.target.checked)} className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-200" />
                Show field 1
              </label>
              <Field label="Field 1 label"><input value={form.receiptExtraField1Label} onChange={(e) => update("receiptExtraField1Label", e.target.value)} className="input" placeholder="Company Reg" /></Field>
              <Field label="Field 1 value"><input value={form.receiptExtraField1Value} onChange={(e) => update("receiptExtraField1Value", e.target.value)} className="input" placeholder="Optional receipt detail" /></Field>
            </div>

            <div className="md:col-span-2 grid gap-4 rounded-[22px] border border-slate-200 bg-slate-50 p-4 md:grid-cols-[auto_1fr_1fr]">
              <label className="flex items-center gap-3 text-sm font-bold text-slate-800">
                <input type="checkbox" checked={form.receiptExtraField2Enabled} onChange={(e) => update("receiptExtraField2Enabled", e.target.checked)} className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-200" />
                Show field 2
              </label>
              <Field label="Field 2 label"><input value={form.receiptExtraField2Label} onChange={(e) => update("receiptExtraField2Label", e.target.value)} className="input" placeholder="Licence No." /></Field>
              <Field label="Field 2 value"><input value={form.receiptExtraField2Value} onChange={(e) => update("receiptExtraField2Value", e.target.value)} className="input" placeholder="Optional receipt detail" /></Field>
            </div>

            <div className="md:col-span-2">
              <Field label="Receipt footer message">
                <textarea value={form.receiptFooterMessage} onChange={(e) => update("receiptFooterMessage", e.target.value)} className="input min-h-28 resize-y" placeholder="Thank you for your order. Add returns, tax, contact or business wording here." />
              </Field>
            </div>
          </div>
        </Section>

        <Section id="storefront-seo" title="Storefront SEO" dirty={seoDirty} saving={saving}>
          <div className="rounded-[22px] border border-blue-200 bg-blue-50/80 p-4 text-sm leading-6 text-blue-950">
            <p className="font-black text-slate-950">Search, social and tracking basics</p>
            <p className="mt-1 text-xs leading-5 text-blue-900">These settings improve the public storefront page title, description, browser favicon, structured data, and optional Google tracking. They do not change checkout, prices or payment behaviour.</p>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <Field label={`Page name (${form.seoPageName.length}/55)`}>
                <input maxLength={55} value={form.seoPageName} onChange={(e) => update("seoPageName", e.target.value.slice(0, 55))} className="input" placeholder={`${previewName} | Online Ordering`} />
              </Field>
              <p className="mt-1 text-xs text-slate-500">Shown as the storefront browser title and search result title. Maximum 55 characters including spaces and punctuation.</p>
            </div>

            <div className="md:col-span-2">
              <Field label={`Page meta description (${form.seoMetaDescription.length}/160)`}>
                <textarea maxLength={160} value={form.seoMetaDescription} onChange={(e) => update("seoMetaDescription", e.target.value.slice(0, 160))} className="input min-h-24 resize-y" placeholder="Describe what customers can order, where you serve, and why they should choose you." />
              </Field>
              <p className="mt-1 text-xs text-slate-500">Recommended maximum 160 characters including spaces and punctuation.</p>
            </div>

            <Field label="SEO keywords / phrases">
              <input value={form.seoKeywords} onChange={(e) => update("seoKeywords", e.target.value)} className="input" placeholder="restaurant, takeaway, groceries, Nairobi" />
            </Field>

            <div>
              <Field label="Canonical URL">
                <input value={form.seoCanonicalUrl} onChange={(e) => update("seoCanonicalUrl", e.target.value)} className="input" placeholder="https://store.orduva.com/" />
              </Field>
              <p className="mt-1 text-xs leading-5 text-slate-500">Leave this blank unless you use your own custom domain. If you do, enter the main website address customers should find on Google.</p>
            </div>

            <div className="md:col-span-2 rounded-[22px] border border-slate-200 bg-slate-50 p-4">
              <label className="flex items-start justify-between gap-4">
                <span>
                  <span className="block text-sm font-black text-slate-900">Add Schema.org structured data</span>
                  <span className="mt-1 block text-xs leading-5 text-slate-600">Adds JSON-LD to the storefront so search engines and AI systems can identify the business name, contact details, logo, icon, address and ordering website.</span>
                </span>
                <input type="checkbox" checked={form.seoStructuredDataEnabled} onChange={(e) => update("seoStructuredDataEnabled", e.target.checked)} className="mt-1 h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-200" />
              </label>
            </div>

            <div className="md:col-span-2 rounded-[22px] border border-slate-200 bg-white p-4">
              <p className="text-sm font-black text-slate-900">Google Analytics / Google Ads</p>
              <p className="mt-1 text-xs leading-5 text-slate-600">To enable Google Analytics or Google Ads on your site, enter your Google tracking ID below. This will automatically send page views and basic order conversion events to Google where available.</p>
              <div className="mt-4">
                <Field label="Google tracking ID">
                  <input value={form.googleTrackingId} onChange={(e) => update("googleTrackingId", e.target.value)} className="input" placeholder="UA-XXXX-XX, G-XXXXXX or AW-XXXXXX" />
                </Field>
              </div>
            </div>

            <div className="md:col-span-2 rounded-[22px] border border-slate-200 bg-white p-4">
              <p className="text-sm font-black text-slate-900">Google Tag Manager</p>
              <p className="mt-1 text-xs leading-5 text-slate-600">This allows you to install and manage different marketing tags without any use of code. Enter your container ID to enable Google Tag Manager on your site.</p>
              <div className="mt-4">
                <Field label="Google Tag Manager container ID">
                  <input value={form.googleTagManagerId} onChange={(e) => update("googleTagManagerId", e.target.value)} className="input" placeholder="GTM-XXXXXXX" />
                </Field>
              </div>
            </div>
          </div>
        </Section>


        <Section id="customer-rewards-program" title="Customer rewards programme" dirty={rewardsDirty} saving={saving}>
          <div className="rounded-[22px] border border-emerald-200 bg-emerald-50/80 p-4 text-sm leading-6 text-emerald-950">
            <p className="font-black text-slate-950">Premium loyalty tiers for signed-in customers</p>
            <p className="mt-1 text-xs leading-5 text-emerald-900">Every customer account is automatically enrolled when this is switched on. Their tier is calculated from their previous qualifying spend with this store. The tier discount is applied before future discount codes are added in a later build.</p>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2 rounded-[22px] border border-slate-200 bg-white p-4">
              <label className="flex items-start justify-between gap-4">
                <span>
                  <span className="block text-sm font-black text-slate-900">Enable rewards programme</span>
                  <span className="mt-1 block text-xs leading-5 text-slate-600">Shows a compact rewards icon on the customer welcome panel and applies the customer tier discount at checkout when signed in.</span>
                </span>
                <input type="checkbox" checked={form.rewardsEnabled} onChange={(e) => update("rewardsEnabled", e.target.checked)} className="mt-1 h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-200" />
              </label>
            </div>

            <Field label="Programme name"><input value={form.rewardsProgramName} onChange={(e) => update("rewardsProgramName", e.target.value)} className="input" placeholder="Rewards Club" /></Field>
            <Field label="Silver discount %"><input type="number" min={0} max={95} step="0.1" value={form.rewardsSilverDiscountPercent} onChange={(e) => update("rewardsSilverDiscountPercent", e.target.value)} className="input" /></Field>
            <Field label="Gold spend requirement"><input type="number" min={0} step="1" value={form.rewardsGoldMinSpend} onChange={(e) => update("rewardsGoldMinSpend", e.target.value)} className="input" /></Field>
            <Field label="Gold discount %"><input type="number" min={0} max={95} step="0.1" value={form.rewardsGoldDiscountPercent} onChange={(e) => update("rewardsGoldDiscountPercent", e.target.value)} className="input" /></Field>
            <Field label="Platinum spend requirement"><input type="number" min={0} step="1" value={form.rewardsPlatinumMinSpend} onChange={(e) => update("rewardsPlatinumMinSpend", e.target.value)} className="input" /></Field>
            <Field label="Platinum discount %"><input type="number" min={0} max={95} step="0.1" value={form.rewardsPlatinumDiscountPercent} onChange={(e) => update("rewardsPlatinumDiscountPercent", e.target.value)} className="input" /></Field>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <RewardTierPreview name="Silver" spend="Automatic" discount={form.rewardsSilverDiscountPercent || "0"} tone="silver" />
            <RewardTierPreview name="Gold" spend={`${form.rewardsGoldMinSpend || "0"}+`} discount={form.rewardsGoldDiscountPercent || "0"} tone="gold" />
            <RewardTierPreview name="Platinum" spend={`${form.rewardsPlatinumMinSpend || "0"}+`} discount={form.rewardsPlatinumDiscountPercent || "0"} tone="platinum" />
          </div>

          <p className="mt-4 text-xs leading-5 text-slate-500">Discounts are managed in the next section. Each discount can decide whether it stacks with this rewards discount or replaces it.</p>
        </Section>


        <Section id="discounts-and-codes" title="Discounts & discount codes" dirty={discountsDirty} saving={saving}>
          <div className="rounded-[22px] border border-emerald-200 bg-emerald-50/80 p-4 text-sm leading-6 text-emerald-950">
            <p className="font-black text-slate-950">Premium offers for products, bundles and site-wide campaigns</p>
            <p className="mt-1 text-xs leading-5 text-emerald-900">Create a code to share with a customer, attach an offer to one product, require a combination of up to three products, or run a site-wide campaign with a date range. Each discount can decide whether it stacks with rewards.</p>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="flex items-start justify-between gap-4 rounded-[22px] border border-slate-200 bg-white p-4">
              <span>
                <span className="block text-sm font-black text-slate-900">Enable discounts</span>
                <span className="mt-1 block text-xs leading-5 text-slate-600">Allows active discounts to appear at checkout and be applied to the order total.</span>
              </span>
              <input type="checkbox" checked={form.discountsEnabled} onChange={(e) => update("discountsEnabled", e.target.checked)} className="mt-1 h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-200" />
            </label>
            <label className="flex items-start justify-between gap-4 rounded-[22px] border border-slate-200 bg-white p-4">
              <span>
                <span className="block text-sm font-black text-slate-900">Show discount popup on loading</span>
                <span className="mt-1 block text-xs leading-5 text-slate-600">Shows a tasteful offers popup when the storefront loads, if there are active visible offers.</span>
              </span>
              <input type="checkbox" checked={form.discountPopupEnabled} onChange={(e) => update("discountPopupEnabled", e.target.checked)} className="mt-1 h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-200" />
            </label>
            <Field label="Popup title"><input value={form.discountPopupTitle} onChange={(e) => update("discountPopupTitle", e.target.value)} className="input" placeholder="Today’s offers" /></Field>
            <Field label="Popup message"><input value={form.discountPopupMessage} onChange={(e) => update("discountPopupMessage", e.target.value)} className="input" placeholder="Tap an offer at checkout to apply it." /></Field>
          </div>

          <div className="mt-5 flex flex-col gap-3 rounded-[22px] border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-black text-slate-950">Discount rules</p>
              <p className="mt-1 text-xs leading-5 text-slate-600">Use product rules for one product, combo rules for up to three products, or site-wide rules for the full basket. Leave code blank for an automatic visible offer.</p>
            </div>
            <button type="button" onClick={addDiscountRule} className="inline-flex min-h-10 items-center justify-center rounded-2xl bg-slate-950 px-4 py-2 text-xs font-black text-white shadow-sm">Add discount</button>
          </div>

          <div className="mt-4 space-y-4">
            {(form.discountRules || []).length ? form.discountRules.map((rule, index) => (
              <div key={rule.id || index} className="rounded-[24px] border border-emerald-300 bg-emerald-100/70 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-black text-slate-950">{rule.name || `Discount ${index + 1}`}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-600">{rule.scope === "combo" ? "Combination offer" : rule.scope === "product" ? "Product offer" : "Site-wide offer"} · {rule.type === "percentage" ? `${rule.value || 0}%` : `${form.currencySymbol || ""}${rule.value || 0}`}</p>
                  </div>
                  <button type="button" onClick={() => removeDiscountRule(index)} className="inline-flex min-h-9 items-center justify-center rounded-full border border-rose-200 bg-white px-3 py-2 text-[11px] font-black text-rose-700">Remove</button>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <Field label="Discount name"><input value={rule.name} onChange={(e) => updateDiscountRule(index, { name: e.target.value })} className="input" placeholder="Lunch special" /></Field>
                  <Field label="Code to copy/paste"><input value={rule.code} onChange={(e) => updateDiscountRule(index, { code: e.target.value.toUpperCase() })} className="input" placeholder="SAVE10" /></Field>
                  <Field label="Discount type"><select value={rule.type} onChange={(e) => updateDiscountRule(index, { type: e.target.value as DiscountRuleForm["type"] })} className="input"><option value="percentage">Percentage</option><option value="fixed">Fixed amount</option></select></Field>
                  <Field label={rule.type === "percentage" ? "Discount %" : "Fixed amount"}><input type="number" min={0} max={rule.type === "percentage" ? 95 : undefined} step="0.1" value={rule.value} onChange={(e) => updateDiscountRule(index, { value: e.target.value })} className="input" /></Field>
                  <Field label="Applies to"><select value={rule.scope} onChange={(e) => updateDiscountRule(index, { scope: e.target.value as DiscountRuleForm["scope"], productIds: e.target.value === "sitewide" ? [] : rule.productIds })} className="input"><option value="sitewide">Site-wide basket</option><option value="product">Specific product</option><option value="combo">Combination of products</option></select></Field>
                  <Field label="Start date"><input type="datetime-local" value={rule.startsAt} onChange={(e) => updateDiscountRule(index, { startsAt: e.target.value })} className="input" /></Field>
                  <Field label="End date"><input type="datetime-local" value={rule.endsAt} onChange={(e) => updateDiscountRule(index, { endsAt: e.target.value })} className="input" /></Field>
                </div>
                {rule.scope !== "sitewide" ? (
                  <div className="mt-4 rounded-[22px] border border-emerald-200 bg-white/75 p-3">
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-900">Choose products {rule.scope === "combo" ? "for this bundle, up to 3" : "for this offer"}</p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {discountProductOptions.length ? discountProductOptions.map((product) => (
                        <label key={product.id} className="flex items-start gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700">
                          <input type="checkbox" checked={(rule.productIds || []).includes(product.id)} onChange={(e) => toggleDiscountProduct(index, product.id, e.target.checked)} disabled={!(rule.productIds || []).includes(product.id) && (rule.productIds || []).length >= 3} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-200" />
                          <span><strong className="block text-slate-950">{product.name}</strong><span>{formatMoney(Number(product.price || 0), moneySettings)}</span></span>
                        </label>
                      )) : <p className="text-xs text-slate-500">Products will appear here after the menu has products.</p>}
                    </div>
                  </div>
                ) : null}
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-700"><input type="checkbox" checked={rule.isActive} onChange={(e) => updateDiscountRule(index, { isActive: e.target.checked })} className="mt-1 h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-200" /><span><strong className="text-slate-900">Active</strong><span className="block text-xs">Inactive discounts are saved but ignored.</span></span></label>
                  <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-700"><input type="checkbox" checked={rule.showOnCheckout} onChange={(e) => updateDiscountRule(index, { showOnCheckout: e.target.checked })} className="mt-1 h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-200" /><span><strong className="text-slate-900">Show on checkout</strong><span className="block text-xs">Customers can tap Apply instead of typing the code.</span></span></label>
                  <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-700"><input type="checkbox" checked={rule.allowWithRewards} onChange={(e) => updateDiscountRule(index, { allowWithRewards: e.target.checked })} className="mt-1 h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-200" /><span><strong className="text-slate-900">Can be used with rewards</strong><span className="block text-xs">Turn off if this discount replaces the customer tier reward.</span></span></label>
                  <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-700"><input type="checkbox" checked={rule.onlyThisDiscount} onChange={(e) => updateDiscountRule(index, { onlyThisDiscount: e.target.checked, allowWithRewards: e.target.checked ? false : rule.allowWithRewards })} className="mt-1 h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-200" /><span><strong className="text-slate-900">Only this discount applies</strong><span className="block text-xs">Blocks reward stacking and future promo stacking.</span></span></label>
                  <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-700 md:col-span-2"><input type="checkbox" checked={rule.popupEnabled} onChange={(e) => updateDiscountRule(index, { popupEnabled: e.target.checked })} className="mt-1 h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-200" /><span><strong className="text-slate-900">Feature in loading popup</strong><span className="block text-xs">Best for site-wide campaigns or limited-time bundles.</span></span></label>
                </div>
                {rule.popupEnabled ? (
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <Field label="Offer popup title"><input value={rule.popupTitle} onChange={(e) => updateDiscountRule(index, { popupTitle: e.target.value })} className="input" placeholder="Limited-time offer" /></Field>
                    <Field label="Offer popup message"><input value={rule.popupMessage} onChange={(e) => updateDiscountRule(index, { popupMessage: e.target.value })} className="input" placeholder="Add your favourites and apply this at checkout." /></Field>
                  </div>
                ) : null}
              </div>
            )) : (
              <div className="rounded-[22px] border border-dashed border-slate-300 bg-slate-50 p-4 text-sm leading-6 text-slate-600">No discounts yet. Add your first product, combo or site-wide offer when you are ready.</div>
            )}
          </div>
        </Section>



        <Section id="storefront-payment-options" title="Storefront payment options" dirty={paymentDirty} saving={saving}>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="mx-auto w-full rounded-[22px] border border-emerald-300 bg-emerald-100/70 p-4">
              <label className="flex items-start justify-between gap-4">
                <span>
                  <span className="block text-sm font-black text-slate-900">Cash on collection</span>
                  <span className="mt-1 block text-xs leading-5 text-slate-600">Allow customers collecting their order to pay the store directly on collection.</span>
                </span>
                <input
                  type="checkbox"
                  checked={form.enableCashOnCollection}
                  onChange={(e) => update("enableCashOnCollection", e.target.checked)}
                  className="mt-1 h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-200"
                />
              </label>
            </div>
            <div className="mx-auto w-full rounded-[22px] border border-emerald-300 bg-emerald-100/70 p-4">
              <label className="flex items-start justify-between gap-4">
                <span>
                  <span className="block text-sm font-black text-slate-900">Cash on delivery</span>
                  <span className="mt-1 block text-xs leading-5 text-slate-600">Allow delivery customers to pay the store directly when the order arrives.</span>
                </span>
                <input
                  type="checkbox"
                  checked={form.enableCashOnDelivery}
                  onChange={(e) => update("enableCashOnDelivery", e.target.checked)}
                  className="mt-1 h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-200"
                />
              </label>
            </div>
          </div>

          <div className="mt-6">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-slate-600">Online payment providers</p>
            <p className="mt-2 text-xs leading-5 text-slate-600">These settings belong to the store owner. They do not use the Orduva owner Stripe account that collects SaaS subscriptions.</p>
            <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-950">
              <strong>Important:</strong> each store must use its own payment provider account. For Stripe, use the tenant's own Stripe keys, not the Orduva subscription billing keys.
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <PaymentGatewayCard
              title="Stripe customer payments"
              description="Cards and wallet payments through the tenant's own Stripe account."
              badge={stripeCredentialReady ? "credentials saved" : "not configured"}
              tone={stripeCredentialReady ? "ready" : "idle"}
            >
              <div className="space-y-4 text-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="font-black text-slate-950">Stripe customer payments</p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">Save this tenant's own Stripe keys and webhook secret. Once enabled, Stripe appears as a customer payment option on the storefront checkout.</p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setStripeGuideOpen(true)}
                    className="inline-flex min-h-9 items-center justify-center rounded-full border border-indigo-200 bg-indigo-50 px-3 py-2 text-[11px] font-black text-indigo-800 transition hover:bg-indigo-100"
                  >
                    Help me find these keys
                  </button>
                  <span className={`w-fit rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${stripeCredentialReady ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-slate-50 text-slate-600"}`}>
                    {stripeCredentialReady ? "credentials saved" : "not configured"}
                  </span>
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <Field label="Stripe setup mode">
                  <select value={form.stripeCustomerPaymentMode} onChange={(e) => update("stripeCustomerPaymentMode", e.target.value as FormState["stripeCustomerPaymentMode"])} className="input">
                    <option value="manual_keys">Tenant Stripe keys</option>
                    <option value="stripe_connect">Stripe Connect - later</option>
                  </select>
                </Field>
                <Field label="Account label / business name">
                  <input value={form.stripeCustomerAccountLabel} onChange={(e) => update("stripeCustomerAccountLabel", e.target.value)} placeholder="Example: ZimZa Express Stripe" className="input" />
                </Field>
                <Field label="Tenant Stripe publishable key">
                  <input value={form.stripeCustomerPublishableKey} onChange={(e) => update("stripeCustomerPublishableKey", e.target.value)} placeholder="pk_test_... or pk_live_..." className="input" autoComplete="off" />
                </Field>
                <Field label={form.stripeCustomerSecretKeySet ? `Tenant secret key saved (${form.stripeCustomerSecretKeyHint || "saved"})` : "Tenant Stripe secret key"}>
                  <input value={form.stripeCustomerSecretKeyInput} onChange={(e) => update("stripeCustomerSecretKeyInput", e.target.value)} placeholder={form.stripeCustomerSecretKeySet ? "Leave blank to keep saved secret key" : "sk_test_... or sk_live_..."} className="input" autoComplete="off" />
                </Field>
                <Field label={form.stripeCustomerWebhookSecretSet ? `Tenant webhook secret saved (${form.stripeCustomerWebhookSecretHint || "saved"})` : "Tenant Stripe webhook secret"}>
                  <input value={form.stripeCustomerWebhookSecretInput} onChange={(e) => update("stripeCustomerWebhookSecretInput", e.target.value)} placeholder={form.stripeCustomerWebhookSecretSet ? "Leave blank to keep saved webhook secret" : "whsec_..."} className="input" autoComplete="off" />
                  <p className="mt-2 text-xs leading-5 text-amber-700">Webhook endpoint URL: https://www.orduva.com/api/storefront/stripe/webhook</p>
                </Field>
                <Field label="Setup notes">
                  <input value={form.stripeCustomerSetupNotes} onChange={(e) => update("stripeCustomerSetupNotes", e.target.value)} placeholder="Example: Tenant live Stripe account added by owner" className="input" />
                </Field>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.stripeCustomerTestMode}
                    onChange={(e) => update("stripeCustomerTestMode", e.target.checked)}
                    className="mt-1 h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-200"
                  />
                  <span><strong className="text-slate-900">Test mode credentials</strong><span className="mt-1 block text-xs leading-5 text-slate-600">Use test keys until the tenant is ready for real customer payments.</span></span>
                </label>
                <label className={`flex items-start gap-3 rounded-2xl border p-3 text-sm ${stripeCredentialReady ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-slate-200 bg-slate-100 text-slate-500"}`}>
                  <input
                    type="checkbox"
                    checked={form.enableStripeCustomerPayments}
                    onChange={(e) => update("enableStripeCustomerPayments", e.target.checked)}
                    disabled={!stripeCredentialReady}
                    className="mt-1 h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-200 disabled:opacity-50"
                  />
                  <span><strong>Enable Stripe for this tenant</strong><span className="mt-1 block text-xs leading-5">Requires this tenant's publishable key, secret key and webhook secret. When enabled, Stripe appears on the customer checkout for this store.</span></span>
                </label>
              </div>

              {!stripeCredentialReady ? (
                <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900">Add this tenant's Stripe publishable key, secret key and webhook secret before enabling Stripe.</p>
              ) : null}
              </div>
            </PaymentGatewayCard>

            <PaymentGatewayCard
              title="Yoco customer payments"
              description="Hosted Yoco checkout for South African ZAR stores."
              badge={form.enableYocoCustomerPayments ? form.yocoConnectionStatus : "not configured"}
              tone={yocoReadyForCheckout ? "ready" : yocoCredentialReady ? "warning" : "idle"}
            >
              <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-black text-slate-950">Yoco customer payments</p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">Hosted Yoco checkout for South African ZAR stores. Customer payments can be switched live once the tenant's Yoco secret key has been saved and tested.</p>
                </div>
                <span className={`inline-flex w-fit rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${yocoCredentialReady ? "border-emerald-200 bg-white text-emerald-800" : "border-slate-200 bg-white text-slate-500"}`}>
                  {form.enableYocoCustomerPayments ? form.yocoConnectionStatus : "not configured"}
                </span>
              </div>

              {!yocoCurrencyAllowed ? (
                <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900">Yoco is currently intended for South African Rand stores. Change the store currency to ZAR before enabling Yoco.</p>
              ) : null}

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <Field label="Yoco mode">
                  <select value={form.yocoCustomerMode} onChange={(e) => setYocoMode(e.target.value as FormState["yocoCustomerMode"])} className="input">
                    <option value="test">Test credentials</option>
                    <option value="live">Live credentials</option>
                  </select>
                  <p className="mt-2 text-xs leading-5 text-slate-500">Changing mode resets the webhook and checkout switch so Test and Live credentials cannot be mixed accidentally.</p>
                </Field>
                <Field label="Yoco account label">
                  <input value={form.yocoCustomerAccountLabel} onChange={(e) => update("yocoCustomerAccountLabel", e.target.value)} placeholder="Example: Kahuna Yoco account" className="input" />
                </Field>
                <Field label={form.yocoCustomerSecretKeySet ? `Yoco secret key saved (${form.yocoCustomerSecretKeyHint || "saved"})` : "Yoco secret key"}>
                  <input value={form.yocoCustomerSecretKeyInput} onChange={(e) => update("yocoCustomerSecretKeyInput", e.target.value)} placeholder={form.yocoCustomerSecretKeySet ? "Leave blank to keep saved Yoco secret key" : "Yoco secret key from the tenant's Yoco portal"} className="input" autoComplete="off" />
                </Field>
                <Field label={form.yocoCustomerWebhookSecretSet ? `Yoco webhook secret saved (${form.yocoCustomerWebhookSecretHint || "saved"})` : "Yoco webhook secret / signing key"}>
                  <input value={form.yocoCustomerWebhookSecretInput} onChange={(e) => update("yocoCustomerWebhookSecretInput", e.target.value)} placeholder={form.yocoCustomerWebhookSecretSet ? "Leave blank to keep saved webhook secret" : "Use the register button below, or paste the Yoco webhook secret if already created"} className="input" autoComplete="off" />
                  <p className="mt-2 text-xs leading-5 text-emerald-800">Webhook endpoint URL: {form.yocoCustomerWebhookUrl || "https://www.orduva.com/api/storefront/yoco/webhook"}</p>
                  {form.yocoCustomerWebhookId ? <p className="mt-1 text-xs leading-5 text-slate-500">Yoco webhook ID: {form.yocoCustomerWebhookId}</p> : null}
                </Field>
                <div className="md:col-span-2">
                  <Field label="Yoco setup notes">
                    <input value={form.yocoCustomerSetupNotes} onChange={(e) => update("yocoCustomerSetupNotes", e.target.value)} placeholder="Example: Test Yoco key saved, waiting for checkout build" className="input" />
                  </Field>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-emerald-100 bg-white p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-black text-slate-950">Yoco webhook setup</p>
                    <p className="mt-1 text-xs leading-5 text-slate-600">Register the Orduva webhook with Yoco after the Test Secret Key is saved. This lets Yoco confirm paid orders even if the customer closes the browser.</p>
                  </div>
                  <button
                    type="button"
                    onClick={registerYocoWebhook}
                    disabled={yocoWebhookRegistering || !yocoCurrencyAllowed || !form.yocoCustomerSecretKeySet || yocoWebhookReady || yocoSetupNeedsSaveBeforeWebhook}
                    className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-700 px-4 py-2 text-xs font-black text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-500"
                  >
                    {yocoWebhookRegistering ? "Registering..." : yocoWebhookReady ? "Webhook saved" : yocoSetupNeedsSaveBeforeWebhook ? "Save changes first" : "Register Yoco webhook"}
                  </button>
                </div>
                {!form.yocoCustomerSecretKeySet ? <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900">Save the Yoco secret key first, then come back and register the webhook.</p> : null}
                {yocoSetupNeedsSaveBeforeWebhook ? <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900">Save the selected Yoco mode/secret key before registering the webhook.</p> : null}
                {yocoWebhookReady ? <p className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-900">Webhook secret is saved for the current Yoco mode. Paid orders can now be confirmed by webhook.</p> : null}
              </div>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-black text-slate-950">Yoco live-mode readiness</p>
                    <p className="mt-1 text-xs leading-5 text-slate-600">Use this checklist before moving a tenant from Test to Live. Live mode should use the tenant's Live Secret Key and a webhook registered after the Live key is saved.</p>
                  </div>
                  <span className={`inline-flex w-fit rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${yocoReadyForCheckout ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
                    {yocoReadyForCheckout ? "checkout visible" : "not visible"}
                  </span>
                </div>
                <div className="mt-3 grid gap-2 text-xs font-bold sm:grid-cols-2">
                  <p className={yocoCurrencyAllowed ? "text-emerald-800" : "text-amber-800"}>✓ Store currency: {yocoCurrencyAllowed ? "ZAR" : "Change to ZAR"}</p>
                  <p className={yocoCredentialReady ? "text-emerald-800" : "text-amber-800"}>✓ Secret key: {yocoCredentialReady ? "saved" : "required"}</p>
                  <p className={yocoWebhookReady ? "text-emerald-800" : "text-amber-800"}>✓ Webhook: {yocoWebhookReady ? "saved" : "register before live use"}</p>
                  <p className={yocoLiveMode ? "text-emerald-800" : "text-slate-600"}>✓ Mode: {yocoLiveMode ? "Live" : "Test"}</p>
                </div>
                {yocoLiveMode && !yocoWebhookReady ? <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900">Live mode should not be used without registering the Live webhook first.</p> : null}
              </div>

              <label className={`mt-4 flex items-start gap-3 rounded-2xl border p-3 text-sm ${yocoCurrencyAllowed && yocoCredentialReady ? "border-emerald-200 bg-white text-emerald-900" : "border-slate-200 bg-white text-slate-500"}`}>
                <input
                  type="checkbox"
                  checked={form.enableYocoCustomerPayments}
                  onChange={(e) => update("enableYocoCustomerPayments", e.target.checked)}
                  disabled={!yocoCurrencyAllowed || !yocoCredentialReady}
                  className="mt-1 h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-200 disabled:opacity-50"
                />
                <span><strong>Enable Yoco setup for this tenant</strong><span className="mt-1 block text-xs leading-5">Requires ZAR currency and a saved Yoco secret key. This makes Yoco available to be switched on for checkout.</span></span>
              </label>

              <label className={`mt-3 flex items-start gap-3 rounded-2xl border p-3 text-sm ${form.enableYocoCustomerPayments && yocoCurrencyAllowed && yocoCredentialReady ? "border-emerald-200 bg-white text-emerald-900" : "border-slate-200 bg-white text-slate-500"}`}>
                <input
                  type="checkbox"
                  checked={form.yocoCustomerPaymentsLive}
                  onChange={(e) => update("yocoCustomerPaymentsLive", e.target.checked)}
                  disabled={!form.enableYocoCustomerPayments || !yocoCurrencyAllowed || !yocoCredentialReady || (yocoLiveMode && !yocoWebhookReady)}
                  className="mt-1 h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-200 disabled:opacity-50"
                />
                <span><strong>Show Yoco on customer checkout</strong><span className="mt-1 block text-xs leading-5">When enabled, ZAR storefront customers can choose Yoco and will be sent to the hosted Yoco payment page. Live mode requires a saved webhook first.</span></span>
              </label>
              </div>
            </PaymentGatewayCard>

            <PaymentGatewayCard
              title="M-Pesa / Pesapal customer payments"
              description="Hosted Pesapal checkout for Kenyan KES stores."
              badge={mpesaReadyForCheckout ? "checkout visible" : form.enableMpesaCustomerPayments ? form.mpesaConnectionStatus : "not configured"}
              tone={mpesaReadyForCheckout ? "ready" : form.enableMpesaCustomerPayments ? "warning" : "idle"}
            >
              <div className="space-y-4 text-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-black text-slate-950">M-Pesa / Pesapal customer payments</p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">Hosted Pesapal checkout for Kenyan KES stores. Customers will choose M-Pesa on the Pesapal payment page.</p>
                </div>
                <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${mpesaReadyForCheckout ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-slate-50 text-slate-600"}`}>
                  {form.enableMpesaCustomerPayments ? form.mpesaConnectionStatus : "not configured"}
                </span>
              </div>

              {!mpesaCurrencyAllowed ? <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900">M-Pesa/Pesapal is currently intended for Kenyan Shilling stores. Change the store currency to KES before enabling it.</p> : null}

              <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold leading-5 text-red-900">
                Important testing safety: Pesapal sandbox hosted checkout can still trigger a real M-Pesa debit on a real Kenyan phone. Ver-0.215A blocks sandbox hosted checkout by default. Use live mode with the tenant's own Pesapal merchant account for controlled low-value tests, or only enable sandbox hosted checkout with the server environment flag after accepting that risk.
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <Field label="Pesapal mode">
                  <select value={form.mpesaCustomerMode} onChange={(e) => update("mpesaCustomerMode", e.target.value as FormState["mpesaCustomerMode"])} className="input">
                    <option value="test">Test / sandbox (configuration only by default)</option>
                    <option value="live">Live</option>
                  </select>
                </Field>
                <Field label="Pesapal account label">
                  <input value={form.mpesaCustomerAccountLabel} onChange={(e) => update("mpesaCustomerAccountLabel", e.target.value)} placeholder="Example: Nairobi Cafe Pesapal" className="input" />
                </Field>
                <Field label="Pesapal consumer key">
                  <input value={form.mpesaCustomerConsumerKey} onChange={(e) => update("mpesaCustomerConsumerKey", e.target.value)} placeholder="Tenant Pesapal consumer key" className="input" autoComplete="off" />
                </Field>
                <Field label={form.mpesaCustomerConsumerSecretSet ? `Pesapal consumer secret saved (${form.mpesaCustomerConsumerSecretHint || "saved"})` : "Pesapal consumer secret"}>
                  <input value={form.mpesaCustomerConsumerSecretInput} onChange={(e) => update("mpesaCustomerConsumerSecretInput", e.target.value)} placeholder={form.mpesaCustomerConsumerSecretSet ? "Leave blank to keep saved Pesapal secret" : "Tenant Pesapal consumer secret"} className="input" autoComplete="off" />
                </Field>
                <Field label="Pesapal IPN notification ID">
                  <input value={form.mpesaCustomerIpnId} onChange={(e) => update("mpesaCustomerIpnId", e.target.value)} placeholder="Notification ID generated by Pesapal" className="input" autoComplete="off" />
                  <p className="mt-1 text-xs leading-5 text-emerald-800">Use this IPN URL in Pesapal: https://www.orduva.com/api/storefront/mpesa/ipn</p>
                </Field>
                <Field label="M-Pesa/Pesapal setup notes">
                  <input value={form.mpesaCustomerSetupNotes} onChange={(e) => update("mpesaCustomerSetupNotes", e.target.value)} placeholder="Example: Sandbox keys saved, waiting for test payment" className="input" />
                </Field>
              </div>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-black text-slate-950">M-Pesa live readiness</p>
                    <p className="mt-1 text-xs leading-5 text-slate-600">Pesapal requires a consumer key, consumer secret and registered IPN notification ID. Sandbox mode is now treated as configuration-only unless the server explicitly allows sandbox hosted checkout.</p>
                  </div>
                  <span className={`inline-flex w-fit rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${mpesaReadyForCheckout ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
                    {mpesaReadyForCheckout ? "checkout visible" : "not visible"}
                  </span>
                </div>
                <div className="mt-3 grid gap-2 text-xs font-bold sm:grid-cols-2">
                  <p className={mpesaCurrencyAllowed ? "text-emerald-800" : "text-amber-800"}>✓ Store currency: {mpesaCurrencyAllowed ? "KES" : "Change to KES"}</p>
                  <p className={form.mpesaCustomerConsumerKey.trim() ? "text-emerald-800" : "text-amber-800"}>✓ Consumer key: {form.mpesaCustomerConsumerKey.trim() ? "saved" : "required"}</p>
                  <p className={(form.mpesaCustomerConsumerSecretSet || form.mpesaCustomerConsumerSecretInput.trim()) ? "text-emerald-800" : "text-amber-800"}>✓ Consumer secret: {(form.mpesaCustomerConsumerSecretSet || form.mpesaCustomerConsumerSecretInput.trim()) ? "saved" : "required"}</p>
                  <p className={form.mpesaCustomerIpnId.trim() ? "text-emerald-800" : "text-amber-800"}>✓ IPN ID: {form.mpesaCustomerIpnId.trim() ? "saved" : "required"}</p>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-orange-200 bg-orange-50/70 p-4 text-sm text-orange-950">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-black text-slate-950">Pesapal recovery and diagnostics</p>
                    <p className="mt-1 text-xs leading-5 text-slate-700">Use this only for stuck M-Pesa/Pesapal attempts. It checks Pesapal directly, blocks order creation unless Pesapal returns COMPLETED, and can mark non-completed attempts as failed for review.</p>
                  </div>
                  <span className="inline-flex w-fit rounded-full border border-orange-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-orange-900">admin only</span>
                </div>

                <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_auto_auto_auto] lg:items-end">
                  <Field label="Checkout ID / OrderTrackingId / merchant reference">
                    <input
                      value={mpesaDiagnosticReference}
                      onChange={(event) => setMpesaDiagnosticReference(event.target.value)}
                      placeholder="Example: 520349f3-... or ORDUVA-b623..."
                      className="input"
                      autoComplete="off"
                    />
                  </Field>
                  <button
                    type="button"
                    onClick={() => runMpesaDiagnostic("check")}
                    disabled={mpesaDiagnosticChecking}
                    className="admin-pressable inline-flex min-h-12 items-center justify-center rounded-2xl border border-orange-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-orange-900 shadow-sm transition hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {mpesaDiagnosticChecking && mpesaDiagnosticAction === "check" ? "Checking..." : "Check status"}
                  </button>
                  <button
                    type="button"
                    onClick={() => runMpesaDiagnostic("create_order")}
                    disabled={mpesaDiagnosticChecking || mpesaDiagnosticResult?.safeToCreateOrder !== true}
                    className="admin-pressable inline-flex min-h-12 items-center justify-center rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-emerald-900 shadow-sm transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-45"
                    title="Disabled until the status check says Pesapal completed the payment."
                  >
                    {mpesaDiagnosticChecking && mpesaDiagnosticAction === "create_order" ? "Creating..." : "Create order"}
                  </button>
                  <button
                    type="button"
                    onClick={() => runMpesaDiagnostic("mark_failed")}
                    disabled={mpesaDiagnosticChecking || mpesaDiagnosticResult?.safeToCreateOrder === true}
                    className="admin-pressable inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {mpesaDiagnosticChecking && mpesaDiagnosticAction === "mark_failed" ? "Updating..." : "Mark failed"}
                  </button>
                </div>

                {mpesaDiagnosticResult ? (
                  <div className={`mt-4 rounded-2xl border p-4 ${mpesaDiagnosticResult.error ? "border-rose-200 bg-rose-50 text-rose-900" : mpesaDiagnosticResult.safeToCreateOrder ? "border-emerald-200 bg-emerald-50 text-emerald-950" : "border-amber-200 bg-amber-50 text-amber-950"}`}>
                    <p className="text-sm font-black">{mpesaDiagnosticResult.error ? "Diagnostic error" : mpesaDiagnosticResult.safeToCreateOrder ? "Payment completed" : "Payment not completed"}</p>
                    <p className="mt-1 text-xs leading-5">{mpesaDiagnosticResult.error || mpesaDiagnosticResult.message || "Status checked."}</p>
                    {mpesaDiagnosticResult.intent ? (
                      <div className="mt-3 grid gap-2 text-xs font-bold sm:grid-cols-2">
                        <p>Intent: <span className="font-mono font-semibold">{mpesaDiagnosticResult.intent.id || "—"}</span></p>
                        <p>Status: {mpesaDiagnosticResult.intent.status || "—"}</p>
                        <p>Amount: {mpesaDiagnosticResult.intent.currencyCode || ""} {mpesaDiagnosticResult.intent.amountTotal ?? "—"}</p>
                        <p>Order: {mpesaDiagnosticResult.intent.orderId || mpesaDiagnosticResult.orderId || "not created"}</p>
                        <p className="sm:col-span-2">OrderTrackingId: <span className="font-mono font-semibold">{mpesaDiagnosticResult.intent.pesapalOrderTrackingId || "—"}</span></p>
                        <p className="sm:col-span-2">Merchant ref: <span className="font-mono font-semibold">{mpesaDiagnosticResult.intent.pesapalMerchantReference || "—"}</span></p>
                      </div>
                    ) : null}
                    {mpesaDiagnosticResult.pesapal ? (
                      <div className="mt-3 rounded-2xl border border-white/70 bg-white/70 p-3 text-xs leading-5">
                        <p><strong>Pesapal status:</strong> {mpesaDiagnosticResult.pesapal.status || "—"} / code {String(mpesaDiagnosticResult.pesapal.statusCode ?? "—")}</p>
                        <p><strong>HTTP:</strong> {mpesaDiagnosticResult.pesapal.httpStatus ?? "—"}</p>
                        <p><strong>Confirmation:</strong> {mpesaDiagnosticResult.pesapal.confirmationCode || "—"}</p>
                        <p><strong>Method:</strong> {mpesaDiagnosticResult.pesapal.paymentMethod || "—"}</p>
                        {mpesaDiagnosticResult.pesapal.errorMessage ? <p><strong>Message:</strong> {mpesaDiagnosticResult.pesapal.errorMessage}</p> : null}
                      </div>
                    ) : null}
                    {mpesaDiagnosticResult.pesapal?.raw ? (
                      <details className="mt-3 rounded-2xl border border-white/70 bg-white/70 p-3 text-xs">
                        <summary className="cursor-pointer font-black">Raw Pesapal response</summary>
                        <pre className="mt-2 max-h-60 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-slate-950 p-3 text-[11px] leading-5 text-white">{JSON.stringify(mpesaDiagnosticResult.pesapal.raw, null, 2)}</pre>
                      </details>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <label className={`mt-4 flex items-start gap-3 rounded-2xl border p-3 text-sm ${mpesaCurrencyAllowed && mpesaCredentialReady ? "border-emerald-200 bg-white text-emerald-900" : "border-slate-200 bg-white text-slate-500"}`}>
                <input
                  type="checkbox"
                  checked={form.enableMpesaCustomerPayments}
                  onChange={(e) => update("enableMpesaCustomerPayments", e.target.checked)}
                  disabled={!mpesaCurrencyAllowed || !mpesaCredentialReady}
                  className="mt-1 h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-200 disabled:opacity-50"
                />
                <span><strong>Enable M-Pesa setup for this tenant</strong><span className="mt-1 block text-xs leading-5">Requires KES currency, Pesapal credentials and an IPN notification ID. This makes M-Pesa/Pesapal available to be switched on for checkout.</span></span>
              </label>

              <label className={`mt-3 flex items-start gap-3 rounded-2xl border p-3 text-sm ${form.enableMpesaCustomerPayments && mpesaCurrencyAllowed && mpesaCredentialReady ? "border-emerald-200 bg-white text-emerald-900" : "border-slate-200 bg-white text-slate-500"}`}>
                <input
                  type="checkbox"
                  checked={form.mpesaCustomerPaymentsLive}
                  onChange={(e) => update("mpesaCustomerPaymentsLive", e.target.checked)}
                  disabled={!form.enableMpesaCustomerPayments || !mpesaCurrencyAllowed || !mpesaCredentialReady}
                  className="mt-1 h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-200 disabled:opacity-50"
                />
                <span><strong>Show M-Pesa on customer checkout</strong><span className="mt-1 block text-xs leading-5">When enabled, KES storefront customers can choose M-Pesa and will be sent to Pesapal's hosted payment page. In test/sandbox mode the server will block checkout unless sandbox hosted checkout has been deliberately allowed via environment flag.</span></span>
              </label>
              </div>
            </PaymentGatewayCard>

            <PaymentGatewayCard
              title="Direct M-Pesa / Safaricom Daraja"
              description="Direct STK Push preparation for Kenyan KES stores."
              badge={form.enableDarajaCustomerPayments ? form.darajaConnectionStatus : "not configured"}
              tone={darajaCredentialReady ? "ready" : form.enableDarajaCustomerPayments ? "warning" : "idle"}
            >
              <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-black text-slate-950">Direct M-Pesa / Safaricom Daraja foundation</p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">Store the tenant's Daraja credentials and run direct Safaricom STK Push checkout. Ver-0.218 confirms successful callbacks, creates the order, stores the M-Pesa receipt and clears the cart.</p>
                </div>
                <span className={`inline-flex w-fit rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${darajaCredentialReady ? "border-emerald-200 bg-white text-emerald-800" : "border-slate-200 bg-white text-slate-500"}`}>
                  {form.darajaPaymentsLive ? "checkout live" : form.enableDarajaCustomerPayments ? form.darajaConnectionStatus : "not configured"}
                </span>
              </div>

              {!darajaCurrencyAllowed ? (
                <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900">Direct M-Pesa Daraja is prepared for Kenyan Shilling stores. Change the store currency to KES before enabling the Daraja setup.</p>
              ) : null}

              <div className="mt-4 rounded-2xl border border-sky-100 bg-white/80 p-3 text-xs leading-5 text-sky-950">
                <p className="font-black">Live STK Push flow</p>
                <p className="mt-1">Customer enters phone number → Safaricom sends the M-Pesa PIN prompt → Orduva records CheckoutRequestID → Safaricom callback confirms payment → Orduva creates the order and stores the M-Pesa receipt.</p>
              </div>

              <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-xs leading-5 text-emerald-950">
                <p className="font-black">Live tenant checklist</p>
                <p className="mt-1">Before switching customer checkout on, confirm the tenant has live Consumer Key, live Consumer Secret, live shortcode/till/paybill, live Lipa Na M-Pesa Online passkey, KES currency and the correct transaction type.</p>
              </div>

              {darajaModeLive && darajaUsesSandboxShortcode ? (
                <p className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-900">Live mode cannot use the sandbox shortcode 174379. Replace it with the tenant's live PayBill or Till number before exposing Direct M-Pesa checkout.</p>
              ) : null}

              {form.darajaPaymentsLive ? (
                <p className="mt-3 rounded-2xl border border-emerald-200 bg-white px-3 py-2 text-xs font-bold text-emerald-900">Direct M-Pesa is currently visible on customer checkout for KES stores. Keep this on only after the live credentials and shortcode have been confirmed.</p>
              ) : null}

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <Field label="Daraja mode">
                  <select value={form.darajaCustomerMode} onChange={(e) => update("darajaCustomerMode", e.target.value as FormState["darajaCustomerMode"])} className="input">
                    <option value="sandbox">Sandbox credentials</option>
                    <option value="live">Live credentials / production</option>
                  </select>
                  <p className="mt-2 text-xs leading-5 text-slate-500">Use sandbox for Daraja sandbox tests. Use live only after Safaricom has supplied/activated the tenant's production app, shortcode/till/paybill and Lipa Na M-Pesa Online passkey.</p>
                </Field>
                <Field label="Daraja account label">
                  <input value={form.darajaAccountLabel} onChange={(e) => update("darajaAccountLabel", e.target.value)} placeholder="Example: ZimZa Safaricom Daraja" className="input" />
                </Field>
                <Field label="Daraja consumer key">
                  <input value={form.darajaConsumerKey} onChange={(e) => update("darajaConsumerKey", e.target.value)} placeholder="Consumer key from Safaricom Daraja" className="input" autoComplete="off" />
                </Field>
                <Field label={form.darajaConsumerSecretSet ? `Daraja consumer secret saved (${form.darajaConsumerSecretHint || "saved"})` : "Daraja consumer secret"}>
                  <input value={form.darajaConsumerSecretInput} onChange={(e) => update("darajaConsumerSecretInput", e.target.value)} placeholder={form.darajaConsumerSecretSet ? "Leave blank to keep saved consumer secret" : "Consumer secret from Safaricom Daraja"} className="input" autoComplete="off" />
                </Field>
                <Field label="Business shortcode / till / paybill">
                  <input value={form.darajaShortcode} onChange={(e) => update("darajaShortcode", e.target.value)} placeholder="Example: 174379 for sandbox, tenant live shortcode later" className="input" autoComplete="off" />
                </Field>
                <Field label={form.darajaPasskeySet ? `Daraja passkey saved (${form.darajaPasskeyHint || "saved"})` : "Daraja passkey"}>
                  <input value={form.darajaPasskeyInput} onChange={(e) => update("darajaPasskeyInput", e.target.value)} placeholder={form.darajaPasskeySet ? "Leave blank to keep saved passkey" : "Lipa na M-Pesa Online passkey"} className="input" autoComplete="off" />
                </Field>
                <Field label="Transaction type">
                  <select value={form.darajaTransactionType} onChange={(e) => update("darajaTransactionType", e.target.value as FormState["darajaTransactionType"])} className="input">
                    <option value="CustomerPayBillOnline">CustomerPayBillOnline / Paybill</option>
                    <option value="CustomerBuyGoodsOnline">CustomerBuyGoodsOnline / Till</option>
                  </select>
                </Field>
                <Field label="Account reference prefix">
                  <input value={form.darajaAccountReferencePrefix} onChange={(e) => update("darajaAccountReferencePrefix", e.target.value.toUpperCase())} placeholder="ORDUVA" className="input uppercase" maxLength={40} />
                </Field>
                <div className="md:col-span-2">
                  <Field label="Future Daraja callback URL">
                    <input value={form.darajaCallbackUrl} onChange={(e) => update("darajaCallbackUrl", e.target.value)} placeholder="https://www.orduva.com/api/storefront/daraja/callback" className="input" />
                    <p className="mt-2 text-xs leading-5 text-slate-500">Used as the STK Push callback URL. For Orduva live stores this should normally be https://www.orduva.com/api/storefront/daraja/callback.</p>
                  </Field>
                </div>
                <div className="md:col-span-2">
                  <Field label="Daraja setup notes">
                    <input value={form.darajaSetupNotes} onChange={(e) => update("darajaSetupNotes", e.target.value)} placeholder="Example: Merchant account pending, waiting for live shortcode" className="input" />
                  </Field>
                </div>
              </div>

              <label className={`mt-4 flex items-start gap-3 rounded-2xl border p-3 text-sm ${darajaCurrencyAllowed && darajaCredentialReady ? "border-emerald-200 bg-white text-emerald-900" : "border-slate-200 bg-white text-slate-500"}`}>
                <input
                  type="checkbox"
                  checked={form.enableDarajaCustomerPayments}
                  onChange={(e) => update("enableDarajaCustomerPayments", e.target.checked)}
                  disabled={!darajaLiveReadinessOk && !form.enableDarajaCustomerPayments}
                  className="mt-1 h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-200 disabled:opacity-50"
                />
                <span><strong>Enable direct M-Pesa Daraja setup for this tenant</strong><span className="mt-1 block text-xs leading-5">Requires KES currency, Daraja consumer key, consumer secret, shortcode and passkey. Live mode also requires a real tenant shortcode/till/paybill, not the sandbox shortcode.</span></span>
              </label>

              <label className={`mt-3 flex items-start gap-3 rounded-2xl border p-3 text-sm ${form.enableDarajaCustomerPayments && darajaCurrencyAllowed && darajaCredentialReady ? "border-emerald-200 bg-white text-emerald-900" : "border-slate-200 bg-slate-100 text-slate-500"}`}>
                <input
                  type="checkbox"
                  checked={form.darajaPaymentsLive}
                  onChange={(e) => update("darajaPaymentsLive", e.target.checked)}
                  disabled={!form.enableDarajaCustomerPayments || (!darajaLiveReadinessOk && !form.darajaPaymentsLive)}
                  className="mt-1 h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-200 disabled:opacity-50"
                />
                <span><strong>Show direct M-Pesa on customer checkout</strong><span className="mt-1 block text-xs leading-5">When enabled, KES customers can choose direct M-Pesa, receive a Safaricom STK Push prompt, and Orduva will create the order only after Safaricom confirms successful payment.</span></span>
              </label>
              </div>
            </PaymentGatewayCard>
          </div>
        </Section>

        <Section id="advanced-currency-display" title="Advanced currency display" dirty={currencyDirty} saving={saving}>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Field label="Currency name"><input value={form.currencyName} onChange={(e) => update("currencyName", e.target.value)} className="input" /></Field>
            <Field label="Currency code"><input value={form.currencyCode} onChange={(e) => update("currencyCode", e.target.value.toUpperCase())} className="input uppercase" maxLength={3} /></Field>
            <Field label="Symbol"><input value={form.currencySymbol} onChange={(e) => update("currencySymbol", e.target.value)} className="input" maxLength={12} /></Field>
            <Field label="Suffix"><input value={form.currencySuffix} onChange={(e) => update("currencySuffix", e.target.value)} className="input" maxLength={12} placeholder="Leave blank" /></Field>
            <Field label="Display mode"><select value={form.currencyDisplayMode} onChange={(e) => update("currencyDisplayMode", e.target.value as FormState["currencyDisplayMode"])} className="input"><option value="symbol">Symbol only</option><option value="code">Code only</option><option value="code_symbol">Code + symbol</option><option value="symbol_code">Symbol + code</option><option value="none">No prefix</option></select></Field>
            <Field label="Prefix position"><select value={form.currencySymbolPosition} onChange={(e) => update("currencySymbolPosition", e.target.value as FormState["currencySymbolPosition"])} className="input"><option value="before">Before amount</option><option value="after">After amount</option></select></Field>
            <Field label="Decimal places"><input type="number" min={0} max={4} value={form.currencyDecimalPlaces} onChange={(e) => update("currencyDecimalPlaces", e.target.value)} className="input" /></Field>
          </div>
          <label className="mt-4 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
            <input type="checkbox" checked={form.currencyUseThousandsSeparator} onChange={(e) => update("currencyUseThousandsSeparator", e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
            Use thousands separator
          </label>
          <p className="mt-3 text-xs leading-5 text-slate-500">Currency suffix is optional. Leave it blank for normal pricing, or enter a tenant-specific suffix such as /- only when that store needs it.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[100, 295, 1000].map((amount) => (
              <div key={amount} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Sample</p>
                <p className="mt-2 text-xl font-semibold text-slate-950">{formatMoney(amount, moneySettings)}</p>
              </div>
            ))}
          </div>
        </Section>

        {message ? <div className={`mt-5 rounded-2xl border px-4 py-3 text-sm ${messageClass}`}>{message}</div> : null}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">Use the settings menu to jump between sections. Theme previews now live inside the colour editor only, and operational settings use the full desktop width.</p>
          <button type="submit" disabled={saving || !hasUnsavedChanges} className="admin-pressable inline-flex min-h-12 items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 disabled:opacity-100">
            {saving ? "Saving..." : hasUnsavedChanges ? "Save settings" : "Nothing to save"}
          </button>
        </div>
      </form>

      <AdminToastBubble toast={toast} onClose={() => setToast(null)} />

      <button
        type="button"
        onClick={scrollSettingsToTop}
        className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+5.75rem)] right-4 z-[80] inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/80 bg-white/90 text-slate-800 shadow-[0_16px_42px_rgba(15,23,42,0.20)] backdrop-blur transition hover:-translate-y-[1px] hover:border-orange-200 hover:bg-orange-50 hover:text-orange-800 sm:bottom-10 sm:right-8"
        aria-label="Back to top"
        title="Back to top"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 19V5" />
          <path d="M6 11l6-6 6 6" />
        </svg>
      </button>

      {settingsMenuOpen ? (
        <SettingsMenuModal
          onClose={() => setSettingsMenuOpen(false)}
          onSelect={scrollToSettingsSection}
        />
      ) : null}

      {mobileThemeModal ? (
        <div className="fixed inset-0 z-[90] flex items-end bg-slate-950/55 px-3 pb-3 pt-8 backdrop-blur-[2px] md:hidden" onClick={() => setMobileThemeModal(null)}>
          <div className="max-h-[88dvh] w-full overflow-y-auto rounded-[28px] bg-white p-4 shadow-[0_24px_80px_rgba(15,23,42,0.35)]" onClick={(event) => event.stopPropagation()}>
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">{mobileThemeModal === "preview" ? "Live preview" : "Suggested colours"}</p>
                <h3 className="mt-1 text-lg font-black text-slate-950">{mobileThemeModal === "preview" ? labelForPreview(previewTarget) : "Choose a colour"}</h3>
              </div>
              <button type="button" onClick={() => setMobileThemeModal(null)} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-xl font-bold text-slate-500 shadow-sm" aria-label="Close popup">×</button>
            </div>
            {mobileThemeModal === "preview" ? (
              <PreviewPanel
                target={previewTarget}
                theme={theme}
                previewName={previewName}
                previewHeading={previewHeading}
                previewSubheading={previewSubheading}
                footerBlurb={footerBlurb}
                footerNotice={footerNotice}
                money={formatMoney(295, moneySettings)}
                logoUrl={form.logoUrl}
                faviconUrl={form.faviconUrl}
              />
            ) : renderSuggestedColoursPanel(true)}
          </div>
        </div>
      ) : null}

      {stripeGuideOpen ? (
        <StripeKeyGuideModal onClose={() => setStripeGuideOpen(false)} />
      ) : null}
    </div>
  );
}

function AdminToastBubble({ toast, onClose }: { toast: AdminToast | null; onClose: () => void }) {
  if (!toast) return null;

  const toneClass = toast.tone === "success"
    ? "border-emerald-200/80 bg-white/95 text-emerald-900 shadow-[0_18px_46px_rgba(16,185,129,0.18)]"
    : toast.tone === "error"
      ? "border-rose-200/80 bg-white/95 text-rose-900 shadow-[0_18px_46px_rgba(244,63,94,0.18)]"
      : "border-orange-200/80 bg-white/95 text-orange-950 shadow-[0_18px_46px_rgba(249,115,22,0.16)]";
  const iconClass = toast.tone === "success"
    ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
    : toast.tone === "error"
      ? "bg-rose-50 text-rose-700 ring-rose-100"
      : "bg-orange-50 text-orange-700 ring-orange-100";
  const icon = toast.tone === "success" ? "✓" : toast.tone === "error" ? "!" : "i";

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[120] w-[calc(100vw-2rem)] max-w-sm sm:right-6 sm:top-6" role="status" aria-live="polite">
      <div key={toast.id} className={`pointer-events-auto flex items-start gap-3 rounded-[22px] border px-4 py-3 text-sm leading-5 backdrop-blur transition ${toneClass}`}>
        <span className={`mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm ring-1 ${iconClass}`} aria-hidden="true">{icon}</span>
        <p className="min-w-0 flex-1 text-sm leading-5">{toast.message}</p>
        <button type="button" onClick={onClose} className="-mr-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-lg leading-none text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" aria-label="Dismiss notification">×</button>
      </div>
    </div>
  );
}

function labelForPreview(target: PreviewTarget) {
  if (target === "global") return "Global page";
  if (target === "header") return "Header";
  if (target === "welcome") return "Welcome card";
  if (target === "products") return "Product card";
  if (target === "favourites") return "Favourites";
  return "Footer";
}

function PreviewPanel({ target, theme, previewName, previewHeading, previewSubheading, footerBlurb, footerNotice, money, logoUrl, faviconUrl }: { target: PreviewTarget; theme: StorefrontTheme; previewName: string; previewHeading: string; previewSubheading: string; footerBlurb: string; footerNotice: string; money: string; logoUrl?: string; faviconUrl?: string }) {
  const background = normalizeThemeColor(theme.globalPageBackground, "#F8F4F0");
  const text = normalizeThemeColor(theme.globalText, "#2B2B2B");
  return (
    <div className="mt-3 rounded-[22px] border p-3" style={{ backgroundColor: background, borderColor: normalizeThemeColor(theme.globalBorder, "#D9C7A3"), color: text }}>
      {target === "global" ? <div className="rounded-[18px] border bg-white p-4" style={{ borderColor: normalizeThemeColor(theme.globalBorder, "#D9C7A3") }}><div className="flex items-center gap-3">{logoUrl ? <img src={logoUrl} alt="Logo preview" className="max-h-12 max-w-[150px] object-contain" /> : null}<p className="text-sm font-bold">{previewName}</p></div><p className="mt-2 text-sm" style={{ color: normalizeThemeColor(theme.globalSoftText, "#64748B") }}>This shows the page background, main text and soft text treatment.</p></div> : null}
      {target === "header" ? <div className="rounded-[18px] border p-3" style={{ backgroundColor: normalizeThemeColor(theme.headerBackground, "#FFFFFF"), borderColor: normalizeThemeColor(theme.headerButtonBorder, "#D9C7A3"), color: normalizeThemeColor(theme.headerText, "#2B2B2B") }}><div className="flex items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-3">{logoUrl ? <img src={logoUrl} alt="Logo preview" className="max-h-11 max-w-[145px] shrink-0 object-contain" /> : null}<strong className="truncate">{previewName}</strong></div><div className="flex shrink-0 gap-2"><span className="rounded-xl border bg-white px-3 py-2 text-xs" style={{ borderColor: normalizeThemeColor(theme.headerButtonBorder, "#D9C7A3") }}>Search</span><span className="rounded-xl border bg-white px-3 py-2 text-xs" style={{ borderColor: normalizeThemeColor(theme.headerButtonBorder, "#D9C7A3") }}>Cart</span></div></div>{faviconUrl ? <div className="mt-3 flex items-center gap-2 rounded-xl border border-black/5 bg-white/75 px-3 py-2 text-[11px] opacity-80"><img src={faviconUrl} alt="Favicon preview" className="h-5 w-5 object-contain" /><span>Favicon saved for browser tab / app icon preview</span></div> : null}</div> : null}
      {target === "welcome" ? (
        <div className="rounded-[18px] border p-4" style={{ backgroundColor: normalizeThemeColor(theme.welcomeBackground, "#FFFFFF"), borderColor: normalizeThemeColor(theme.welcomeBorder, "#D9C7A3"), boxShadow: `0 10px 24px ${normalizeThemeColor(theme.welcomeShadow, "#D9C7A3")}18` }}>
          {logoUrl ? <img src={logoUrl} alt="Logo preview" className="mb-3 max-h-14 max-w-[180px] object-contain" /> : null}
          <p className="text-xs font-bold uppercase tracking-[0.22em]" style={{ color: normalizeThemeColor(theme.welcomeLabel, "#C7922F") }}>Welcome</p>
          <h4 className="mt-2 text-xl font-bold" style={{ color: normalizeThemeColor(theme.welcomeHeading, "#0F172A") }}>{previewHeading}</h4>
          <p className="mt-2 text-sm leading-5" style={{ color: normalizeThemeColor(theme.welcomeBody, "#2B2B2B") }}>{previewSubheading}</p>
          <div className="mt-4 flex flex-col items-center gap-2">
            <div className="flex min-h-12 w-full max-w-[220px] items-center justify-center gap-2 rounded-2xl bg-white/90 px-3 py-2 text-xs font-black shadow-sm" style={{ color: normalizeThemeColor(theme.welcomeActionText, "#0F172A"), borderColor: normalizeThemeColor(theme.welcomeActionBorder, "#D9C7A3") }}>
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: normalizeThemeColor(theme.welcomeActionIconBackground, "#10B981"), color: normalizeThemeColor(theme.welcomeActionIconText, "#FFFFFF") }}>✦</span>
              <span>Rewards · Silver</span>
            </div>
            <div className="grid w-full max-w-[240px] grid-cols-3 gap-2 text-center text-[10px] font-bold uppercase">
              {['Offers', 'Favourites', 'Buy again'].map((label) => (
                <span key={label} className="rounded-2xl bg-white/85 px-2 py-2 shadow-sm" style={{ color: normalizeThemeColor(theme.welcomeActionText, "#0F172A") }}>
                  <span className="mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-xl" style={{ backgroundColor: normalizeThemeColor(theme.welcomeActionIconBackground, "#10B981"), color: normalizeThemeColor(theme.welcomeActionIconText, "#FFFFFF") }}>{label === 'Offers' ? '%' : label === 'Favourites' ? '♡' : '↻'}</span>
                  {label}
                </span>
              ))}
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="overflow-hidden rounded-[18px] border text-xs shadow-sm" style={{ backgroundColor: normalizeThemeColor(theme.rewardsPopupBackground, "#FFFFFF"), borderColor: normalizeThemeColor(theme.rewardsPopupCardBorder, "#D9C7A3"), color: normalizeThemeColor(theme.rewardsPopupBodyText, "#2B2B2B") }}>
              <div className="p-3 font-black" style={{ backgroundColor: normalizeThemeColor(theme.rewardsPopupHeaderBackground, "#334155"), color: normalizeThemeColor(theme.rewardsPopupHeaderText, "#FFFFFF") }}>Rewards popup</div>
              <div className="p-3"><span className="rounded-full px-2 py-1 font-black" style={{ backgroundColor: normalizeThemeColor(theme.rewardsPopupPillBackground, "#334155"), color: normalizeThemeColor(theme.rewardsPopupPillText, "#FFFFFF") }}>5% off</span><p className="mt-2 rounded-xl border p-2" style={{ backgroundColor: normalizeThemeColor(theme.rewardsPopupCardBackground, "#F8FAFC"), borderColor: normalizeThemeColor(theme.rewardsPopupCardBorder, "#D9C7A3") }}>Spend more to reach Gold.</p></div>
            </div>
            <div className="overflow-hidden rounded-[18px] border text-xs shadow-sm" style={{ backgroundColor: normalizeThemeColor(theme.offersPopupBackground, "#FFFFFF"), borderColor: normalizeThemeColor(theme.offersPopupCardBorder, "#D9C7A3"), color: normalizeThemeColor(theme.offersPopupBodyText, "#2B2B2B") }}>
              <div className="p-3 font-black" style={{ backgroundColor: normalizeThemeColor(theme.offersPopupHeaderBackground, "#0F172A"), color: normalizeThemeColor(theme.offersPopupHeaderText, "#FFFFFF") }}>Offers popup</div>
              <div className="p-3"><span className="rounded-full px-2 py-1 font-black" style={{ backgroundColor: normalizeThemeColor(theme.offersPopupPillBackground, "#0F172A"), color: normalizeThemeColor(theme.offersPopupPillText, "#FFFFFF") }}>SAVE10</span><p className="mt-2 rounded-xl border p-2" style={{ backgroundColor: normalizeThemeColor(theme.offersPopupCardBackground, "#F8F4F0"), borderColor: normalizeThemeColor(theme.offersPopupCardBorder, "#D9C7A3") }}>Active discount card preview.</p></div>
            </div>
          </div>
        </div>
      ) : null}
      {target === "products" ? <div className="rounded-[20px] border p-3" style={{ backgroundColor: normalizeThemeColor(theme.productCardBackground, "#FFFFFF"), borderColor: normalizeThemeColor(theme.productCardBorder, "#D9C7A3") }}><div className="grid grid-cols-[6rem_1fr] gap-3"><div className="rounded-2xl bg-slate-100" /><div><div className="flex items-start justify-between gap-3"><h4 className="font-bold" style={{ color: normalizeThemeColor(theme.productTitle, "#0F172A") }}>Sample product</h4><div className="flex shrink-0 gap-1.5"><span className="inline-flex h-8 w-8 items-center justify-center rounded-xl border text-sm font-black" title="Unticked heart preview" style={{ backgroundColor: normalizeThemeColor(theme.productHeartUntickedBackground, "#FFFFFF"), borderColor: normalizeThemeColor(theme.productCardBorder, "#D9C7A3"), color: normalizeThemeColor(theme.productHeartUntickedText, "#64748B") }}>♡</span><span className="inline-flex h-8 w-8 items-center justify-center rounded-xl border text-sm font-black" title="Ticked heart preview" style={{ backgroundColor: normalizeThemeColor(theme.productHeartTickedBackground, "#FEF3C7"), borderColor: normalizeThemeColor(theme.productHeartTickedText, "#F59E0B"), color: normalizeThemeColor(theme.productHeartTickedText, "#F59E0B") }}>♥</span></div></div><div className="mt-4 grid grid-cols-3 gap-2"><span className="rounded-xl border px-2 py-2 text-center text-sm font-bold" style={{ backgroundColor: normalizeThemeColor(theme.priceBoxBackground, "#FFFFFF"), borderColor: normalizeThemeColor(theme.priceBoxBorder, "#D9C7A3"), color: normalizeThemeColor(theme.priceText, "#0F172A") }}>{money}</span><span className="rounded-xl border px-2 py-2 text-center text-sm font-bold" style={{ backgroundColor: normalizeThemeColor(theme.addButtonBackground, "#FFFFFF"), borderColor: normalizeThemeColor(theme.addButtonBorder, "#D9C7A3"), color: normalizeThemeColor(theme.addButtonText, "#0F172A") }}>Add</span><span className="rounded-xl border px-2 py-2 text-center text-sm font-bold" style={{ backgroundColor: normalizeThemeColor(theme.moreButtonBackground, "#FFFFFF"), borderColor: normalizeThemeColor(theme.moreButtonBorder, "#D9C7A3"), color: normalizeThemeColor(theme.moreButtonText, "#0F172A") }}>More</span></div></div></div></div> : null}
      {target === "favourites" ? <div className="rounded-[20px] border p-3" style={{ backgroundColor: normalizeThemeColor(theme.favouritesBackground, "#451A03"), borderColor: normalizeThemeColor(theme.favouritesBorder, "#F59E0B"), color: normalizeThemeColor(theme.favouritesText, "#FFFFFF") }}><p className="text-[10px] font-black uppercase tracking-[0.22em]" style={{ color: normalizeThemeColor(theme.favouritesLabelText, "#FDE68A") }}>Your favourites</p><h4 className="mt-1 text-lg font-black">Saved favourites</h4><div className="mx-auto mt-3 max-w-[220px] rounded-[20px] border p-3 text-center" style={{ backgroundColor: normalizeThemeColor(theme.favouritesCardBackground, "#FFFFFF"), borderColor: normalizeThemeColor(theme.favouritesCardBorder, "#FCD34D"), boxShadow: theme.favouritesCardShadowEnabled === false ? "none" : `0 8px 18px ${normalizeThemeColor(theme.favouritesCardShadow, "#F59E0B")}14` }}><div className="mx-auto aspect-[1.25/1] rounded-2xl bg-slate-100" /><h5 className="mt-3 font-black" style={{ color: normalizeThemeColor(theme.favouritesCardTitle, "#0F172A") }}>Favourite product</h5><div className="mt-3 flex items-center justify-center gap-2"><span className="rounded-xl border px-2.5 py-1.5 text-xs font-black" style={{ backgroundColor: normalizeThemeColor(theme.favouritesPriceBackground, "#FFFFFF"), borderColor: normalizeThemeColor(theme.favouritesPriceBorder, "#F59E0B"), color: normalizeThemeColor(theme.favouritesPriceText, "#0F172A") }}>{money}</span><span className="rounded-xl border px-3 py-1.5 text-xs font-black" style={{ backgroundColor: normalizeThemeColor(theme.favouritesAddBackground, "#0F172A"), borderColor: normalizeThemeColor(theme.favouritesAddBorder, "#F59E0B"), color: normalizeThemeColor(theme.favouritesAddText, "#FFFFFF") }}>Add</span><span className="inline-flex h-8 w-8 items-center justify-center rounded-xl" style={{ backgroundColor: normalizeThemeColor(theme.favouritesRemoveBackground, "#FFFFFF"), color: normalizeThemeColor(theme.favouritesRemoveText, "#F59E0B") }}>♥</span></div><p className="mt-2 text-[9px] font-bold uppercase tracking-[0.14em]" style={{ color: normalizeThemeColor(theme.favouritesSwipeText, "#D97706") }}>Swipe to view all favourites</p></div></div> : null}
      {target === "footer" ? <div className="rounded-[18px] border p-4" style={{ backgroundColor: normalizeThemeColor(theme.footerBackground, "#FFFFFF"), borderColor: normalizeThemeColor(theme.globalBorder, "#D9C7A3"), color: normalizeThemeColor(theme.footerText, "#2B2B2B") }}><p className="text-[11px] font-bold uppercase tracking-[0.18em]">Storefront footer</p><p className="mt-2 text-sm leading-5">{footerBlurb}</p><p className="mt-2 text-xs leading-5">{footerNotice}</p><div className="mt-3 flex flex-wrap items-center gap-2"><span className="inline-flex rounded-full px-3 py-1.5 text-xs font-bold text-white" style={{ backgroundColor: normalizeThemeColor(theme.footerBadgeBackground, "#C7922F") }}>Contact icons</span><span className="inline-flex rounded-full border border-black/10 bg-white/75 px-3 py-1.5 text-xs font-bold">Social links</span></div></div> : null}
    </div>
  );
}

function ToggleRow({ label, help, checked, onChange }: { label: string; help: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-slate-700">{label}</span>
        <span className="mt-1 block text-xs leading-5 text-slate-500">{help}</span>
      </span>
      <span className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition ${checked ? "border-orange-300 bg-orange-500" : "border-slate-300 bg-slate-200"}`}>
        <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="sr-only" />
        <span className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition ${checked ? "translate-x-5" : "translate-x-1"}`} aria-hidden="true" />
      </span>
    </label>
  );
}

function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const safeValue = /^#[0-9a-fA-F]{6}$/.test(value) ? value : "#ffffff";
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-slate-700">{label}</span>
        <label className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white text-base shadow-sm transition hover:border-orange-300 hover:bg-orange-50 sm:hidden" title={`${label} colour picker`} aria-label={`${label} colour picker`}>
          <span aria-hidden="true">🎨</span>
          <input
            type="color"
            value={safeValue}
            onChange={(e) => onChange(e.target.value)}
            className="sr-only"
            tabIndex={-1}
          />
        </label>
      </div>
      <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[minmax(0,190px)_44px] sm:justify-end">
        <div className="flex min-w-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-1.5 focus-within:border-slate-400">
          <span className="h-7 w-7 shrink-0 rounded-lg border border-black/10 shadow-sm" style={{ backgroundColor: safeValue }} aria-hidden="true" />
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="min-w-0 flex-1 bg-transparent px-1 py-1 text-sm font-semibold uppercase outline-none"
          />
        </div>
        <input
          type="color"
          value={safeValue}
          onChange={(e) => onChange(e.target.value)}
          className="hidden h-10 w-11 rounded-xl border border-slate-200 bg-white p-1 sm:block"
          aria-label={`${label} colour picker`}
        />
      </div>
    </div>
  );
}

function ReadOnlyAssetUrl({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-1 break-all text-[11px] leading-5 text-slate-600">{value}</p>
    </div>
  );
}

function UploadField({
  label,
  saved,
  busy,
  accept,
  help,
  onFile,
}: {
  label: string;
  saved: boolean;
  busy: boolean;
  accept: string;
  help: string;
  onFile: (file: File) => void;
}) {
  const inputId = `tenant-asset-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

  return (
    <div className="block rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-700">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-900">{busy ? "Uploading..." : label}</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">{help}</p>
          {saved ? <p className="mt-1 text-xs font-semibold text-emerald-700">Current file saved. Upload a new file only if you want to change it.</p> : null}
        </div>
        {saved ? <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-emerald-700">Saved</span> : null}
      </div>
      <input
        id={inputId}
        type="file"
        accept={accept}
        disabled={busy}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.currentTarget.value = "";
        }}
        className="sr-only"
      />
      <label
        htmlFor={inputId}
        className={`mt-3 inline-flex min-h-10 cursor-pointer items-center justify-center rounded-xl px-4 py-2 text-xs font-bold transition ${
          busy ? "pointer-events-none bg-slate-200 text-slate-500" : "bg-slate-900 text-white hover:bg-slate-800"
        }`}
      >
        {busy ? "Uploading..." : label}
      </label>
    </div>
  );
}

const SETTINGS_MENU_ITEMS = [
  { id: "admin-workspace", group: "Workspace", title: "Admin workspace", help: "Show or hide the new client setup checklist." },
  { id: "logo-and-favicon", group: "Brand", title: "Logo and favicon", help: "Upload or replace the store logo and browser icon." },
  { id: "branding-and-wording", group: "Brand", title: "Branding and wording", help: "Business name, storefront heading and admin labels." },
  { id: "theme-presets", group: "Theme", title: "Theme presets", help: "Choose a ready-made colour starting point." },
  { id: "per-item-storefront-colours", group: "Theme", title: "Per-item storefront colours", help: "Fine-tune each visible storefront area." },
  { id: "business-contact-details", group: "Contact", title: "Business contact details", help: "Phone, email, address, footer and social links." },
  { id: "invoice-payments", group: "Payments", title: "Invoice payments", help: "Enable a dedicated first storefront section for invoice, deposit and statement balance payment cards." },
  { id: "receipt-information", group: "Receipts", title: "Receipt information", help: "Document name, tax details, optional fields, receipt image and footer wording." },
  { id: "storefront-seo", group: "SEO", title: "Storefront SEO", help: "Page title, meta description, schema, favicon and Google tracking." },
  { id: "customer-rewards-program", group: "Rewards", title: "Customer rewards programme", help: "Silver, Gold and Platinum spend tiers with percentage discounts." },
  { id: "discounts-and-codes", group: "Discounts", title: "Discounts & codes", help: "Product, combo and site-wide promotional offers." },
  { id: "storefront-payment-options", group: "Payments", title: "Storefront payment options", help: "Cash, COD, Stripe, Yoco and future provider setup." },
  { id: "advanced-currency-display", group: "Payments", title: "Advanced currency display", help: "Currency name, symbol, suffix, separators and sample pricing." },
];

const SETTINGS_SECTION_META: Record<string, { group: string; help: string; accent: string }> = {
  "admin-workspace": { group: "Workspace", help: "Small controls that affect the tenant admin experience.", accent: "bg-slate-900 text-white" },
  "logo-and-favicon": { group: "Brand", help: "Upload the public-facing logo and browser/app icon. Uploads autosave.", accent: "bg-orange-100 text-orange-800" },
  "branding-and-wording": { group: "Brand", help: "Business name, admin label and customer-facing welcome wording.", accent: "bg-orange-100 text-orange-800" },
  "theme-presets": { group: "Theme", help: "Start with a palette before fine-tuning individual storefront areas.", accent: "bg-indigo-100 text-indigo-800" },
  "per-item-storefront-colours": { group: "Theme", help: "Detailed colour controls are tucked away until needed, especially on mobile.", accent: "bg-indigo-100 text-indigo-800" },
  "business-contact-details": { group: "Contact", help: "Footer wording, contact details, referral advert and social links.", accent: "bg-emerald-100 text-emerald-800" },
  "receipt-information": { group: "Receipts", help: "Customer receipt wording, tax details, optional business fields and footer note.", accent: "bg-cyan-100 text-cyan-900" },
  "storefront-seo": { group: "SEO", help: "Search title, meta description, structured data, favicon and Google tracking.", accent: "bg-blue-100 text-blue-900" },
  "customer-rewards-program": { group: "Rewards", help: "Customer loyalty tiers, thresholds and percentage discounts.", accent: "bg-purple-100 text-purple-900" },
  "discounts-and-codes": { group: "Discounts", help: "Product, combo and site-wide discount codes and visible offers.", accent: "bg-rose-100 text-rose-900" },
  "storefront-payment-options": { group: "Payments", help: "Cash, COD, Stripe and Yoco controls. Payment behaviour is unchanged.", accent: "bg-amber-100 text-amber-900" },
  "advanced-currency-display": { group: "Payments", help: "Currency display formatting, including optional tenant-specific suffix.", accent: "bg-amber-100 text-amber-900" },
};

function SettingsMenuModal({ onClose, onSelect }: { onClose: () => void; onSelect: (id: string) => void }) {
  return (
    <div className="fixed inset-0 z-[110] flex items-end bg-slate-950/60 px-3 pb-3 pt-6 backdrop-blur-[3px] sm:items-center sm:justify-center sm:p-6" onClick={onClose}>
      <div className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-[30px] bg-white shadow-[0_28px_90px_rgba(15,23,42,0.38)]" onClick={(event) => event.stopPropagation()}>
        <div className="sticky top-0 z-10 shrink-0 border-b border-slate-100 bg-white/95 px-4 pb-4 pt-4 shadow-[0_10px_28px_rgba(15,23,42,0.06)] backdrop-blur sm:px-6 sm:pt-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-orange-700">Settings menu</p>
              <h3 className="mt-1 text-xl font-black text-slate-950 sm:text-2xl">What do you want to work on?</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">Jump straight to the section you need, especially useful on mobile where the settings page is longer.</p>
            </div>
            <button type="button" onClick={onClose} className="sticky top-4 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-2xl font-bold text-slate-500 shadow-sm transition hover:bg-slate-50" aria-label="Close settings menu">×</button>
          </div>
        </div>

        <div className="overflow-y-auto px-4 pb-7 pt-5 sm:px-6 sm:pb-8 sm:pt-6">
          <div className="grid gap-3">
            {SETTINGS_MENU_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item.id)}
                className="group rounded-[22px] border border-slate-200 bg-slate-50 p-4 text-left transition hover:-translate-y-[1px] hover:border-orange-200 hover:bg-orange-50"
              >
                <span className="flex items-start justify-between gap-3">
                  <span>
                    <span className="mb-2 inline-flex rounded-full bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500 shadow-sm">{item.group}</span>
                    <span className="block text-sm font-black text-slate-950">{item.title}</span>
                    <span className="mt-1 block text-xs leading-5 text-slate-600">{item.help}</span>
                  </span>
                  <span className="mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-sm font-black text-orange-700 shadow-sm transition group-hover:bg-orange-100">↓</span>
                </span>
              </button>
            ))}
          </div>

          <div className="mt-5 flex justify-end border-t border-slate-100 pt-4">
            <button type="button" onClick={onClose} className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800 sm:w-auto">Close menu</button>
          </div>

          <div className="h-5 sm:h-6" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}

function StripeKeyGuideModal({ onClose }: { onClose: () => void }) {
  const steps = [
    {
      title: "1. Open the tenant's own Stripe account",
      body: "Log in to Stripe as the store owner, or sit with them while they log in. Make sure this is the store owner's Stripe account, not the Orduva owner billing account.",
    },
    {
      title: "2. Choose Test mode or Live mode",
      body: "Use test mode while setting up and testing. Only switch to live keys when the store is ready to take real customer payments.",
    },
    {
      title: "3. Find the publishable key",
      body: "In Stripe, go to Developers, then API keys. Copy the key that starts with pk_test_ or pk_live_ and paste it into Tenant Stripe publishable key.",
    },
    {
      title: "4. Create or reveal the secret key",
      body: "Still under API keys, create or reveal the secret key. It starts with sk_test_ or sk_live_. Copy it once and paste it into Tenant Stripe secret key. Stripe may only show live secret keys once, so store it safely.",
    },
    {
      title: "5. Prepare the webhook destination",
      body: "A webhook is how Stripe tells Orduva that a customer order payment succeeded, failed, expired or was refunded. Use the destination name: Orduva - Customer Orders.",
    },
    {
      title: "6. Do not use the Orduva owner billing webhook URL",
      body: "Use https://www.orduva.com/api/storefront/stripe/webhook as the endpoint URL. Do not use /api/billing/stripe/webhook, because that is for tenants paying Orduva subscriptions.",
    },
    {
      title: "7. Events to choose when the endpoint is live",
      body: "Create the Stripe webhook endpoint using the URL shown in Orduva, then select these events: checkout.session.completed, checkout.session.expired, payment_intent.succeeded, payment_intent.payment_failed and charge.refunded.",
    },
    {
      title: "8. Reveal the webhook signing secret",
      body: "After the endpoint has been created in Stripe, open it and click Reveal signing secret. Copy the value that starts with whsec_ and paste it into Tenant Stripe webhook secret. Do not paste the webhook endpoint ID.",
    },
    {
      title: "9. Save, then enable Stripe later",
      body: "Save the settings first. Keep Stripe disabled until the tenant keys, webhook endpoint and webhook signing secret have all been added and tested.",
    },
  ];

  return (
    <div className="fixed inset-0 z-[110] flex items-end bg-slate-950/60 px-3 pb-3 pt-6 backdrop-blur-[3px] sm:items-center sm:justify-center sm:p-6" onClick={onClose}>
      <div className="flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-[30px] bg-white shadow-[0_28px_90px_rgba(15,23,42,0.38)]" onClick={(event) => event.stopPropagation()}>
        <div className="sticky top-0 z-10 shrink-0 border-b border-slate-100 bg-white/95 px-4 pb-4 pt-4 shadow-[0_10px_28px_rgba(15,23,42,0.06)] backdrop-blur sm:px-6 sm:pt-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-700">Stripe setup guide</p>
              <h3 className="mt-1 text-xl font-black text-slate-950 sm:text-2xl">Where do I find the tenant Stripe keys?</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">Use this when helping a non-technical store owner connect their own Stripe account for storefront customer payments.</p>
            </div>
            <button type="button" onClick={onClose} className="sticky top-4 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-2xl font-bold text-slate-500 shadow-sm transition hover:bg-slate-50" aria-label="Close Stripe setup guide">×</button>
          </div>
        </div>

        <div className="overflow-y-auto px-4 pb-7 pt-5 sm:px-6 sm:pb-8 sm:pt-6">
          <div className="rounded-[22px] border border-orange-200 bg-orange-50 p-4 text-sm leading-6 text-orange-950">
            <strong>Keep this separate:</strong> these must be the tenant's own Stripe keys. Do not paste the Orduva owner Stripe keys here, because customer order money should go to the store owner, not the Orduva SaaS billing account.
          </div>

          <div className="mt-4 grid gap-3">
            {steps.map((step) => (
              <div key={step.title} className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-black text-slate-950">{step.title}</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">{step.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">Publishable key</p>
              <p className="mt-2 font-mono text-sm font-black text-slate-950">pk_test_...</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">Safe for browser-side Stripe setup.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">Secret key</p>
              <p className="mt-2 font-mono text-sm font-black text-slate-950">sk_test_...</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">Private. Store server-side only.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">Webhook secret</p>
              <p className="mt-2 font-mono text-sm font-black text-slate-950">whsec_...</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">Used to verify Stripe payment messages.</p>
            </div>
          </div>

          <div className="mt-4 rounded-[22px] border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-950">
            <strong>Webhook endpoint URL:</strong> https://www.orduva.com/api/storefront/stripe/webhook
            <span className="mt-2 block"><strong>Do not use:</strong> https://www.orduva.com/api/billing/stripe/webhook — that endpoint is only for Orduva subscription billing.</span>
          </div>

          <div className="mt-4 rounded-[22px] border border-indigo-200 bg-indigo-50 p-4 text-xs leading-5 text-indigo-950">
            <p className="font-black uppercase tracking-[0.16em] text-indigo-700">Required Stripe webhook events</p>
            <p className="mt-2">Use destination name <strong>Orduva - Customer Orders</strong> and select these events:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li><span className="font-mono">checkout.session.completed</span></li>
              <li><span className="font-mono">checkout.session.expired</span></li>
              <li><span className="font-mono">payment_intent.succeeded</span></li>
              <li><span className="font-mono">payment_intent.payment_failed</span></li>
              <li><span className="font-mono">charge.refunded</span></li>
            </ul>
          </div>

          <div className="mt-5 flex justify-end border-t border-slate-100 pt-4">
            <button type="button" onClick={onClose} className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800 sm:w-auto">Close guide</button>
          </div>

          <div className="h-5 sm:h-6" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}



function RewardTierPreview({ name, spend, discount, tone }: { name: string; spend: string; discount: string; tone: "silver" | "gold" | "platinum" }) {
  const toneClass = tone === "platinum"
    ? "border-slate-300 bg-slate-950 text-white"
    : tone === "gold"
      ? "border-amber-300 bg-amber-50 text-amber-950"
      : "border-slate-200 bg-slate-50 text-slate-900";
  return (
    <div className={`rounded-[22px] border p-4 ${toneClass}`}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-lg" aria-hidden="true">{tone === "platinum" ? "✦" : tone === "gold" ? "★" : "◇"}</span>
        <span className="rounded-full border border-white/40 bg-white/20 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em]">{discount || "0"}% off</span>
      </div>
      <p className="mt-3 text-base font-black">{name}</p>
      <p className="mt-1 text-xs leading-5 opacity-80">Spend {spend} to qualify.</p>
    </div>
  );
}

function PaymentGatewayCard({
  title,
  description,
  badge,
  tone = "idle",
  children,
}: {
  title: string;
  description: string;
  badge: string;
  tone?: "idle" | "ready" | "warning";
  children: ReactNode;
}) {
  const toneClass = tone === "ready"
    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
    : tone === "warning"
      ? "border-amber-200 bg-amber-50 text-amber-800"
      : "border-slate-200 bg-slate-50 text-slate-600";

  return (
    <details className="group mx-auto w-full overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-none transition open:border-slate-300 md:hover:border-orange-300 md:hover:ring-2 md:hover:ring-orange-100">
      <summary className="flex cursor-pointer list-none items-start justify-between gap-3 px-3 py-3 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-orange-200 sm:px-4 sm:py-4 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0">
          <span className="mb-2 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-600">Payment gateway</span>
          <span className="block text-sm font-black text-slate-950 sm:text-base">{title}</span>
          <span className="mt-1 block text-xs leading-5 text-slate-600">{description}</span>
        </span>
        <span className="flex shrink-0 flex-col items-end gap-2">
          <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${toneClass}`}>{badge}</span>
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-base font-black text-slate-700 transition group-open:rotate-45 group-open:border-orange-300 group-open:text-orange-800" aria-hidden="true">+</span>
        </span>
      </summary>
      <div className="px-3 pb-3 pt-0 sm:px-4 sm:pb-4">
        {children}
      </div>
    </details>
  );
}

function Section({
  id,
  title,
  children,
  showSave = true,
  compact = false,
  dirty = true,
  saving = false,
  defaultOpen = false,
}: {
  id?: string;
  title: string;
  children: ReactNode;
  showSave?: boolean;
  compact?: boolean;
  dirty?: boolean;
  saving?: boolean;
  defaultOpen?: boolean;
}) {
  const meta = id ? SETTINGS_SECTION_META[id] : null;
  return (
    <details
      id={id}
      open={defaultOpen || undefined}
      className={`${compact ? "mb-0" : "mb-4 sm:mb-5"} group mx-auto w-full scroll-mt-28 overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-none transition open:border-slate-300 md:hover:border-orange-300 md:hover:ring-2 md:hover:ring-orange-100`}
    >
      <summary className="flex cursor-pointer list-none items-start justify-between gap-3 px-3 py-4 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-orange-200 sm:px-5 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0">
          <span className="mb-2 flex flex-wrap items-center gap-2">
            {meta ? <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${meta.accent}`}>{meta.group}</span> : null}
            {dirty && showSave ? <span className="inline-flex rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-orange-800">Unsaved</span> : null}
            {!dirty && showSave ? <span className="inline-flex rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700">Saved</span> : null}
            {!showSave ? <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Autosave / tools</span> : null}
          </span>
          <span className="block text-base font-black text-slate-950 sm:text-lg">{title}</span>
          {meta ? <span className="mt-1.5 block text-xs leading-5 text-slate-600 sm:text-sm">{meta.help}</span> : null}
        </span>
        <span className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-lg font-black text-slate-700 shadow-sm transition group-open:rotate-45 group-open:border-orange-300 group-open:text-orange-800" aria-hidden="true">+</span>
      </summary>
      <div className="px-3 pb-4 sm:px-5 sm:pb-5">
        {children}
        {showSave ? (
          <div className="mt-4 flex justify-end pt-1">
            <button
              type="submit"
              disabled={saving || !dirty}
              className="inline-flex min-h-10 w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 disabled:opacity-100 sm:w-auto"
            >
              {saving ? "Saving..." : dirty ? "Save section" : "Nothing to save"}
            </button>
          </div>
        ) : null}
      </div>
    </details>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
      {children}
    </label>
  );
}
