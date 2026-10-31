import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function getSessionUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return { supabase, user: data.user };
}

export async function getProfile() {
  const { supabase, user } = await getSessionUser();
  if (!user) return { supabase, user: null, profile: null };
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  return { supabase, user, profile };
}

export async function requireUser(next = "/") {
  const ctx = await getProfile();
  if (!ctx.user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return ctx as typeof ctx & { user: NonNullable<typeof ctx.user> };
}

/** Use at the top of every admin page AND every admin server action. */
export async function requireAdmin() {
  const ctx = await requireUser("/admin");
  if (ctx.profile?.role !== "admin") redirect("/");
  return ctx;
}
