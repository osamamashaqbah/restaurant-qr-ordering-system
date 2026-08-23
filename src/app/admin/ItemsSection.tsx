"use client";

import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import {
  menuItemSchema,
  type MenuItemFormValues,
  MAX_IMAGE_BYTES,
  ALLOWED_IMAGE_TYPES,
} from "@/lib/validation/admin";
import { ALLERGEN_CODES, allergenLabels } from "@/lib/i18n/allergens";
import { formatPrice } from "@/lib/format";
import type { Tables } from "@/types/database";

type Category = Tables<"categories">;
type MenuItem = Tables<"menu_items">;

export function ItemsSection({ categories }: { categories: Category[] }) {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<MenuItem | "new" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    const supabase = createClient();
    const { data } = await supabase.from("menu_items").select("*").order("name_en");
    setItems(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    const supabase = createClient();
    const channel = supabase
      .channel("admin-menu-items")
      .on("postgres_changes", { event: "*", schema: "public", table: "menu_items" }, () => load())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const remove = async (id: string) => {
    if (!window.confirm("Delete this menu item?")) return;
    const supabase = createClient();
    const { error } = await supabase.from("menu_items").delete().eq("id", id);
    if (error) {
      setError("Couldn't delete this item. It may still be used by an order.");
      return;
    }
    setError(null);
  };

  return (
    <section>
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-charcoal">Menu items</h2>
        <button
          type="button"
          disabled={categories.length === 0}
          onClick={() => setEditing("new")}
          className="rounded-lg bg-terracotta px-3 py-1.5 text-sm font-semibold text-white transition-standard hover:bg-terracotta-dark disabled:opacity-50"
        >
          Add item
        </button>
      </div>
      {categories.length === 0 && !loading && (
        <p className="mt-2 text-sm text-charcoal-soft">Add a category first.</p>
      )}
      {error && <p className="mt-2 text-sm font-medium text-danger">{error}</p>}

      {editing && (
        <ItemForm
          initial={editing === "new" ? null : editing}
          categories={categories}
          onDone={() => {
            setEditing(null);
            load();
          }}
          onCancel={() => setEditing(null)}
        />
      )}

      {!loading && (
        <div className="mt-3 flex flex-col gap-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-xl border border-line bg-cream-raised p-3"
            >
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-line">
                {item.image_url && (
                  <Image src={item.image_url} alt={item.name_en} fill sizes="48px" className="object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-charcoal">{item.name_en}</p>
                <p className="tabular text-xs text-charcoal-soft">
                  {formatPrice(item.price, "en")} {!item.is_available && "· unavailable"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditing(item)}
                className="text-sm font-medium text-terracotta hover:underline"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => remove(item.id)}
                className="text-sm text-charcoal-soft hover:text-danger"
              >
                Delete
              </button>
            </div>
          ))}
          {items.length === 0 && (
            <p className="rounded-xl border border-dashed border-line px-4 py-8 text-center text-sm text-charcoal-soft">
              No menu items yet.
            </p>
          )}
        </div>
      )}
    </section>
  );
}

function ItemForm({
  initial,
  categories,
  onDone,
  onCancel,
}: {
  initial: MenuItem | null;
  categories: Category[];
  onDone: () => void;
  onCancel: () => void;
}) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<MenuItemFormValues>({
    resolver: zodResolver(menuItemSchema),
    defaultValues: initial
      ? {
          category_id: initial.category_id,
          name_en: initial.name_en,
          name_ar: initial.name_ar,
          description_en: initial.description_en,
          description_ar: initial.description_ar,
          price: initial.price,
          allergens: initial.allergens.filter((a): a is (typeof ALLERGEN_CODES)[number] =>
            (ALLERGEN_CODES as readonly string[]).includes(a)
          ),
          is_available: initial.is_available,
        }
      : {
          category_id: categories[0]?.id ?? "",
          name_en: "",
          name_ar: "",
          description_en: "",
          description_ar: "",
          price: 0,
          allergens: [],
          is_available: true,
        },
  });

  const selectedAllergens = useWatch({ control, name: "allergens" });

  const toggleAllergen = (code: (typeof ALLERGEN_CODES)[number]) => {
    const next = selectedAllergens.includes(code)
      ? selectedAllergens.filter((a) => a !== code)
      : [...selectedAllergens, code];
    setValue("allergens", next);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setImageError("Use a JPEG, PNG, or WebP image.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setImageError("Image must be under 5MB.");
      return;
    }
    setImageError(null);
    setImageFile(file);
  };

  const onSubmit = async (values: MenuItemFormValues) => {
    setSubmitError(null);
    const supabase = createClient();
    let image_url = initial?.image_url ?? null;

    if (imageFile) {
      setUploading(true);
      const ext = imageFile.name.split(".").pop();
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("menu-images")
        .upload(path, imageFile, { contentType: imageFile.type });
      setUploading(false);

      if (uploadError) {
        setSubmitError("Image upload failed. Try again.");
        return;
      }
      image_url = supabase.storage.from("menu-images").getPublicUrl(path).data.publicUrl;
    }

    const payload = { ...values, image_url };
    const { error } = initial
      ? await supabase.from("menu_items").update(payload).eq("id", initial.id)
      : await supabase.from("menu_items").insert(payload);

    if (error) {
      setSubmitError("Couldn't save this item. Check the fields and try again.");
      return;
    }
    onDone();
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mt-3 flex flex-col gap-4 rounded-xl border border-line bg-cream-raised p-4"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Category">
          <select {...register("category_id")} className="rounded-lg border border-line px-3 py-2 text-sm">
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name_en}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Price">
          <input
            type="number"
            step="0.01"
            {...register("price", { valueAsNumber: true })}
            className="rounded-lg border border-line px-3 py-2 text-sm"
          />
          {errors.price && <span className="text-xs text-danger">Enter a valid price</span>}
        </Field>
        <Field label="Name (EN)">
          <input {...register("name_en")} className="rounded-lg border border-line px-3 py-2 text-sm" />
          {errors.name_en && <span className="text-xs text-danger">Required</span>}
        </Field>
        <Field label="Name (AR)">
          <input
            {...register("name_ar")}
            dir="rtl"
            className="rounded-lg border border-line px-3 py-2 text-sm"
          />
          {errors.name_ar && <span className="text-xs text-danger">Required</span>}
        </Field>
        <Field label="Description (EN)">
          <textarea
            {...register("description_en")}
            rows={2}
            className="rounded-lg border border-line px-3 py-2 text-sm"
          />
        </Field>
        <Field label="Description (AR)">
          <textarea
            {...register("description_ar")}
            dir="rtl"
            rows={2}
            className="rounded-lg border border-line px-3 py-2 text-sm"
          />
        </Field>
      </div>

      <div>
        <label className="text-xs font-medium text-charcoal-soft">Allergens</label>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {ALLERGEN_CODES.map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => toggleAllergen(code)}
              className={[
                "rounded-full border px-3 py-1 text-xs font-medium transition-standard",
                selectedAllergens.includes(code)
                  ? "border-terracotta bg-terracotta text-white"
                  : "border-line text-charcoal-soft",
              ].join(" ")}
            >
              {allergenLabels[code].emoji} {allergenLabels[code].en}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-charcoal-soft">Photo</label>
        <input
          type="file"
          accept={ALLOWED_IMAGE_TYPES.join(",")}
          onChange={handleFileChange}
          className="mt-1.5 block text-sm"
        />
        {imageError && <p className="mt-1 text-xs text-danger">{imageError}</p>}
      </div>

      <label className="flex items-center gap-2 text-sm text-charcoal">
        <input type="checkbox" {...register("is_available")} />
        Available
      </label>

      {submitError && <p className="text-sm font-medium text-danger">{submitError}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isSubmitting || uploading}
          className="rounded-lg bg-terracotta px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {uploading ? "Uploading…" : "Save item"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-line px-4 py-2 text-sm text-charcoal-soft"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-charcoal-soft">{label}</label>
      {children}
    </div>
  );
}
