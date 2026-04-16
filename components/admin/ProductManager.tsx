"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type CategoryOption = {
  id: string;
  name: string;
};

type ProductRow = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  price: number;
  category_id: string;
  category_name: string | null;
};

type DraftState = {
  name: string;
  description: string;
  price: string;
  categoryId: string;
  isActive: boolean;
};

function emptyDraft(defaultCategoryId: string): DraftState {
  return {
    name: "",
    description: "",
    price: "",
    categoryId: defaultCategoryId,
    isActive: true,
  };
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-2 block text-sm font-semibold text-slate-700">{children}</label>;
}

function modalShellClassName() {
  return "flex w-full max-w-[1180px] flex-col overflow-hidden rounded-[30px] border border-black/5 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.22)]";
}

export default function ProductManager({
  tenantSlug,
  products: initialProducts,
  categories,
}: {
  tenantSlug: string;
  products: ProductRow[];
  categories: CategoryOption[];
}) {
  const [products, setProducts] = useState<ProductRow[]>(initialProducts);
  const [drafts, setDrafts] = useState<Record<string, string>>(
    Object.fromEntries(initialProducts.map((product) => [product.id, product.image_url || ""]))
  );
  const [savingId, setSavingId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, string>>({});
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState<DraftState | null>(null);
  const [creating, setCreating] = useState(false);
  const [newDraft, setNewDraft] = useState<DraftState>(emptyDraft(categories[0]?.id || ""));
  const [globalMessage, setGlobalMessage] = useState("");
  const [busyCrud, setBusyCrud] = useState<string | null>(null);

  const sortedProducts = useMemo(() => [...products].sort((a, b) => a.name.localeCompare(b.name)), [products]);
  const modalOpen = creating || !!editingId;

  useEffect(() => {
    if (!modalOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [modalOpen]);

  function categoryNameFor(id: string) {
    return categories.find((category) => category.id === id)?.name || null;
  }

  function setDraft(id: string, value: string) {
    setDrafts((current) => ({ ...current, [id]: value }));
    setMessages((current) => ({ ...current, [id]: "" }));
  }

  function openCreateModal() {
    setCreating(true);
    setEditingId(null);
    setEditingDraft(null);
    setGlobalMessage("");
  }

  function closeCreateModal() {
    setCreating(false);
    setNewDraft(emptyDraft(categories[0]?.id || ""));
  }

  function startEdit(product: ProductRow) {
    setCreating(false);
    setEditingId(product.id);
    setEditingDraft({
      name: product.name,
      description: product.description || "",
      price: String(product.price),
      categoryId: product.category_id,
      isActive: !!product.is_active,
    });
    setGlobalMessage("");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingDraft(null);
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
      setProducts((current) =>
        current.map((product) =>
          product.id === productId ? { ...product, image_url: payload.product.image_url || null } : product
        )
      );
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
      setProducts((current) =>
        current.map((product) => (product.id === productId ? { ...product, image_url: imageUrl || null } : product))
      );
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

  async function createProduct() {
    setBusyCrud("create");
    setGlobalMessage("Creating product...");
    try {
      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantSlug,
          name: newDraft.name,
          description: newDraft.description,
          price: newDraft.price,
          categoryId: newDraft.categoryId,
          isActive: newDraft.isActive,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Failed to create product");

      const product = {
        ...payload.product,
        category_name: categoryNameFor(payload.product.category_id),
      } as ProductRow;

      setProducts((current) => [...current, product]);
      setDrafts((current) => ({ ...current, [product.id]: product.image_url || "" }));
      setGlobalMessage("Product created");
      closeCreateModal();
    } catch (error) {
      setGlobalMessage(error instanceof Error ? error.message : "Failed to create product");
    } finally {
      setBusyCrud(null);
    }
  }

  async function updateProduct() {
    if (!editingId || !editingDraft) return;

    setBusyCrud(editingId);
    setGlobalMessage("Saving product...");
    try {
      const response = await fetch("/api/admin/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantSlug,
          productId: editingId,
          name: editingDraft.name,
          description: editingDraft.description,
          price: editingDraft.price,
          categoryId: editingDraft.categoryId,
          isActive: editingDraft.isActive,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Failed to update product");

      setProducts((current) =>
        current.map((product) =>
          product.id === editingId
            ? {
                ...product,
                ...payload.product,
                category_name: categoryNameFor(payload.product.category_id),
              }
            : product
        )
      );
      setGlobalMessage("Product saved");
      cancelEdit();
    } catch (error) {
      setGlobalMessage(error instanceof Error ? error.message : "Failed to update product");
    } finally {
      setBusyCrud(null);
    }
  }

  async function deleteProduct(productId: string, productName: string) {
    const confirmed = window.confirm(`Delete "${productName}"? This cannot be undone.`);
    if (!confirmed) return;

    setBusyCrud(productId);
    setGlobalMessage("Deleting product...");
    try {
      const response = await fetch("/api/admin/products", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantSlug, productId }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Failed to delete product");

      setProducts((current) => current.filter((product) => product.id !== productId));
      setGlobalMessage("Product deleted");
      if (editingId === productId) cancelEdit();
    } catch (error) {
      setGlobalMessage(error instanceof Error ? error.message : "Failed to delete product");
    } finally {
      setBusyCrud(null);
    }
  }

  return (
    <>
      <div className="space-y-6">
        <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Manage products</h2>
              <p className="mt-1 text-sm text-gray-600">Add, edit, delete, and update images for your live products.</p>
            </div>
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-700"
            >
              Add new product
            </button>
          </div>

          {globalMessage ? <p className="mt-4 text-sm text-gray-600">{globalMessage}</p> : null}
        </section>

        <div className="space-y-4">
          {sortedProducts.map((product) => {
            const currentUrl = (drafts[product.id] || "").trim();
            const hasImage = currentUrl.length > 0;
            const isBusy = savingId === product.id || uploadingId === product.id || busyCrud === product.id;

            return (
              <div key={product.id} className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                  <div className="h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-gray-100 ring-1 ring-gray-200">
                    {hasImage ? (
                      <img src={currentUrl} alt={product.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center px-2 text-center text-xs text-gray-500">No image yet</div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1 space-y-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-semibold text-gray-900">{product.name}</h2>
                        {product.category_name ? (
                          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">{product.category_name}</span>
                        ) : null}
                        {!product.is_active ? (
                          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">Inactive</span>
                        ) : null}
                      </div>
                      {product.description ? <p className="mt-1 text-sm text-gray-600">{product.description}</p> : null}
                      <p className="mt-2 text-sm font-medium text-gray-900">£{Number(product.price).toFixed(2)}</p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => startEdit(product)}
                        className="inline-flex min-h-11 items-center justify-center rounded-xl border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                      >
                        Edit product
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteProduct(product.id, product.name)}
                        disabled={busyCrud === product.id}
                        className="inline-flex min-h-11 items-center justify-center rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-60"
                      >
                        {busyCrud === product.id ? "Deleting..." : "Delete product"}
                      </button>
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
                        className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
                      />
                      <p className="text-xs text-gray-500">Best results use a square image with the product kept inside the middle 80%.</p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => void saveImage(product.id)}
                        disabled={savingId === product.id || uploadingId === product.id}
                        className="inline-flex min-h-11 items-center justify-center rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
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
                        className="inline-flex min-h-11 items-center justify-center rounded-xl border border-green-200 bg-green-50 px-5 py-3 text-sm font-semibold text-green-800 transition hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {uploadingId === product.id ? "Uploading..." : "Upload image"}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeImage(product.id)}
                        disabled={isBusy || !hasImage}
                        className="inline-flex min-h-11 items-center justify-center rounded-xl border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
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
      </div>

      {creating ? (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-[2px]">
          <div className="flex min-h-dvh items-center justify-center p-3 sm:p-5 lg:p-6 xl:p-8">
            <div className={`${modalShellClassName()} my-auto max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2.5rem)] lg:max-h-[calc(100dvh-3rem)]`}>
              <div className="relative border-b border-slate-100 bg-gradient-to-br from-white via-slate-50 to-emerald-50/60 px-5 pb-6 pt-5 sm:px-6 sm:pb-6 sm:pt-6 lg:px-8 lg:pb-7 lg:pt-7">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-slate-700 to-emerald-400" />
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Add product</p>
                    <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Create a new product</h3>
                    <p className="mt-2 text-sm text-slate-600">Add the product name, description, price, and category first. You can upload the image after saving.</p>
                  </div>
                  <button
                    type="button"
                    onClick={closeCreateModal}
                    className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-xl text-slate-500 shadow-sm transition hover:text-slate-900"
                    aria-label="Close add product"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5 lg:px-7 lg:py-6 xl:px-8 xl:py-7">
                <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr] xl:gap-6">
                  <div className="space-y-4 rounded-[26px] border border-slate-200 bg-slate-50/80 p-4 sm:p-5 lg:p-6">
                    <div>
                      <FieldLabel>Product name</FieldLabel>
                      <input
                        type="text"
                        value={newDraft.name}
                        onChange={(event) => setNewDraft((current) => ({ ...current, name: event.target.value }))}
                        placeholder="Product name"
                        className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
                      />
                    </div>

                    <div>
                      <FieldLabel>Description</FieldLabel>
                      <textarea
                        value={newDraft.description}
                        onChange={(event) => setNewDraft((current) => ({ ...current, description: event.target.value }))}
                        placeholder="Short description"
                        rows={7}
                        className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
                      />
                    </div>
                  </div>

                  <div className="space-y-4 rounded-[26px] border border-slate-200 bg-white p-4 sm:p-5 lg:p-6">
                    <div>
                      <FieldLabel>Price</FieldLabel>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={newDraft.price}
                        onChange={(event) => setNewDraft((current) => ({ ...current, price: event.target.value }))}
                        placeholder="Price"
                        className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
                      />
                    </div>

                    <div>
                      <FieldLabel>Category</FieldLabel>
                      <select
                        value={newDraft.categoryId}
                        onChange={(event) => setNewDraft((current) => ({ ...current, categoryId: event.target.value }))}
                        className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
                      >
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <FieldLabel>Status</FieldLabel>
                      <label className="flex min-h-[52px] items-center gap-3 rounded-2xl border border-gray-300 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={newDraft.isActive}
                          onChange={(event) => setNewDraft((current) => ({ ...current, isActive: event.target.checked }))}
                        />
                        Show this product live
                      </label>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Preview</p>
                      <p className="mt-3 text-base font-semibold text-slate-900">{newDraft.name || "Untitled product"}</p>
                      <p className="mt-2 text-sm text-slate-600">
                        {newDraft.description?.trim() || "Add a short description to help customers understand the item."}
                      </p>
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-100">
                          £{Number(newDraft.price || 0).toFixed(2)}
                        </span>
                        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-600 ring-1 ring-slate-200">
                          {categoryNameFor(newDraft.categoryId) || "No category"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 bg-white px-4 py-4 sm:px-6 sm:py-5 lg:px-7 lg:py-6 xl:px-8">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <button
                    type="button"
                    onClick={closeCreateModal}
                    className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 lg:px-7"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void createProduct()}
                    disabled={busyCrud === "create"}
                    className="inline-flex min-h-12 items-center justify-center rounded-xl bg-green-600 px-7 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-60 lg:px-8"
                  >
                    {busyCrud === "create" ? "Creating..." : "Create product"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {editingId && editingDraft ? (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-[2px]">
          <div className="flex min-h-dvh items-center justify-center p-3 sm:p-5 lg:p-6 xl:p-8">
            <div className={`${modalShellClassName()} my-auto max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2.5rem)] lg:max-h-[calc(100dvh-3rem)]`}>
              <div className="relative border-b border-slate-100 bg-gradient-to-br from-white via-slate-50 to-emerald-50/60 px-5 pb-6 pt-5 sm:px-6 sm:pb-6 sm:pt-6 lg:px-8 lg:pb-7 lg:pt-7">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-slate-700 to-emerald-400" />
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Edit product</p>
                    <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{editingDraft.name || "Product details"}</h3>
                    <p className="mt-2 text-sm text-slate-600">Update the product details, category, price, and live visibility in one place.</p>
                  </div>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-xl text-slate-500 shadow-sm transition hover:text-slate-900"
                    aria-label="Close edit product"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5 lg:px-7 lg:py-6 xl:px-8 xl:py-7">
                <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr] xl:gap-6">
                  <div className="space-y-4 rounded-[26px] border border-slate-200 bg-slate-50/80 p-4 sm:p-5 lg:p-6">
                    <div>
                      <FieldLabel>Product name</FieldLabel>
                      <input
                        type="text"
                        value={editingDraft.name}
                        onChange={(event) => setEditingDraft({ ...editingDraft, name: event.target.value })}
                        className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
                      />
                    </div>

                    <div>
                      <FieldLabel>Description</FieldLabel>
                      <textarea
                        value={editingDraft.description}
                        onChange={(event) => setEditingDraft({ ...editingDraft, description: event.target.value })}
                        rows={7}
                        className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
                      />
                    </div>
                  </div>

                  <div className="space-y-4 rounded-[26px] border border-slate-200 bg-white p-4 sm:p-5 lg:p-6">
                    <div>
                      <FieldLabel>Price</FieldLabel>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={editingDraft.price}
                        onChange={(event) => setEditingDraft({ ...editingDraft, price: event.target.value })}
                        className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
                      />
                    </div>

                    <div>
                      <FieldLabel>Category</FieldLabel>
                      <select
                        value={editingDraft.categoryId}
                        onChange={(event) => setEditingDraft({ ...editingDraft, categoryId: event.target.value })}
                        className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
                      >
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <FieldLabel>Status</FieldLabel>
                      <label className="flex min-h-[52px] items-center gap-3 rounded-2xl border border-gray-300 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={editingDraft.isActive}
                          onChange={(event) => setEditingDraft({ ...editingDraft, isActive: event.target.checked })}
                        />
                        Show this product live
                      </label>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Preview</p>
                      <p className="mt-3 text-base font-semibold text-slate-900">{editingDraft.name || "Untitled product"}</p>
                      <p className="mt-2 text-sm text-slate-600">
                        {editingDraft.description?.trim() || "Add a short description to help customers understand the item."}
                      </p>
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-100">
                          £{Number(editingDraft.price || 0).toFixed(2)}
                        </span>
                        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-600 ring-1 ring-slate-200">
                          {categoryNameFor(editingDraft.categoryId) || "No category"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 bg-white px-4 py-4 sm:px-6 sm:py-5 lg:px-7 lg:py-6 xl:px-8">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 lg:px-7"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void updateProduct()}
                    disabled={busyCrud === editingId}
                    className="inline-flex min-h-12 items-center justify-center rounded-xl bg-green-600 px-7 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-60 lg:px-8"
                  >
                    {busyCrud === editingId ? "Saving..." : "Save product"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
