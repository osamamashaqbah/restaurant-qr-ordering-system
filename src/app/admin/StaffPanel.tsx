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

type SecurityEvent = {
  id: string;
  event_type: string;
  actor_id: string | null;
  target_id: string | null;
  detail: { old_role?: string | null; new_role?: string | null };
  created_at: string;
};

export function StaffPanel() {
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [myId, setMyId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    const supabase = createClient();
    const [{ data: staffData, error: staffError }, { data: userData }, { data: eventData }] =
      await Promise.all([
        supabase.rpc("list_staff"),
        supabase.auth.getUser(),
        supabase
          .from("security_events")
          .select("id, event_type, actor_id, target_id, detail, created_at")
          .order("created_at", { ascending: false })
          .limit(20),
      ]);
    if (staffError) {
      setError("Couldn't load staff list.");
    } else {
      setStaff(staffData ?? []);
    }
    setEvents((eventData as SecurityEvent[]) ?? []);
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

      <h2 className="mt-8 font-display text-lg font-semibold text-charcoal">Recent role changes</h2>
      <div className="mt-3 overflow-hidden rounded-xl border border-line bg-cream-raised">
        {events.map((e) => {
          const actor = staff.find((s) => s.id === e.actor_id)?.email ?? "unknown";
          const target = staff.find((s) => s.id === e.target_id)?.email ?? "unknown";
          return (
            <div key={e.id} className="border-b border-line px-4 py-2.5 text-sm last:border-b-0">
              <span className="text-charcoal-soft">{new Date(e.created_at).toLocaleString()}</span>{" "}
              <span className="text-charcoal">{actor}</span> changed{" "}
              <span className="text-charcoal">{target}</span> from{" "}
              <span className="font-medium">{e.detail.old_role ?? "no role"}</span> to{" "}
              <span className="font-medium">{e.detail.new_role ?? "no role"}</span>
            </div>
          );
        })}
        {events.length === 0 && (
          <p className="px-4 py-6 text-center text-sm text-charcoal-soft">No role changes yet.</p>
        )}
      </div>
    </section>
  );
}
