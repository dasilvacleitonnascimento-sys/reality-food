"use client";

import { changePassword } from "@/lib/admin/session-actions";
import { Field, FormMessage, SubmitButton, inputClass, useAdminForm } from "./form";

export function PasswordForm() {
  const { state, pending, formProps } = useAdminForm(changePassword);
  return (
    <form {...formProps} className="grid max-w-sm gap-4">
      <Field label="New password" htmlFor="password" hint="At least 12 characters. A short sentence works well.">
        <input id="password" name="password" type="password" autoComplete="new-password" minLength={12} required className={inputClass} />
      </Field>
      <Field label="Repeat it" htmlFor="confirm">
        <input id="confirm" name="confirm" type="password" autoComplete="new-password" minLength={12} required className={inputClass} />
      </Field>
      <SubmitButton pending="Saving…" busy={pending}>
        Save new password
      </SubmitButton>
      <FormMessage state={state} />
    </form>
  );
}
