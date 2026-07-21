"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function StaffHeader({
  title,
  fullName,
  accent,
}: {
  title: string;
  fullName: string;
  accent: "sage" | "terracotta" | "charcoal";
}) {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  };

  const accentClass = {
    sage: "bg-sage",
    terracotta: "bg-terracotta",
    charcoal: "bg-charcoal",
  }[accent];

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-cream-raised">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
        <div className="flex items-center gap-2.5">
          <span className={`h-2.5 w-2.5 rounded-full ${accentClass}`} />
          <h1 className="text-lg font-semibold text-charcoal">{title}</h1>
        </div>
        <div className="flex items-center gap-4">
          {fullName && <span className="text-sm text-charcoal-soft">{fullName}</span>}
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-charcoal-soft transition-standard hover:border-terracotta hover:text-terracotta"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
