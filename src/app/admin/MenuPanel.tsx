"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CategoriesSection } from "./CategoriesSection";
import { ItemsSection } from "./ItemsSection";
import type { Tables } from "@/types/database";

type Category = Tables<"categories">;

export function MenuPanel() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCategories = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.from("categories").select("*").order("sort_order");
    setCategories(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadCategories();
    const supabase = createClient();
    const channel = supabase
      .channel("admin-categories")
      .on("postgres_changes", { event: "*", schema: "public", table: "categories" }, () => loadCategories())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadCategories]);

  return (
    <div className="flex flex-col gap-8">
      <CategoriesSection categories={categories} loading={loading} />
      <ItemsSection categories={categories} />
    </div>
  );
}
