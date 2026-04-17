"use client";

import { useMemo, useState } from "react";

type CategoryRow = {
  id: string;
  name: string;
  sort_order: number;
  product_count: number;
};

type DraftState = {
  name: string;
  sortOrder: string;
};

function emptyDraft(nextSortOrder = 0): DraftState {
  return { name: "", sortOrder: String(nextSortOrder) };
}

export default function CategoryManager({
  categories: initialCategories,
}: {
  categories: CategoryRow[];
}) {
  const [categories, setCategories] = useState<CategoryRow[]>(initialCategories);
  const [newDraft, setNewDraft] = useState<DraftState>(emptyDraft(initialCategories.length));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState<DraftState | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [globalMessage, setGlobalMessage] = useState("");

  const sortedCategories = useMemo(
    () =>
      [...categories].sort((a, b) => {
        if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
        return a.name.localeCompare(b.name);
      }),
    [categories]
  );

  function openEdit(category: CategoryRow) {
    setEditingId(category.id);
    setEditingDraft({ name: category.name, sortOrder: String(category.sort_order) });
    setGlobalMessage("");
  }

  function closeEdit() {
    setEditingId(null);
    setEditingDraft(null);
  }

  async function createCategory() {
    setBusyId("create");
    setGlobalMessage("Creating category...");
    try {
      const response = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newDraft.name,
          sortOrder: newDraft.sortOrder,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Failed to create category");
      setCategories((current) => [...current, { ...payload.category, product_count: 0 }]);
      setNewDraft(emptyDraft(categories.length + 1));
      setGlobalMessage("Category created");
    } catch (error) {
      setGlobalMessage(error instanceof Error ? error.message : "Failed to create category");
    } finally {
      setBusyId(null);
    }
  }

  async function updateCategory() {
    if (!editingId || !editingDraft) return;
    setBusyId(editingId);
    setGlobalMessage("Saving category...");
    try {
      const response = await fetch("/api/admin/categories", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: editingId,
          name: editingDraft.name,
          sortOrder: editingDraft.sortOrder,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Failed to update category");
      setCategories((current) =>
        current.map((category) =>
          category.id === editingId ? { ...category, ...payload.category } : category
        )
      );
      setGlobalMessage("Category saved");
      closeEdit();
    } catch (error) {
      setGlobalMessage(error instanceof Error ? error.message : "Failed to update category");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteCategory(category: CategoryRow) {
    const confirmed = window.confirm(`Delete category \"${category.name}\"?`);
    if (!confirmed) return;
    setBusyId(category.id);
    setGlobalMessage("Deleting category...");
    try {
      const response = await fetch("/api/admin/categories", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId: category.id }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Failed to delete category");
      setCategories((current) => current.filter((item) => item.id !== category.id));
      setGlobalMessage("Category deleted");
      if (editingId === category.id) closeEdit();
    } catch (error) {
      setGlobalMessage(error instanceof Error ? error.message : "Failed to delete category");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Add category</h2>
          <p className="mt-1 text-sm text-gray-600">Create a new category for the live menu.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-[1.4fr_180px_auto]">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Category name</label>
            <input
              value={newDraft.name}
              onChange={(event) => setNewDraft((current) => ({ ...current, name: event.target.value }))}
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none ring-0 transition focus:border-green-500"
              placeholder="e.g. Breakfast"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Sort order</label>
            <input
              value={newDraft.sortOrder}
              onChange={(event) => setNewDraft((current) => ({ ...current, sortOrder: event.target.value }))}
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none ring-0 transition focus:border-green-500"
              inputMode="numeric"
            />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={createCategory}
              disabled={busyId === "create"}
              className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busyId === "create" ? "Saving..." : "Add category"}
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Manage categories</h2>
            <p className="mt-1 text-sm text-gray-600">Rename, reorder, and safely remove categories.</p>
          </div>
          <a href="/admin/products" className="rounded-xl border px-4 py-3 text-sm font-medium">
            Back to products
          </a>
        </div>

        {globalMessage ? (
          <div className="mb-4 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">{globalMessage}</div>
        ) : null}

        <div className="space-y-3">
          {sortedCategories.map((category) => {
            const isEditing = editingId === category.id && editingDraft;
            return (
              <div key={category.id} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                {isEditing ? (
                  <div className="grid gap-4 md:grid-cols-[1.4fr_180px_140px_140px]">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Category name</label>
                      <input
                        value={editingDraft.name}
                        onChange={(event) => setEditingDraft((current) => (current ? { ...current, name: event.target.value } : current))}
                        className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none ring-0 transition focus:border-green-500"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Sort order</label>
                      <input
                        value={editingDraft.sortOrder}
                        onChange={(event) => setEditingDraft((current) => (current ? { ...current, sortOrder: event.target.value } : current))}
                        className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none ring-0 transition focus:border-green-500"
                        inputMode="numeric"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={updateCategory}
                        disabled={busyId === category.id}
                        className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {busyId === category.id ? "Saving..." : "Save"}
                      </button>
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={closeEdit}
                        className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-lg font-semibold text-gray-900">{category.name}</p>
                      <p className="mt-1 text-sm text-gray-600">
                        Sort order: {category.sort_order} · Products in category: {category.product_count}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => openEdit(category)}
                        className="inline-flex min-h-12 items-center justify-center rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteCategory(category)}
                        disabled={busyId === category.id}
                        className="inline-flex min-h-12 items-center justify-center rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {busyId === category.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {!sortedCategories.length ? <p className="text-sm text-gray-600">No categories yet.</p> : null}
        </div>
      </section>
    </div>
  );
}
