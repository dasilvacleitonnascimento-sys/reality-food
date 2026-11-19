"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import { createSupabaseServer } from "@/lib/supabase/server";

export type FormState = { error?: string; ok?: string } | undefined;

const loginSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

export async function signIn(_: FormState, form: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({ email: form.get("email"), password: form.get("password") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const supabase = await createSupabaseServer();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: "Wrong email or password. Check both and try again." };
  const { data: isAdmin } = await supabase.rpc("is_platform_admin");
  if (!isAdmin) {
    await supabase.auth.signOut();
    return { error: "This account doesn't have access to the Reality Food admin." };
  }
  redirect("/admin");
}

export async function signOut() {
  const supabase = await createSupabaseServer();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

const passwordSchema = z
  .object({
    password: z.string().min(12, "Use at least 12 characters."),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { message: "The two passwords don't match.", path: ["confirm"] });

export async function changePassword(_: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = passwordSchema.safeParse({ password: form.get("password"), confirm: form.get("confirm") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const supabase = await createSupabaseServer();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password, data: { must_change_password: false } });
  if (error) return { error: `Password not changed: ${error.message}` };
  redirect("/admin?password=changed");
}
