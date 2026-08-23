"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { categorySchema, type CategoryFormValues } from "@/lib/validation/admin";
import type { Tables } from "@/types/database";

type Category = Tables<"categories">;

export function CategoriesSection({ categories, loading }: { categories: Category[]; loading: boolean }) {
  const [editing, setEditing] = useState<Category | "new" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const remove = async (id: string) => {
    if (!window.confirm("Delete this category? It must have no items left in it.")) return;
    const supabase = createClient();
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) {
      setError("Couldn't delete — move or remove its items first.");
      return;
    }
    setError(null);
  };

  return (
    <section>
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-charcoal">Categories</h2>
        <button
          type="button"
          onClick={() => setEditing("new")}
          className="rounded-lg bg-terracotta px-3 py-1.5 text-sm font-semibold text-white transition-standard hover:bg-terracotta-dark"
        >
          Add category
        </button>
      </div>

      {error && <p className="mt-2 text-sm font-medium text-danger">{error}</p>}

      {editing && (
        <CategoryForm
          initial={editing === "new" ? null : editing}
          onDone={() => setEditing(null)}
          onCancel={() => setEditing(null)}
        />
      )}

      {!loading && (
        <div className="mt-3 overflow-hidden rounded-xl border border-line bg-cream-raised">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center justify-between border-b border-line px-4 py-2.5 last:border-b-0">
              <div>
                <p className="font-medium text-charcoal">{cat.name_en}</p>
                <p className="text-sm text-charcoal-soft">{cat.name_ar}</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setEditing(cat)}
                  className="text-sm font-medium text-terracotta hover:underline"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => remove(cat.id)}
                  className="text-sm text-charcoal-soft hover:text-danger"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          {categories.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-charcoal-soft">No categories yet.</p>
          )}
        </div>
      )}
    </section>
  );
}

function CategoryForm({
  initial,
  onDone,
  onCancel,
}: {
  initial: Category | null;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: initial
      ? { name_en: initial.name_en, name_ar: initial.name_ar, sort_order: initial.sort_order }
      : { name_en: "", name_ar: "", sort_order: 0 },
  });

  const onSubmit = async (values: CategoryFormValues) => {
    setSubmitError(null);
    const supabase = createClient();
    const result = initial
      ? await supabase.from("categories").update(values).eq("id", initial.id)
      : await supabase.from("categories").insert(values);
    if (result.error) {
      setSubmitError("Couldn't save this category. Please try again.");
      return;
    }
    onDone();
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mt-3 grid grid-cols-1 gap-3 rounded-xl border border-line bg-cream-raised p-4 sm:grid-cols-4"
    >
      {submitError && <p className="text-sm font-medium text-danger sm:col-span-4">{submitError}</p>}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-charcoal-soft">Name (EN)</label>
        <input {...register("name_en")} className="rounded-lg border border-line px-3 py-2 text-sm" />
        {errors.name_en && <span className="text-xs text-danger">Required</span>}
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-charcoal-soft">Name (AR)</label>
        <input {...register("name_ar")} dir="rtl" className="rounded-lg border border-line px-3 py-2 text-sm" />
        {errors.name_ar && <span className="text-xs text-danger">Required</span>}
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-charcoal-soft">Sort order</label>
        <input
          type="number"
          {...register("sort_order", { valueAsNumber: true })}
          className="rounded-lg border border-line px-3 py-2 text-sm"
        />
      </div>
      <div className="flex items-end gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-terracotta px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-line px-3 py-2 text-sm text-charcoal-soft"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
