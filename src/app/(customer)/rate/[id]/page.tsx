"use client";

import { use, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { ratingSchema } from "@/lib/validation/customer";

export default function RatingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { t } = useLocale();

  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "done" | "already" | "error">("idle");

  const handleSubmit = async () => {
    const parsed = ratingSchema.safeParse({ stars, comment });
    if (!parsed.success) return;

    setSubmitting(true);
    const supabase = createClient();
    const { error } = await supabase.rpc("submit_rating", {
      p_order_id: id,
      p_stars: parsed.data.stars,
      p_comment: parsed.data.comment,
    });
    setSubmitting(false);

    if (error) {
      setStatus(error.message.includes("duplicate") ? "already" : "error");
      return;
    }
    setStatus("done");
  };

  if (status === "done") {
    return (
      <div className="mx-auto max-w-md px-5 py-16 text-center">
        <p className="font-display text-2xl font-semibold text-charcoal">{t.rating.submitted}</p>
      </div>
    );
  }

  if (status === "already") {
    return (
      <div className="mx-auto max-w-md px-5 py-16 text-center">
        <p className="text-charcoal-soft">{t.rating.already}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-5 py-10">
      <h1 className="font-display text-2xl font-semibold text-charcoal">{t.rating.title}</h1>
      <p className="mt-1 text-charcoal-soft">{t.rating.subtitle}</p>

      <div className="mt-6 flex justify-center gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setStars(n)}
            aria-label={`${n} star`}
            className="text-4xl transition-standard"
          >
            <span className={n <= stars ? "text-gold" : "text-line"}>★</span>
          </button>
        ))}
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value.slice(0, 500))}
        placeholder={t.rating.commentPlaceholder}
        rows={4}
        maxLength={500}
        className="mt-6 w-full rounded-xl border border-line bg-cream-raised px-4 py-3 text-base outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/20"
      />

      {status === "error" && (
        <p className="mt-2 text-sm font-medium text-danger">{t.cart.errorGeneric}</p>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={stars === 0 || submitting}
        className="mt-4 w-full rounded-xl bg-terracotta px-5 py-3.5 font-semibold text-white transition-standard hover:bg-terracotta-dark disabled:opacity-60"
      >
        {t.rating.submit}
      </button>
    </div>
  );
}
