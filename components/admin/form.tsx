"use client";

// Small building blocks shared by the admin forms.

import { useFormStatus } from "react-dom";
import { startTransition, useActionState, useEffect, useRef, type FormEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type FormState = { error?: string; ok?: string } | undefined;

/**
 * Runs a server action from a form WITHOUT React's automatic reset, so a typo
 * or a wrong password never wipes what was typed. `resetOnOk` clears the form
 * after a success (for "add" forms).
 */
export function useAdminForm(action: (state: FormState, form: FormData) => Promise<FormState>, { resetOnOk = false } = {}) {
  const [state, dispatch, pending] = useActionState(action, undefined);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (resetOnOk && state?.ok) ref.current?.reset();
  }, [state, resetOnOk]);
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startTransition(() => dispatch(data));
  };
  return { state, pending, formProps: { ref, onSubmit } };
}

export function Field({ label, htmlFor, hint, children }: { label: string; htmlFor: string; hint?: string; children: ReactNode }) {
  return (
    <div className="grid min-w-0 gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-bold">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function SubmitButton({ children, pending, busy: busyProp, className }: { children: ReactNode; pending: string; busy?: boolean; className?: string }) {
  const status = useFormStatus();
  const busy = busyProp ?? status.pending;
  return (
    <button
      type="submit"
      disabled={busy}
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-(--rf-ink) px-5 text-sm font-bold text-(--rf-paper) outline-none transition-opacity focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-60",
        className,
      )}
    >
      {busy ? pending : children}
    </button>
  );
}

/** Error or success line under a form, announced to screen readers. */
export function FormMessage({ state }: { state: { error?: string; ok?: string } | undefined }) {
  return (
    <p aria-live="polite" className={cn("min-h-5 text-sm font-medium", state?.error ? "text-destructive" : "text-(--rf-accent-text)")}>
      {state?.error ?? state?.ok ?? ""}
    </p>
  );
}

export { inputClass } from "./styles";
