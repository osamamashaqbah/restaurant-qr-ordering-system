import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/types/database";

type Role = Enums<"role_type">;

// Defense in depth alongside proxy.ts: every staff layout re-checks auth and
// role server-side rather than trusting that the proxy already gated it.
export async function getStaffUser(requiredRole: Role) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/${requiredRole}`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  if (profile?.role !== requiredRole) {
    redirect("/login?error=not_authorized");
  }

  return { user, role: profile.role, fullName: profile.full_name };
}
