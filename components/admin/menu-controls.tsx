"use client";

// Small interactive controls for the menu editor: inline category form,
// move up/down, sold-out switch, and a two-step delete.

import { useState, useTransition } from "react";
import type { FormState } from "@/lib/admin/session-actions";
import { FormMessage, SubmitButton, inputClass, useAdminForm } from "./form";

const iconButton =
  "grid size-9 place-items-center rounded-lg bg-muted text-sm font-bold outline-none transition-opacity focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-40";

export function CategoryForm({
  action,
  nameEn,
  nameEs,
  submitLabel,
}: {
  action: (state: FormState, form: FormData) => Promise<FormState>;
  nameEn?: string;
  nameEs?: string;
  submitLabel: string;
}) {
  // The "add" form (no current name) clears itself after a success.
  const { state, pending, formProps } = useAdminForm(action, { resetOnOk: nameEn === undefined });
  return (
    <form {...formProps} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-start">
      <input name="nameEn" required maxLength={40} defaultValue={nameEn} aria-label="Category name in English" placeholder="Desserts…" autoComplete="off" className={inputClass} />
      <input name="nameEs" maxLength={40} defaultValue={nameEs} lang="es" aria-label="Category name in Spanish" placeholder="Postres…" autoComplete="off" className={inputClass} />
      <SubmitButton pending="Saving…" busy={pending}>
        {submitLabel}
      </SubmitButton>
      <div className="sm:col-span-3">
        <FormMessage state={state} />
      </div>
    </form>
  );
}

export function MoveButtons({ onMove, first, last, label }: { onMove: (direction: -1 | 1) => Promise<void>; first: boolean; last: boolean; label: string }) {
  const [pending, start] = useTransition();
  return (
    <div className="flex gap-1">
      <button type="button" aria-label={`Move ${label} up`} disabled={first || pending} onClick={() => start(() => onMove(-1))} className={iconButton}>
        ↑
      </button>
      <button type="button" aria-label={`Move ${label} down`} disabled={last || pending} onClick={() => start(() => onMove(1))} className={iconButton}>
        ↓
      </button>
    </div>
  );
}

export function SoldOutSwitch({ available, onChange, label }: { available: boolean; onChange: (available: boolean) => Promise<void>; label: string }) {
  const [value, setValue] = useState(available);
  const [pending, start] = useTransition();
  const soldOut = !value;
  return (
    <button
      type="button"
      role="switch"
      aria-checked={soldOut}
      aria-label={`${label}: sold out`}
      disabled={pending}
      onClick={() => {
        const next = !value;
        setValue(next);
        start(() => onChange(next));
      }}
      className="flex items-center gap-2 rounded-full text-xs font-bold outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-60"
    >
      <span className={`relative h-6 w-10 rounded-full transition-colors ${soldOut ? "bg-destructive" : "bg-muted"}`}>
        <span className={`absolute top-1 left-1 size-4 rounded-full bg-(--rf-card) transition-transform ${soldOut ? "translate-x-4" : ""}`} />
      </span>
      <span className={soldOut ? "text-destructive" : "text-muted-foreground"}>Sold out</span>
    </button>
  );
}

/** Asks for a second click before deleting. */
export function ConfirmDelete({ onConfirm, what }: { onConfirm: () => Promise<void>; what: string }) {
  const [armed, setArmed] = useState(false);
  const [pending, start] = useTransition();
  if (!armed) {
    return (
      <button type="button" onClick={() => setArmed(true)} className="rounded-lg px-3 py-2 text-sm font-bold text-destructive outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50">
        Delete {what}
      </button>
    );
  }
  return (
    <span className="flex flex-wrap items-center gap-2 text-sm" role="group" aria-label={`Confirm deleting ${what}`}>
      <span className="font-medium">Delete {what} for good?</span>
      <button
        type="button"
        disabled={pending}
        onClick={() => start(() => onConfirm())}
        className="rounded-lg bg-destructive px-3 py-2 font-bold text-(--rf-paper) outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-60"
      >
        {pending ? "Deleting…" : "Yes, delete"}
      </button>
      <button type="button" onClick={() => setArmed(false)} className="rounded-lg px-3 py-2 font-bold outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50">
        Keep it
      </button>
    </span>
  );
}
