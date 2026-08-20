"use client";

import { useState } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { CategoryIcon } from "@/components/CategoryIcon";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function CategoriesPage() {
  const { categories, expenses, addCategory, renameCategory, deleteCategory } =
    useStore();
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function showNotice(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(null), 2000);
  }

  function handleAdd() {
    const name = newName.trim();
    if (!name) return;
    if (categories.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      setNotice("Kategori sudah ada.");
      return;
    }
    void addCategory({ name })
      .then(() => {
        setNewName("");
        showNotice("Kategori ditambahkan.");
      })
      .catch(() => setNotice("Gagal menambah kategori."));
  }

  function handleRename() {
    const name = editingName.trim();
    if (!editingId || !name) return;
    void renameCategory(editingId, name)
      .then(() => {
        setEditingId(null);
        showNotice("Nama kategori diperbarui.");
      })
      .catch(() => setNotice("Gagal memperbarui kategori."));
  }

  function handleDelete() {
    if (!confirmDeleteId) return;
    void deleteCategory(confirmDeleteId)
      .then(() => {
        setConfirmDeleteId(null);
        showNotice("Kategori dihapus.");
      })
      .catch(() => setNotice("Gagal menghapus kategori."));
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-ink-slate">Kategori</h1>
        <p className="mt-1 text-sm text-slate-500">
          Kelompokkan biaya berulang agar rincian pengeluaran lebih jelas.
        </p>
      </div>

      <div className="mb-6 flex gap-2">
        <label className="sr-only" htmlFor="new-category">
          Nama kategori baru
        </label>
        <input
          id="new-category"
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Nama kategori baru (mis. Streaming)"
          className="ds-input flex-1 py-2"
        />
        <Button
          onClick={handleAdd}
          className="gap-1.5"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Tambah
        </Button>
      </div>

      {notice && (
        <p role="status" className="mb-4 rounded-lg bg-primary-50 px-3 py-2 text-sm text-primary-800">
          {notice}
        </p>
      )}

      <Card className="p-0 overflow-hidden">
        <ul className="divide-y divide-slate-200">
          {categories.length === 0 && (
            <li className="px-4 py-8 text-center text-sm text-slate-500">
              Belum ada kategori. Tambahkan kategori pertama Anda.
            </li>
          )}
          {categories.map((category) => {
          const count = expenses.filter(
            (e) => e.category_id === category.id,
          ).length;
          const editing = editingId === category.id;
          return (
            <li key={category.id} className="flex items-center gap-3 px-4 py-3">
              <CategoryIcon name={category.name} />
              {editing ? (
                <div className="flex flex-1 items-center gap-2">
                  <input
                    autoFocus
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleRename()}
                    className="ds-input flex-1 py-1 px-2"
                  />
                  <button
                    type="button"
                    onClick={handleRename}
                    aria-label="Simpan nama kategori"
                    className="rounded-md p-1.5 text-primary-600 hover:bg-primary-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-100"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    aria-label="Batal edit nama"
                    className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-100"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink-slate">
                      {category.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {count} biaya berulang
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(category.id);
                      setEditingName(category.name);
                    }}
                    aria-label={`Ubah nama ${category.name}`}
                    className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-ink-slate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-100"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  {confirmDeleteId === category.id ? (
                    <div className="flex items-center gap-1">
                      <Button
                        kind="secondary"
                        onClick={handleDelete}
                        className="px-2 py-1 text-xs"
                      >
                        Yakin hapus?
                      </Button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-100"
                        aria-label="Batal hapus kategori"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(category.id)}
                      aria-label={`Hapus kategori ${category.name}`}
                      className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </>
              )}
            </li>
          );
        })}
        </ul>
      </Card>
    </div>
  );
}