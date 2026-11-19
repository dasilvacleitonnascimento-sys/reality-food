"use client";

import { useState } from "react";
import type { FormState } from "@/lib/admin/session-actions";
import type { CategoryRow, DishRow, Vessel } from "@/lib/supabase/database.types";
import { Field, FormMessage, SubmitButton, inputClass, useAdminForm } from "./form";
import { ImageUpload } from "./image-upload";

const VESSELS: { value: Vessel; label: string }[] = [
  { value: "plate", label: "Plate" },
  { value: "bowl", label: "Bowl" },
  { value: "cup", label: "Cup" },
  { value: "glass", label: "Glass" },
  { value: "pan", label: "Pan or skillet" },
];

type Props = {
  action: (state: FormState, form: FormData) => Promise<FormState>;
  restaurantId: string;
  categories: CategoryRow[];
  dish?: DishRow;
  /** Category picked by default for a new dish. */
  defaultCategoryId?: string;
};

export function DishForm({ action, restaurantId, categories, dish, defaultCategoryId }: Props) {
  const { state, pending, formProps } = useAdminForm(action);
  const [servedIn, setServedIn] = useState<Vessel>(dish?.served_in ?? "plate");
  const description = (dish?.description ?? {}) as { en?: string; es?: string };
  const hasOz = servedIn === "cup" || servedIn === "glass";

  return (
    <form {...formProps} className="grid max-w-xl grid-cols-1 gap-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Name (English)" htmlFor="nameEn">
          <input id="nameEn" name="nameEn" required maxLength={80} defaultValue={dish?.name.en} autoComplete="off" className={inputClass} />
        </Field>
        <Field label="Name (Spanish)" htmlFor="nameEs">
          <input id="nameEs" name="nameEs" lang="es" maxLength={80} defaultValue={dish?.name.es} autoComplete="off" className={inputClass} />
        </Field>
      </div>

      <Field label="Description (English)" htmlFor="descriptionEn" hint="One or two short sentences: what's in it.">
        <textarea id="descriptionEn" name="descriptionEn" maxLength={400} rows={3} defaultValue={description.en} className={`${inputClass} h-auto py-2`} />
      </Field>
      <Field label="Description (Spanish)" htmlFor="descriptionEs">
        <textarea id="descriptionEs" name="descriptionEs" lang="es" maxLength={400} rows={3} defaultValue={description.es} className={`${inputClass} h-auto py-2`} />
      </Field>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Price (USD)" htmlFor="price">
          <input
            id="price"
            name="price"
            required
            inputMode="decimal"
            pattern="[0-9]+(\.[0-9]{1,2})?"
            title="Numbers only, like 12 or 12.50"
            defaultValue={dish ? (dish.price_cents / 100).toFixed(2) : ""}
            placeholder="12.50"
            autoComplete="off"
            className={`${inputClass} tabular-nums`}
          />
        </Field>
        <Field label="Category" htmlFor="categoryId">
          <select id="categoryId" name="categoryId" defaultValue={dish ? (dish.category_id ?? "") : (defaultCategoryId ?? categories[0]?.id ?? "")} className={inputClass}>
            <option value="">No category (hidden)</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name.en}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <Field label="Served in" htmlFor="servedIn">
          <select id="servedIn" name="servedIn" value={servedIn} onChange={(e) => setServedIn(e.target.value as Vessel)} className={inputClass}>
            {VESSELS.map((v) => (
              <option key={v.value} value={v.value}>
                {v.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Diameter (cm)" htmlFor="plateCm" hint="Measured with a ruler. Sets the true size in AR.">
          <input id="plateCm" name="plateCm" required inputMode="decimal" defaultValue={dish?.plate_diameter_cm ?? 27} autoComplete="off" className={`${inputClass} tabular-nums`} />
        </Field>
        {hasOz && (
          <Field label="Size (oz)" htmlFor="servedInOz">
            <input id="servedInOz" name="servedInOz" inputMode="decimal" defaultValue={dish?.served_in_oz ?? ""} placeholder="12" autoComplete="off" className={`${inputClass} tabular-nums`} />
          </Field>
        )}
      </div>

      <Field label="Tags" htmlFor="tags" hint="Comma separated, like: vegetarian, spicy, gluten-free.">
        <input id="tags" name="tags" maxLength={200} defaultValue={dish?.tags.join(", ")} autoComplete="off" className={inputClass} />
      </Field>

      <ImageUpload name="photoPath" label="Menu photo" folder={restaurantId} base={dish?.slug ?? "dish"} initialPath={dish?.photo_path ?? null} />

      <label className="flex items-center gap-3 text-sm font-bold">
        <input type="checkbox" name="available" defaultChecked={dish?.is_available ?? true} className="size-5 accent-(--rf-accent-text)" />
        Available (uncheck to show it as sold out)
      </label>

      <div className="flex flex-wrap items-center gap-4">
        <SubmitButton pending="Saving…" busy={pending}>{dish ? "Save changes" : "Add dish"}</SubmitButton>
        <FormMessage state={state} />
      </div>
    </form>
  );
}
