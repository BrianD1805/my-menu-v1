export type TenantBrandDefaults = {
  starterLogoUrl: string;
  starterFaviconUrl: string;
  primaryColor: string;
  accentColor: string;
};

export function getTenantBrandDefaults(slug: string): TenantBrandDefaults {
  if (slug === "orduva") {
    return {
      starterLogoUrl: "/tenant-assets/zimza-express/logo.png",
      starterFaviconUrl: "/tenant-assets/zimza-express/favicon.png",
      primaryColor: "#7B1E22",
      accentColor: "#C7922F",
    };
  }

  return {
    starterLogoUrl: "/tenant-assets/default/logo.svg",
    starterFaviconUrl: "/tenant-assets/default/favicon.svg",
    primaryColor: "#336699",
    accentColor: "#2C7A7B",
  };
}

export function getDefaultTenantLogoUrl(slug: string) {
  return getTenantBrandDefaults(slug).starterLogoUrl;
}

export function getDefaultTenantFaviconUrl(slug: string) {
  return getTenantBrandDefaults(slug).starterFaviconUrl;
}
