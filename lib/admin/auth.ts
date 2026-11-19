// Who is using the admin panel. Every admin page and action goes through
// requireAdmin(): signed in AND listed in public.platform_admins, else back to login.

import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";

export type Admin = { id: string; email: string; mustChangePassword: boolean };

export async function requireAdmin(): Promise<Admin> {
  const supabase = await createSupabaseServer();
  // getUser() asks Supabase to verify the token (never trust the cookie alone).
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) redirect("/admin/login");
  const { data: isAdmin } = await supabase.rpc("is_platform_admin");
  if (!isAdmin) {
    await supabase.auth.signOut();
    redirect("/admin/login?error=not-admin");
  }
  return { id: user.id, email: user.email ?? "", mustChangePassword: Boolean(user.user_metadata?.must_change_password) };
}

/** Same check, plus: a temporary password must be changed before anything else. */
export async function requireReadyAdmin(): Promise<Admin> {
  const admin = await requireAdmin();
  if (admin.mustChangePassword) redirect("/admin/account?first=1");
  return admin;
}
