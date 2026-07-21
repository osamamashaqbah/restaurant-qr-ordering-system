"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const MAX_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 30;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (searchParams.get("error") === "not_authorized") {
      // One-time banner derived from the redirect the proxy sent us here
      // with, not from user interaction — an effect is the right place.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError("You don't have access to that page.");
    }
  }, [searchParams]);

  useEffect(() => {
    if (!lockedUntil) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [lockedUntil]);

  const isLocked = lockedUntil !== null && now < lockedUntil;
  const secondsLeft = isLocked ? Math.ceil((lockedUntil! - now) / 1000) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;

    setSubmitting(true);
    setError(null);

    const supabase = createClient();
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError || !data.user) {
      // Deliberately generic — never confirm whether the email exists.
      // Supabase's own Auth rate limiting is the real brute-force control;
      // this client-side lockout is a UX-layer speed bump on top of it.
      setError("Invalid email or password.");
      const nextAttempts = attempts + 1;
      setAttempts(nextAttempts);
      if (nextAttempts >= MAX_ATTEMPTS) {
        setLockedUntil(Date.now() + LOCKOUT_SECONDS * 1000);
        setAttempts(0);
      }
      setSubmitting(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    if (!profile?.role) {
      await supabase.auth.signOut();
      setError("Your account doesn't have a role assigned yet. Contact an admin.");
      setSubmitting(false);
      return;
    }

    const destination = next && next.startsWith(`/${profile.role}`) ? next : `/${profile.role}`;
    router.replace(destination);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-6 flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-charcoal">Email</span>
        <input
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-xl border border-line bg-cream-raised px-4 py-3 text-base outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/20"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-charcoal">Password</span>
        <input
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-xl border border-line bg-cream-raised px-4 py-3 text-base outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/20"
        />
      </label>

      {error && <p className="text-sm font-medium text-danger">{error}</p>}
      {isLocked && (
        <p className="text-sm text-charcoal-soft">Too many attempts. Try again in {secondsLeft}s.</p>
      )}

      <button
        type="submit"
        disabled={submitting || isLocked}
        className="mt-1 rounded-xl bg-terracotta px-5 py-3 font-semibold text-white transition-standard hover:bg-terracotta-dark disabled:opacity-60"
      >
        {submitting ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
