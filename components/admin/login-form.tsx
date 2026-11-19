"use client";

import { useSearchParams } from "next/navigation";
import { signIn } from "@/lib/admin/session-actions";
import { Field, FormMessage, SubmitButton, inputClass, useAdminForm } from "./form";

export function LoginForm() {
  const { state, pending, formProps } = useAdminForm(signIn);
  const notAdmin = useSearchParams().get("error") === "not-admin";
  return (
    <form {...formProps} className="grid gap-4">
      <Field label="Email" htmlFor="email">
        <input id="email" name="email" type="email" autoComplete="email" spellCheck={false} required className={inputClass} />
      </Field>
      <Field label="Password" htmlFor="password">
        <input id="password" name="password" type="password" autoComplete="current-password" required className={inputClass} />
      </Field>
      <SubmitButton pending="Signing in…" busy={pending} className="mt-1 w-full">
        Sign in
      </SubmitButton>
      <FormMessage state={state ?? (notAdmin ? { error: "This account doesn't have access to the Reality Food admin." } : undefined)} />
    </form>
  );
}
