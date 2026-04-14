const CART_UPDATED_EVENT = "orduva:cart-updated";

export function getCartStorageKey(tenantSlug: string) {
  return `cart:${tenantSlug || "orduva"}`;
}

function emitCartUpdate<T>(tenantSlug: string, items: T[]) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent(CART_UPDATED_EVENT, {
      detail: {
        tenantSlug: tenantSlug || "orduva",
        items,
      },
    }),
  );
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
  emitCartUpdate(tenantSlug, items);
}

export function clearCart(tenantSlug: string) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(getCartStorageKey(tenantSlug));
  emitCartUpdate(tenantSlug, []);
}

export function subscribeToCartUpdates<T>(callback: (cart: T[]) => void): () => void;
export function subscribeToCartUpdates<T>(tenantSlug: string, callback: (cart: T[]) => void): () => void;
export function subscribeToCartUpdates<T>(
  tenantSlugOrCallback: string | ((cart: T[]) => void),
  maybeCallback?: (cart: T[]) => void,
): () => void {
  if (typeof window === "undefined") return () => {};

  const tenantSlug = typeof tenantSlugOrCallback === "string" ? tenantSlugOrCallback : "orduva";
  const callback =
    typeof tenantSlugOrCallback === "function" ? tenantSlugOrCallback : maybeCallback;

  if (!callback) return () => {};

  const notify = () => callback(readCart<T>(tenantSlug));

  const onCustomUpdate = (event: Event) => {
    const customEvent = event as CustomEvent<{ tenantSlug?: string; items?: T[] }>;
    const changedSlug = customEvent.detail?.tenantSlug || "orduva";

    if (changedSlug === tenantSlug) {
      callback(customEvent.detail?.items ?? readCart<T>(tenantSlug));
    }
  };

  const onStorage = (event: StorageEvent) => {
    if (event.key === getCartStorageKey(tenantSlug)) {
      notify();
    }
  };

  window.addEventListener(CART_UPDATED_EVENT, onCustomUpdate as EventListener);
  window.addEventListener("storage", onStorage);

  return () => {
    window.removeEventListener(CART_UPDATED_EVENT, onCustomUpdate as EventListener);
    window.removeEventListener("storage", onStorage);
  };
}
