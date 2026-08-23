import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";

const ROLE_PREFIXES: Record<string, "admin" | "cashier" | "kitchen"> = {
  "/admin": "admin",
  "/cashier": "cashier",
  "/kitchen": "kitchen",
};

// Pulled out as a pure function so the route->role mapping is unit-testable
// without needing a NextRequest/Supabase client.
export function getRequiredRoleForPath(path: string) {
  return Object.entries(ROLE_PREFIXES).find(
    ([prefix]) => path === prefix || path.startsWith(`${prefix}/`)
  )?.[1];
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const requiredRole = getRequiredRoleForPath(path);

  if (requiredRole) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", path);
      return NextResponse.redirect(url);
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== requiredRole) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("error", "not_authorized");
      return NextResponse.redirect(url);
    }
  }

  return response;
}
