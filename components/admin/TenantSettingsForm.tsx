"use client";

import type { ReactNode } from "react";
import { Fragment, FormEvent, useMemo, useRef, useState } from "react";
import { DEFAULT_MONEY_SETTINGS, formatMoney } from "@/lib/money";
import { buildThemeFromCore, normalizeThemeColor, type StorefrontTheme, type StorefrontThemeKey } from "@/lib/storefront-theme";

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
};

type PreviewTarget = "global" | "header" | "welcome" | "products" | "favourites" | "footer";

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
  const [openThemeGroup, setOpenThemeGroup] = useState<PreviewTarget | null>(null);

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
  const contactDirty = formValueChanged(["contactPhone", "contactWhatsApp", "contactEmail", "contactAddress", "footerBlurb", "footerNotice", "socialFacebookUrl", "socialInstagramUrl", "socialTikTokUrl", "socialXUrl", "socialWebsiteUrl"]);
  const currencyDirty = formValueChanged(["currencyName", "currencyCode", "currencySymbol", "currencyDisplayMode", "currencySymbolPosition", "currencyDecimalPlaces", "currencyUseThousandsSeparator", "currencyDecimalSeparator", "currencyThousandsSeparator", "currencySuffix"]);
  const hasUnsavedChanges = brandingDirty || themeDirty || contactDirty || currencyDirty;
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

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
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
      setTone("success");
      setMessage(payload.message || `${kind === "logo" ? "Logo" : "Favicon"} uploaded and saved.`);
    } catch (error) {
      setTone("error");
      setMessage(error instanceof Error ? error.message : `Failed to upload ${kind}`);
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
      const savedPayload = { ...form, storefrontTheme: theme };
      setForm(savedPayload);
      setSavedForm(savedPayload);
      setTone("success");
      setMessage("Tenant settings saved.");
    } catch (error) {
      setTone("error");
      setMessage(error instanceof Error ? error.message : "Failed to save settings");
    } finally {
      setSaving(false);
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
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(380px,0.95fr)] xl:items-start">
      <form onSubmit={onSubmit} className="rounded-[30px] border border-black/5 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:p-6">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Tenant settings</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">Storefront branding and theme editor</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Choose a preset as a starting point, then fine-tune each visible storefront section. Draft colours update the preview automatically.
          </p>
        </div>

        <Section title="Logo and favicon" showSave={false}>
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

        <Section title="Theme presets" dirty={themeDirty} saving={saving}>
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

        <Section title="Per-item storefront colours" showSave={false}>
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
        </Section>

        <Section title="Business contact details" dirty={contactDirty} saving={saving}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Contact phone"><input value={form.contactPhone} onChange={(e) => update("contactPhone", e.target.value)} className="input" placeholder="+254..." /></Field>
            <Field label="WhatsApp"><input value={form.contactWhatsApp} onChange={(e) => update("contactWhatsApp", e.target.value)} className="input" placeholder="+254..." /></Field>
            <Field label="Email"><input value={form.contactEmail} onChange={(e) => update("contactEmail", e.target.value)} className="input" placeholder="hello@example.com" /></Field>
            <Field label="Business address"><input value={form.contactAddress} onChange={(e) => update("contactAddress", e.target.value)} className="input" placeholder="Street, area, city" /></Field>
            <div className="md:col-span-2"><Field label="Footer blurb"><input value={form.footerBlurb} onChange={(e) => update("footerBlurb", e.target.value)} className="input" placeholder="Thank you for ordering with us." /></Field></div>
            <div className="md:col-span-2"><Field label="Footer notice"><input value={form.footerNotice} onChange={(e) => update("footerNotice", e.target.value)} className="input" placeholder="Prices and availability may change without notice." /></Field></div>
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

        <Section title="Advanced currency display" dirty={currencyDirty} saving={saving}>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Field label="Currency name"><input value={form.currencyName} onChange={(e) => update("currencyName", e.target.value)} className="input" /></Field>
            <Field label="Currency code"><input value={form.currencyCode} onChange={(e) => update("currencyCode", e.target.value.toUpperCase())} className="input uppercase" maxLength={3} /></Field>
            <Field label="Symbol"><input value={form.currencySymbol} onChange={(e) => update("currencySymbol", e.target.value)} className="input" maxLength={12} /></Field>
            <Field label="Display mode"><select value={form.currencyDisplayMode} onChange={(e) => update("currencyDisplayMode", e.target.value as FormState["currencyDisplayMode"])} className="input"><option value="symbol">Symbol only</option><option value="code">Code only</option><option value="code_symbol">Code + symbol</option><option value="symbol_code">Symbol + code</option><option value="none">No prefix</option></select></Field>
            <Field label="Prefix position"><select value={form.currencySymbolPosition} onChange={(e) => update("currencySymbolPosition", e.target.value as FormState["currencySymbolPosition"])} className="input"><option value="before">Before amount</option><option value="after">After amount</option></select></Field>
            <Field label="Decimal places"><input type="number" min={0} max={4} value={form.currencyDecimalPlaces} onChange={(e) => update("currencyDecimalPlaces", e.target.value)} className="input" /></Field>
          </div>
          <label className="mt-4 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
            <input type="checkbox" checked={form.currencyUseThousandsSeparator} onChange={(e) => update("currencyUseThousandsSeparator", e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
            Use thousands separator
          </label>
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
          <p className="text-sm text-slate-500">Preview updates from the current draft colours before saving. On desktop, the preview stays sticky on the right while you edit colours on the left.</p>
          <button type="submit" disabled={saving || !hasUnsavedChanges} className="admin-pressable inline-flex min-h-12 items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 disabled:opacity-100">
            {saving ? "Saving..." : hasUnsavedChanges ? "Save settings" : "Nothing to save"}
          </button>
        </div>
      </form>

      <div ref={previewPanelRef} className="hidden space-y-3 xl:sticky xl:top-5 xl:block xl:self-start">
        <div className="rounded-[24px] border border-black/5 bg-white p-4 shadow-[0_14px_34px_rgba(15,23,42,0.06)] sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Live section preview</p>
              <h3 className="mt-1 text-lg font-bold text-slate-900">{labelForPreview(previewTarget)}</h3>
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
      {target === "welcome" ? <div className="rounded-[18px] border p-4" style={{ backgroundColor: normalizeThemeColor(theme.welcomeBackground, "#FFFFFF"), borderColor: normalizeThemeColor(theme.welcomeBorder, "#D9C7A3"), boxShadow: `0 10px 24px ${normalizeThemeColor(theme.welcomeShadow, "#D9C7A3")}18` }}>{logoUrl ? <img src={logoUrl} alt="Logo preview" className="mb-3 max-h-14 max-w-[180px] object-contain" /> : null}<p className="text-xs font-bold uppercase tracking-[0.22em]" style={{ color: normalizeThemeColor(theme.welcomeLabel, "#C7922F") }}>Welcome</p><h4 className="mt-2 text-xl font-bold" style={{ color: normalizeThemeColor(theme.welcomeHeading, "#0F172A") }}>{previewHeading}</h4><p className="mt-2 text-sm leading-5" style={{ color: normalizeThemeColor(theme.welcomeBody, "#2B2B2B") }}>{previewSubheading}</p></div> : null}
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

function Section({
  id,
  title,
  children,
  showSave = true,
  compact = false,
  dirty = true,
  saving = false,
}: {
  id?: string;
  title: string;
  children: ReactNode;
  showSave?: boolean;
  compact?: boolean;
  dirty?: boolean;
  saving?: boolean;
}) {
  return (
    <section id={id} className={`${compact ? "mb-0" : "mb-6"} scroll-mt-28 rounded-[24px] border border-slate-200 bg-slate-50/60 p-4 sm:p-5`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-600">{title}</h3>
      </div>
      {children}
      {showSave ? (
        <div className="mt-4 flex justify-end border-t border-slate-200/70 pt-4">
          <button
            type="submit"
            disabled={saving || !dirty}
            className="inline-flex min-h-10 w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 disabled:opacity-100 sm:w-auto"
          >
            {saving ? "Saving..." : dirty ? "Save section" : "Nothing to save"}
          </button>
        </div>
      ) : null}
    </section>
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
