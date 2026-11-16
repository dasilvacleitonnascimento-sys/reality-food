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
          <circle cx="32" cy="32" r="29" fill="var(--rf-accent)" />
          <g fill="none" stroke="var(--rf-ink)" strokeWidth="5.4" strokeLinecap="round" strokeLinejoin="round" transform="translate(-0.6 0)">
            <path d="M17.6 44.5V19.5h8.9a6.45 6.45 0 0 1 0 12.9h-8.9M25.9 32.4l5.4 12.1" />
            <path d="M37.4 44.5V19.5h10.2M37.4 31.6h8.4" />
          </g>
        </svg>
        {label}
      </Link>
    </footer>
  );
}
