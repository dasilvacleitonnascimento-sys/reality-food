"use client";

import { useSearchParams } from "next/navigation";
import { parseTableLabel } from "@/lib/format";

export function TableLabel({ label }: { label: string }) {
  const table = parseTableLabel(useSearchParams().get("table"));
  if (!table) return null;

  return (
    <p className="mt-1 text-sm font-medium text-(--brand-text)">
      {label} {table}
    </p>
  );
}
