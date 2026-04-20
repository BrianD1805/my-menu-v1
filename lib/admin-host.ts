export function normalizeHostname(value: string) {
  return String(value || "").trim().toLowerCase().split(":")[0];
}

export function getConfiguredAdminHostname() {
  return normalizeHostname(
    process.env.ADMIN_HOSTNAME ||
      process.env.NEXT_PUBLIC_ADMIN_HOSTNAME ||
      ""
  );
}

export function isSharedAdminHost(host: string) {
  const hostname = normalizeHostname(host);
  if (!hostname) return false;

  const configured = getConfiguredAdminHostname();
  if (configured && hostname === configured) return true;

  if (hostname === "admin.localhost") return true;
  if (hostname.startsWith("admin.")) return true;

  return false;
}
