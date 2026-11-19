"use client";

// Picks a photo, shrinks it in the browser (max 1600 px JPEG, so menus stay fast
// on restaurant Wi-Fi), uploads it straight to Supabase Storage with the admin's
// session, and puts the stored path in a hidden input for the form to save.

import Image from "next/image";
import { useId, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { mediaUrl } from "@/lib/supabase/public";

const MAX_SIDE = 1600;

async function shrink(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Couldn't read that image."))), "image/jpeg", 0.85));
}

type Props = {
  /** Hidden input name the form reads. */
  name: string;
  label: string;
  /** Storage folder: the restaurant's id. */
  folder: string;
  /** File name base, e.g. the dish slug or "logo". */
  base: string;
  initialPath: string | null;
  aspect?: "square" | "photo";
};

export function ImageUpload({ name, label, folder, base, initialPath, aspect = "photo" }: Props) {
  const id = useId();
  const [path, setPath] = useState(initialPath ?? "");
  const [status, setStatus] = useState<{ busy?: boolean; error?: string }>({});

  async function onPick(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return setStatus({ error: "Pick a photo (JPEG, PNG or WebP)." });
    setStatus({ busy: true });
    try {
      const blob = await shrink(file);
      const target = `${folder}/${base}.${crypto.randomUUID().slice(0, 8)}.jpg`;
      const { error } = await supabaseBrowser().storage.from("dish-media").upload(target, blob, { contentType: "image/jpeg", cacheControl: "31536000" });
      if (error) throw new Error(error.message);
      setPath(target);
      setStatus({});
    } catch (e) {
      setStatus({ error: `Upload failed: ${e instanceof Error ? e.message : "unknown error"}. Check the connection and try again.` });
    }
  }

  const url = mediaUrl(path);
  return (
    <div className="grid gap-2">
      <label htmlFor={id} className="text-sm font-bold">
        {label}
      </label>
      <div className="flex items-center gap-4">
        <div className={`relative shrink-0 overflow-hidden rounded-xl bg-muted ${aspect === "square" ? "size-20 rounded-full" : "aspect-[4/3] w-32"}`}>
          {url && <Image src={url} alt="" fill sizes="128px" className="object-cover" />}
        </div>
        <div className="grid min-w-0 gap-1">
          <input
            id={id}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => onPick(e.target.files?.[0])}
            className="w-full min-w-0 text-sm file:mr-3 file:h-10 file:rounded-lg file:border-0 file:bg-muted file:px-3 file:text-sm file:font-bold"
          />
          <p aria-live="polite" className={`text-xs ${status.error ? "text-destructive" : "text-muted-foreground"}`}>
            {status.busy ? "Uploading…" : (status.error ?? (url ? "Saved when you press Save." : "No photo yet."))}
          </p>
        </div>
      </div>
      <input type="hidden" name={name} value={path} />
    </div>
  );
}
