const CART_UPDATED_EVENT = "orduva:cart-updated";

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

function emitCartUpdated(tenantSlug: string) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent(CART_UPDATED_EVENT, {
      detail: { tenantSlug }
    })
  );
}

export function subscribeToCartUpdates(
  tenantSlug: string,
  onChange: () => void
) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key && event.key !== getCartStorageKey(tenantSlug)) return;
    onChange();
  };

  const handleCustomUpdate = (event: Event) => {
    const detail = (event as CustomEvent<{ tenantSlug?: string }>).detail;
    if (detail?.tenantSlug && detail.tenantSlug !== tenantSlug) return;
    onChange();
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(CART_UPDATED_EVENT, handleCustomUpdate);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(CART_UPDATED_EVENT, handleCustomUpdate);
  };
}

export function writeCart<T>(tenantSlug: string, items: T[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(getCartStorageKey(tenantSlug), JSON.stringify(items));
  emitCartUpdated(tenantSlug);
}

export function clearCart(tenantSlug: string) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(getCartStorageKey(tenantSlug));
  emitCartUpdated(tenantSlug);
}
