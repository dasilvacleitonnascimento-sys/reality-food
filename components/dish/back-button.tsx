"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export function BackButton({ fallbackHref }: { fallbackHref: string }) {
  const router = useRouter();

  function goBack() {
    // Going back keeps the ?table= the guest arrived with.
    if (window.history.length > 1) router.back();
    else router.push(fallbackHref);
  }

  return (
    <button
      type="button"
      onClick={goBack}
      className="inline-flex h-11 items-center gap-2 rounded-full px-3 text-sm font-medium outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <ArrowLeft className="size-4" aria-hidden />
      Menu
    </button>
  );
}
