"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { useCustomerSession } from "@/lib/customer/SessionProvider";
import { entrySchema, type EntryFormValues } from "@/lib/validation/customer";

export default function EntryPage() {
  const router = useRouter();
  const { t } = useLocale();
  const { setSession } = useCustomerSession();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EntryFormValues>({
    resolver: zodResolver(entrySchema),
  });

  const onSubmit = (values: EntryFormValues) => {
    setSession({
      name: values.name,
      whatsapp: values.whatsapp,
      tableNumber: values.tableNumber,
    });
    router.push("/menu");
  };

  return (
    <div className="mx-auto flex max-w-md flex-col px-5 py-10">
      <h1 className="font-display text-3xl font-semibold leading-tight text-charcoal">
        {t.entry.title}
      </h1>
      <p className="mt-2 text-charcoal-soft">{t.entry.subtitle}</p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-8 flex flex-col gap-5">
        <Field
          label={t.entry.name}
          error={errors.name && t.entry.errors[errors.name.message as keyof typeof t.entry.errors]}
        >
          <input
            type="text"
            autoComplete="name"
            placeholder={t.entry.namePlaceholder}
            maxLength={100}
            {...register("name")}
            className={inputClass(!!errors.name)}
          />
        </Field>

        <Field
          label={t.entry.whatsapp}
          hint={t.entry.whatsappHint}
          error={errors.whatsapp && t.entry.errors[errors.whatsapp.message as keyof typeof t.entry.errors]}
        >
          <input
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            placeholder={t.entry.whatsappPlaceholder}
            maxLength={16}
            {...register("whatsapp")}
            className={inputClass(!!errors.whatsapp)}
          />
        </Field>

        <Field
          label={t.entry.table}
          hint={t.entry.tableHint}
          error={errors.tableNumber && t.entry.errors[errors.tableNumber.message as keyof typeof t.entry.errors]}
        >
          <input
            type="text"
            inputMode="numeric"
            placeholder={t.entry.tablePlaceholder}
            maxLength={20}
            {...register("tableNumber")}
            className={inputClass(!!errors.tableNumber)}
          />
        </Field>

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-3 rounded-xl bg-terracotta px-6 py-3.5 text-base font-semibold text-white transition-standard hover:bg-terracotta-dark disabled:opacity-60"
        >
          {t.entry.submit}
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-charcoal">{label}</span>
      {children}
      {hint && !error && <span className="text-xs text-charcoal-soft">{hint}</span>}
      {error && <span className="text-xs font-medium text-danger">{error}</span>}
    </label>
  );
}

function inputClass(hasError: boolean) {
  return [
    "rounded-xl border bg-cream-raised px-4 py-3 text-base text-charcoal outline-none transition-standard",
    "placeholder:text-charcoal-soft/60",
    "focus:border-terracotta focus:ring-2 focus:ring-terracotta/20",
    hasError ? "border-danger" : "border-line",
  ].join(" ");
}
