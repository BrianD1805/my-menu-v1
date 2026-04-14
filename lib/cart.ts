export function getCartStorageKey(tenantSlug: string) {
  return `cart:${tenantSlug || "orduva"}`;
}

export function readCart<T>(tenantSlug: string): T[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(getCartStorageKey(tenantSlug));
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

export function writeCart<T>(tenantSlug: string, items: T[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(getCartStorageKey(tenantSlug), JSON.stringify(items));
}

export function clearCart(tenantSlug: string) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(getCartStorageKey(tenantSlug));
}
