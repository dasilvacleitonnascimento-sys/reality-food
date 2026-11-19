"use client";

import type { FormState } from "@/lib/admin/session-actions";
import type { RestaurantRow } from "@/lib/supabase/database.types";
import { Field, FormMessage, SubmitButton, inputClass, useAdminForm } from "./form";
import { ImageUpload } from "./image-upload";

type Props = {
  action: (state: FormState, form: FormData) => Promise<FormState>;
  restaurant?: RestaurantRow;
};

export function RestaurantForm({ action, restaurant }: Props) {
  const { state, pending, formProps } = useAdminForm(action);
  const tagline = (restaurant?.tagline ?? {}) as { en?: string; es?: string };
  return (
    <form {...formProps} className="grid max-w-xl grid-cols-1 gap-5">
      <Field label="Name" htmlFor="name">
        <input id="name" name="name" required maxLength={80} defaultValue={restaurant?.name} autoComplete="off" className={inputClass} />
      </Field>
      <Field label="Menu address" htmlFor="slug" hint="Lowercase and dashes. The menu opens at realityfood…/this-address. Printed QR codes use it, so change it only before printing.">
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground">/</span>
          <input id="slug" name="slug" required maxLength={60} pattern="[a-z0-9]+(-[a-z0-9]+)*" defaultValue={restaurant?.slug} autoComplete="off" spellCheck={false} className={inputClass} placeholder="ironside-cafe…" />
        </div>
      </Field>
      <Field label="Tagline (English)" htmlFor="taglineEn" hint="One short line under the name on the menu.">
        <input id="taglineEn" name="taglineEn" maxLength={140} defaultValue={tagline.en} autoComplete="off" className={inputClass} />
      </Field>
      <Field label="Tagline (Spanish)" htmlFor="taglineEs">
        <input id="taglineEs" name="taglineEs" lang="es" maxLength={140} defaultValue={tagline.es} autoComplete="off" className={inputClass} />
      </Field>
      {restaurant ? (
        <ImageUpload name="logoPath" label="Logo" folder={restaurant.id} base="logo" initialPath={restaurant.logo_path} aspect="square" />
      ) : (
        <p className="text-sm text-muted-foreground">You can add the logo after creating the restaurant.</p>
      )}
      <label className="flex items-center gap-3 text-sm font-bold">
        <input type="checkbox" name="published" defaultChecked={restaurant?.is_published ?? false} className="size-5 accent-(--rf-accent-text)" />
        Live: the menu is public (QR codes work)
      </label>
      <div className="flex flex-wrap items-center gap-4">
        <SubmitButton pending="Saving…" busy={pending}>{restaurant ? "Save changes" : "Create restaurant"}</SubmitButton>
        <FormMessage state={state} />
      </div>
    </form>
  );
}
