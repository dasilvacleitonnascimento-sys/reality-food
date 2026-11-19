"use client";

export function PrintButton({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex h-11 items-center rounded-xl bg-(--rf-ink) px-5 text-sm font-bold text-(--rf-paper) outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      {children}
    </button>
  );
}
