"use client";

import { useMemo, useRef, useState } from "react";

type ProductRow = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  price: number;
  category_name: string | null;
};

export default function ProductImageManager({
  tenantSlug,
  products,
}: {
  tenantSlug: string;
  products: ProductRow[];
}) {
  const [drafts, setDrafts] = useState<Record<string, string>>(
    Object.fromEntries(products.map((product) => [product.id, product.image_url || ""]))
  );
  const [savingId, setSavingId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, string>>({});
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  const sortedProducts = useMemo(
    () => [...products].sort((a, b) => a.name.localeCompare(b.name)),
    [products]
  );

  function setDraft(id: string, value: string) {
    setDrafts((current) => ({ ...current, [id]: value }));
    setMessages((current) => ({ ...current, [id]: "" }));
  }

  async function saveImage(productId: string) {
    const imageUrl = (drafts[productId] || "").trim();
    setSavingId(productId);
    setMessages((current) => ({ ...current, [productId]: "Saving..." }));

    try {
      const response = await fetch("/api/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantSlug, productId, imageUrl: imageUrl || null }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Failed to save image");
      }

      setDrafts((current) => ({ ...current, [productId]: payload.product.image_url || "" }));
      setMessages((current) => ({
        ...current,
        [productId]: payload.product.image_url ? "Image saved" : "Image removed",
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save image";
      setMessages((current) => ({ ...current, [productId]: message }));
    } finally {
      setSavingId(null);
    }
  }

  async function uploadImage(productId: string, file: File | null) {
    if (!file) return;

    setUploadingId(productId);
    setMessages((current) => ({ ...current, [productId]: "Uploading image..." }));

    try {
      const formData = new FormData();
      formData.append("tenantSlug", tenantSlug);
      formData.append("productId", productId);
      formData.append("file", file);

      const response = await fetch("/api/products", {
        method: "POST",
        body: formData,
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Failed to upload image");
      }

      const imageUrl = payload.product?.image_url || "";
      setDrafts((current) => ({ ...current, [productId]: imageUrl }));
      setMessages((current) => ({ ...current, [productId]: "Image uploaded" }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to upload image";
      setMessages((current) => ({ ...current, [productId]: message }));
    } finally {
      setUploadingId(null);
      const input = fileInputs.current[productId];
      if (input) input.value = "";
    }
  }

  function removeImage(productId: string) {
    setDraft(productId, "");
    void saveImage(productId);
  }

  return (
    <div className="space-y-4">
      {sortedProducts.map((product) => {
        const currentUrl = (drafts[product.id] || "").trim();
        const hasImage = currentUrl.length > 0;
        const isBusy = savingId === product.id || uploadingId === product.id;

        return (
          <div key={product.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
              <div className="h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-gray-100 ring-1 ring-gray-200">
                {hasImage ? (
                  <img src={currentUrl} alt={product.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center px-2 text-center text-xs text-gray-500">
                    No image yet
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1 space-y-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-semibold text-gray-900">{product.name}</h2>
                    {product.category_name ? (
                      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                        {product.category_name}
                      </span>
                    ) : null}
                    {!product.is_active ? (
                      <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
                        Inactive
                      </span>
                    ) : null}
                  </div>
                  {product.description ? <p className="mt-1 text-sm text-gray-600">{product.description}</p> : null}
                  <p className="mt-2 text-sm font-medium text-gray-900">£{Number(product.price).toFixed(2)}</p>
                </div>

                <div className="space-y-2">
                  <label htmlFor={`image-${product.id}`} className="text-sm font-medium text-gray-700">
                    Product image URL
                  </label>
                  <input
                    id={`image-${product.id}`}
                    type="url"
                    value={drafts[product.id] || ""}
                    onChange={(event) => setDraft(product.id, event.target.value)}
                    placeholder="https://example.com/product-image.jpg"
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
                  />
                  <p className="text-xs text-gray-500">
                    Best results use a square image with the product kept inside the middle 80%.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => void saveImage(product.id)}
                    disabled={savingId === product.id || uploadingId === product.id}
                    className="rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingId === product.id ? "Saving..." : "Save image"}
                  </button>

                  <input
                    ref={(node) => {
                      fileInputs.current[product.id] = node;
                    }}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0] || null;
                      void uploadImage(product.id, file);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputs.current[product.id]?.click()}
                    disabled={isBusy}
                    className="rounded-xl border border-green-200 bg-green-50 px-4 py-2.5 text-sm font-semibold text-green-800 transition hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {uploadingId === product.id ? "Uploading..." : "Upload image"}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeImage(product.id)}
                    disabled={isBusy || !hasImage}
                    className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Remove image
                  </button>
                </div>

                <p className="text-xs text-gray-500">Uploads accept common image types up to 5MB.</p>
                {messages[product.id] ? <p className="text-sm text-gray-600">{messages[product.id]}</p> : null}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
