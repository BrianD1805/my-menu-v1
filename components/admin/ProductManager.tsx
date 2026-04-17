"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

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
  imageUrl: string;
};

function emptyDraft(defaultCategoryId: string): DraftState {
  return {
    name: "",
    description: "",
    price: "",
    categoryId: defaultCategoryId,
    isActive: true,
    imageUrl: "",
  };
}

function modalShellClassName() {
  return "flex w-full max-w-[1180px] flex-col overflow-hidden rounded-[30px] border border-black/5 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.22)]";
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <label className="mb-2 block text-sm font-semibold text-slate-700">{children}</label>;
}

function stripHtml(value: string | null | undefined) {
  return String(value || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function RichTextEditor({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const editorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    if (editor.innerHTML !== value) {
      editor.innerHTML = value || "";
    }
  }, [value]);

  function run(command: string, commandValue?: string) {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    (document as Document & { execCommand?: (cmd: string, ui?: boolean, val?: string) => boolean }).execCommand?.(
      command,
      false,
      commandValue
    );
    onChange(editor.innerHTML);
  }

  return (
    <div className="rounded-[24px] border border-gray-300 bg-white">
      <div className="flex flex-wrap gap-2 border-b border-gray-200 bg-slate-50/80 p-3">
        <button type="button" onClick={() => run("formatBlock", "<h2>")} className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50">
          Heading
        </button>
        <button type="button" onClick={() => run("formatBlock", "<h3>")} className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50">
          Subheading
        </button>
        <button type="button" onClick={() => run("bold")} className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50">
          Bold
        </button>
        <button type="button" onClick={() => run("insertUnorderedList")} className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50">
          Bullets
        </button>
        <button type="button" onClick={() => run("insertParagraph")} className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50">
          Paragraph
        </button>
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={(event) => onChange(event.currentTarget.innerHTML)}
        className="min-h-[220px] w-full rounded-b-[24px] px-4 py-4 text-sm leading-7 text-slate-700 outline-none [&_h2]:mb-3 [&_h2]:mt-5 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:text-lg [&_h3]:font-semibold [&_li]:ml-5 [&_li]:list-disc [&_p]:my-3"
      />
    </div>
  );
}

export default function ProductManager({
  products: initialProducts,
  categories,
}: {
  products: ProductRow[];
  categories: CategoryOption[];
}) {
  const [products, setProducts] = useState<ProductRow[]>(initialProducts);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState<DraftState | null>(null);
  const [creating, setCreating] = useState(false);
  const [newDraft, setNewDraft] = useState<DraftState>(emptyDraft(categories[0]?.id || ""));
  const [globalMessage, setGlobalMessage] = useState("");
  const [busyCrud, setBusyCrud] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [searchOpen, setSearchOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const sortedProducts = useMemo(() => [...products].sort((a, b) => a.name.localeCompare(b.name)), [products]);
  const filteredProducts = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return sortedProducts.filter((product) => {
      const matchesCategory = selectedCategoryId === "all" || product.category_id === selectedCategoryId;
      if (!matchesCategory) return false;
      if (!normalizedQuery) return true;

      const haystack = [product.name, stripHtml(product.description), product.category_name || ""].join(" ").toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [searchQuery, selectedCategoryId, sortedProducts]);
  const hasActiveFilters = searchQuery.trim().length > 0 || selectedCategoryId !== "all";
  const modalOpen = creating || !!editingId || searchOpen;

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

  function openCreateModal() {
    setCreating(true);
    setEditingId(null);
    setEditingDraft(null);
    setNewDraft(emptyDraft(categories[0]?.id || ""));
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
      imageUrl: product.image_url || "",
    });
    setGlobalMessage("");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingDraft(null);
  }

  async function createProduct() {
    setBusyCrud("create");
    setGlobalMessage("Creating product...");
    try {
      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newDraft.name,
          description: newDraft.description,
          price: newDraft.price,
          categoryId: newDraft.categoryId,
          isActive: newDraft.isActive,
          imageUrl: newDraft.imageUrl,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Failed to create product");

      const product = {
        ...payload.product,
        category_name: categoryNameFor(payload.product.category_id),
      } as ProductRow;

      setProducts((current) => [...current, product]);
      setCreating(false);
      setEditingId(product.id);
      setEditingDraft({
        name: product.name,
        description: product.description || "",
        price: String(product.price),
        categoryId: product.category_id,
        isActive: !!product.is_active,
        imageUrl: product.image_url || "",
      });
      setGlobalMessage("Product created. You can keep editing it here, including uploading an image file.");
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
          productId: editingId,
          name: editingDraft.name,
          description: editingDraft.description,
          price: editingDraft.price,
          categoryId: editingDraft.categoryId,
          isActive: editingDraft.isActive,
          imageUrl: editingDraft.imageUrl,
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
        body: JSON.stringify({ productId }),
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

  async function uploadImage(file: File | null) {
    if (!file || !editingId) return;

    setUploadingId(editingId);
    setGlobalMessage("Uploading image...");

    try {
      const formData = new FormData();
      formData.append("productId", editingId);
      formData.append("file", file);

      const response = await fetch("/api/admin/products/image", {
        method: "POST",
        body: formData,
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Failed to upload image");

      const imageUrl = payload.product?.image_url || "";
      setEditingDraft((current) => (current ? { ...current, imageUrl } : current));
      setProducts((current) =>
        current.map((product) => (product.id === editingId ? { ...product, image_url: imageUrl || null } : product))
      );
      setGlobalMessage("Image uploaded");
    } catch (error) {
      setGlobalMessage(error instanceof Error ? error.message : "Failed to upload image");
    } finally {
      setUploadingId(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function removeImage() {
    if (!editingId || !editingDraft) return;
    setEditingDraft({ ...editingDraft, imageUrl: "" });
  }

  const activeDraft = creating ? newDraft : editingDraft;

  return (
    <>
      <div className="space-y-6">
        <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Manage products</h2>
              <p className="mt-1 text-sm text-gray-600">Keep the page clean, then use the popup tools to search, filter, add, or edit products.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <span className="text-base">⌕</span>
                Search products
              </button>
              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-700"
              >
                Add new product
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
            <p>
              {sortedProducts.length} {sortedProducts.length === 1 ? "product" : "products"} in your list
            </p>
            {globalMessage ? <p>{globalMessage}</p> : null}
          </div>
        </section>

        <div className="space-y-4">
          {sortedProducts.length ? sortedProducts.map((product) => {
            const hasImage = !!product.image_url;
            return (
              <div key={product.id} className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                  <div className="h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-gray-100 ring-1 ring-gray-200">
                    {hasImage ? (
                      <img src={product.image_url!} alt={product.name} className="h-full w-full object-cover" />
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
                      {product.description ? <p className="mt-1 text-sm text-gray-600">{stripHtml(product.description).slice(0, 180)}{stripHtml(product.description).length > 180 ? "..." : ""}</p> : null}
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
                  </div>
                </div>
              </div>
            );
          }) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
              <p className="text-lg font-semibold text-slate-900">No products yet</p>
              <p className="mt-2 text-sm text-slate-600">Add your first product to start building the menu.</p>
            </div>
          )}
        </div>
      </div>

      {searchOpen ? (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-[2px]">
          <div className="flex min-h-dvh items-center justify-center px-4 py-5 sm:p-5 lg:p-6 xl:p-8">
            <div className="my-auto flex w-full max-w-3xl flex-col overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.22)] max-h-[calc(100dvh-2.5rem)] sm:max-h-[calc(100dvh-3rem)]">
              <div className="relative border-b border-slate-100 bg-gradient-to-br from-white via-slate-50 to-emerald-50/70 px-5 pb-5 pt-5 sm:px-6 lg:px-8">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-slate-700 to-emerald-400" />
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Search products</p>
                    <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Find a product quickly</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">Search by name, description, or category, then open the matching product straight into edit mode.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSearchOpen(false)}
                    className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-xl text-slate-500 shadow-sm transition hover:text-slate-900"
                    aria-label="Close search"
                  >
                    ×
                  </button>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-[1fr_220px]">
                  <div className="flex min-h-[54px] items-center rounded-2xl border border-slate-200 bg-white px-4 shadow-sm transition focus-within:border-emerald-400 focus-within:shadow-[0_0_0_4px_rgba(16,185,129,0.10)]">
                    <span className="mr-3 text-lg text-slate-400">⌕</span>
                    <input
                      autoFocus
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="Search products, descriptions, or categories"
                      className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                    />
                    {searchQuery ? (
                      <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        className="ml-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:text-slate-900"
                        aria-label="Clear search"
                      >
                        ×
                      </button>
                    ) : null}
                  </div>

                  <select
                    value={selectedCategoryId}
                    onChange={(event) => setSelectedCategoryId(event.target.value)}
                    className="min-h-[54px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                  >
                    <option value="all">All categories</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6">
                <div className="mb-4 flex items-center justify-between gap-3 text-sm text-slate-600">
                  <p>{filteredProducts.length} {filteredProducts.length === 1 ? "result" : "results"}</p>
                  {hasActiveFilters ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        setSelectedCategoryId("all");
                      }}
                      className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      Clear search
                    </button>
                  ) : null}
                </div>

                {filteredProducts.length ? (
                  <div className="space-y-3">
                    {filteredProducts.map((product) => {
                      const hasImage = !!product.image_url;
                      return (
                        <div key={product.id} className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-200">
                              {hasImage ? (
                                <img src={product.image_url!} alt={product.name} className="h-full w-full object-cover" />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center px-2 text-center text-[11px] font-medium text-slate-500">No image</div>
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="text-lg font-semibold text-slate-900">{product.name}</h4>
                                {product.category_name ? (
                                  <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold tracking-wide text-slate-500 ring-1 ring-slate-200">{product.category_name}</span>
                                ) : null}
                                {!product.is_active ? (
                                  <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-amber-700">Inactive</span>
                                ) : null}
                              </div>
                              {product.description ? (
                                <p className="mt-2 text-sm leading-6 text-slate-600">
                                  {stripHtml(product.description).slice(0, 160)}{stripHtml(product.description).length > 160 ? "..." : ""}
                                </p>
                              ) : null}
                              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                                <p className="text-sm font-semibold text-slate-900">£{Number(product.price).toFixed(2)}</p>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSearchOpen(false);
                                    startEdit(product);
                                  }}
                                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                                >
                                  Edit product
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-[26px] border border-dashed border-slate-300 bg-slate-50/60 p-8 text-center">
                    <p className="text-lg font-semibold text-slate-900">No matching products</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">Try another search term or switch the category filter.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {modalOpen && activeDraft ? (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-[2px]">
          <div className="flex min-h-dvh items-center justify-center px-4 py-5 sm:p-5 lg:p-6 xl:p-8">
            <div className={`${modalShellClassName()} my-auto max-h-[calc(100dvh-2.5rem)] sm:max-h-[calc(100dvh-2.5rem)] lg:max-h-[calc(100dvh-3rem)]`}>
              <div className="relative border-b border-slate-100 bg-gradient-to-br from-white via-slate-50 to-emerald-50/60 px-5 pb-6 pt-5 sm:px-6 sm:pb-6 sm:pt-6 lg:px-8 lg:pb-7 lg:pt-7">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-slate-700 to-emerald-400" />
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">{creating ? "Add product" : "Edit product"}</p>
                    <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-[1.85rem]">
                      {creating ? "Create a new product" : "Update product details"}
                    </h3>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                      Keep all product fields in this editor, including the image and formatted description.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => (creating ? closeCreateModal() : cancelEdit())}
                    className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-xl text-slate-500 shadow-sm transition hover:bg-white hover:text-slate-900"
                    aria-label="Close editor"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5 lg:px-7 lg:py-6 xl:px-8 xl:py-7">
                <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
                  <div className="space-y-5 rounded-[26px] border border-slate-200 bg-slate-50/70 p-4 sm:p-5 lg:p-6">
                    <div>
                      <FieldLabel>Product name</FieldLabel>
                      <input
                        type="text"
                        value={activeDraft.name}
                        onChange={(event) =>
                          creating
                            ? setNewDraft((current) => ({ ...current, name: event.target.value }))
                            : setEditingDraft((current) => (current ? { ...current, name: event.target.value } : current))
                        }
                        placeholder="e.g. Chicken Tikka Wrap"
                        className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <FieldLabel>Price</FieldLabel>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={activeDraft.price}
                          onChange={(event) =>
                            creating
                              ? setNewDraft((current) => ({ ...current, price: event.target.value }))
                              : setEditingDraft((current) => (current ? { ...current, price: event.target.value } : current))
                          }
                          placeholder="0.00"
                          className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
                        />
                      </div>

                      <div>
                        <FieldLabel>Category</FieldLabel>
                        <select
                          value={activeDraft.categoryId}
                          onChange={(event) =>
                            creating
                              ? setNewDraft((current) => ({ ...current, categoryId: event.target.value }))
                              : setEditingDraft((current) => (current ? { ...current, categoryId: event.target.value } : current))
                          }
                          className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
                        >
                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <FieldLabel>Status</FieldLabel>
                      <label className="flex min-h-[52px] items-center gap-3 rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={activeDraft.isActive}
                          onChange={(event) =>
                            creating
                              ? setNewDraft((current) => ({ ...current, isActive: event.target.checked }))
                              : setEditingDraft((current) => (current ? { ...current, isActive: event.target.checked } : current))
                          }
                          className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        Visible on the live menu
                      </label>
                    </div>

                    <div>
                      <FieldLabel>Image URL</FieldLabel>
                      <input
                        type="url"
                        value={activeDraft.imageUrl}
                        onChange={(event) =>
                          creating
                            ? setNewDraft((current) => ({ ...current, imageUrl: event.target.value }))
                            : setEditingDraft((current) => (current ? { ...current, imageUrl: event.target.value } : current))
                        }
                        placeholder="https://example.com/product-image.jpg"
                        className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
                      />
                      <p className="mt-2 text-xs text-slate-500">Paste a direct image link here, or upload an image file once the product exists.</p>
                    </div>

                    {!creating ? (
                      <div className="rounded-[24px] border border-dashed border-slate-300 bg-white p-4">
                        <div className="flex flex-wrap items-center gap-3">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(event) => {
                              const file = event.target.files?.[0] || null;
                              void uploadImage(file);
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingId === editingId}
                            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-green-200 bg-green-50 px-5 py-3 text-sm font-semibold text-green-800 transition hover:bg-green-100 disabled:opacity-60"
                          >
                            {uploadingId === editingId ? "Uploading..." : "Upload image file"}
                          </button>
                          <button
                            type="button"
                            onClick={() => void removeImage()}
                            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                          >
                            Remove image
                          </button>
                        </div>
                        <p className="mt-2 text-xs text-slate-500">Uploads accept common image types up to 5MB.</p>
                      </div>
                    ) : null}

                    <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white">
                      <div className="aspect-[4/3] bg-slate-100">
                        {activeDraft.imageUrl ? (
                          <img src={activeDraft.imageUrl} alt={activeDraft.name || "Product preview"} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-sm text-slate-500">Image preview will appear here</div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 rounded-[26px] border border-slate-200 bg-white p-4 sm:p-5 lg:p-6">
                    <div>
                      <FieldLabel>Formatted description</FieldLabel>
                      <RichTextEditor
                        value={activeDraft.description}
                        onChange={(value) =>
                          creating
                            ? setNewDraft((current) => ({ ...current, description: value }))
                            : setEditingDraft((current) => (current ? { ...current, description: value } : current))
                        }
                      />
                      <p className="mt-2 text-xs text-slate-500">Use headings, bold text, spacing, and bullet points. This formatting shows in the customer product popup.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 bg-white px-4 py-4 sm:px-6 sm:py-5 lg:px-7 lg:py-6 xl:px-8">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <button
                    type="button"
                    onClick={() => (creating ? closeCreateModal() : cancelEdit())}
                    className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-200 px-6 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 lg:px-7"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void (creating ? createProduct() : updateProduct())}
                    disabled={busyCrud === (creating ? "create" : editingId)}
                    className="inline-flex min-h-12 items-center justify-center rounded-xl bg-gray-700/85 px-7 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-80 lg:px-8"
                  >
                    {busyCrud === (creating ? "create" : editingId)
                      ? creating
                        ? "Creating..."
                        : "Saving..."
                      : creating
                        ? "Create product"
                        : "Save product"}
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
