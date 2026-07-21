"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Enums } from "@/types/database";

type Role = Enums<"role_type">;
type StaffRow = {
  id: string;
  email: string;
  full_name: string;
  role: Role | null;
  created_at: string;
};

const ROLES: Role[] = ["admin", "cashier", "kitchen"];

export function StaffPanel() {
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [myId, setMyId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    const supabase = createClient();
    const [{ data: staffData, error: staffError }, { data: userData }] = await Promise.all([
      supabase.rpc("list_staff"),
      supabase.auth.getUser(),
    ]);
    if (staffError) {
      setError("Couldn't load staff list.");
    } else {
      setStaff(staffData ?? []);
    }
    setMyId(userData.user?.id ?? null);
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  const changeRole = async (id: string, role: Role) => {
    setBusyId(id);
    const supabase = createClient();
    const { error } = await supabase.from("profiles").update({ role }).eq("id", id);
    setBusyId(null);
    if (error) {
      setError("Couldn't update that account's role.");
      return;
    }
    setError(null);
    load();
  };

  if (loading) return <p className="mt-2 text-charcoal-soft">Loading…</p>;

  return (
    <section>
      <p className="text-sm text-charcoal-soft">
        To add a new staff member, create their account in the Supabase dashboard
        (Authentication → Users → Add user) with an email and password, then assign
        their role below. Accounts with no role yet appear as &ldquo;No role&rdquo;.
      </p>

      {error && <p className="mt-2 text-sm font-medium text-danger">{error}</p>}

      <div className="mt-4 overflow-hidden rounded-xl border border-line bg-cream-raised">
        {staff.map((s) => (
          <div key={s.id} className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 last:border-b-0">
            <div className="min-w-0">
              <p className="truncate font-medium text-charcoal">{s.email}</p>
              {s.full_name && <p className="text-sm text-charcoal-soft">{s.full_name}</p>}
            </div>
            <select
              value={s.role ?? ""}
              disabled={busyId === s.id || s.id === myId}
              onChange={(e) => changeRole(s.id, e.target.value as Role)}
              title={s.id === myId ? "You can't change your own role" : undefined}
              className="rounded-lg border border-line px-3 py-1.5 text-sm disabled:opacity-60"
            >
              <option value="" disabled>
                No role
              </option>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        ))}
        {staff.length === 0 && (
          <p className="px-4 py-6 text-center text-sm text-charcoal-soft">No staff accounts yet.</p>
        )}
      </div>
    </section>
  );
}
