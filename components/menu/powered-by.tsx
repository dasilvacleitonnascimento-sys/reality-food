import Link from "next/link";

/** Small "Menu by Reality Food" credit at the bottom of every restaurant menu. */
export function PoweredBy({ label }: { label: string }) {
  return (
    <footer className="mt-12 flex justify-center px-4 pb-10">
      <Link
        href="/"
        className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <svg viewBox="0 0 64 64" className="size-5" aria-hidden>
          <path d="M7 19V12a5 5 0 0 1 5-5h7M45 7h7a5 5 0 0 1 5 5v7M57 45v7a5 5 0 0 1-5 5h-7M19 57h-7a5 5 0 0 1-5-5v-7" fill="none" stroke="#0B7A70" strokeWidth="5" strokeLinecap="round" />
          <ellipse cx="32" cy="32" rx="18" ry="10.5" fill="#E5483A" />
          <ellipse cx="32" cy="28.5" rx="6.5" ry="5.5" fill="#F4B63E" />
        </svg>
        {label}
      </Link>
    </footer>
  );
}
