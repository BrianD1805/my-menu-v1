export function getDefaultTenantLogoUrl(slug: string) {
  if (slug === "orduva") return "/tenant-assets/zimza-express/logo.png";
  return null;
}

export function getDefaultTenantFaviconUrl(slug: string) {
  if (slug === "orduva") return "/tenant-assets/zimza-express/favicon.png";
  return null;
}
