/** Reality Food mark + wordmark for the admin (dark text on the light panel). */
export function Wordmark({ textClassName = "" }: { textClassName?: string }) {
  return (
    <span className="flex items-center gap-2.5" translate="no">
      <svg viewBox="0 0 64 64" className="size-9" aria-hidden>
        <circle cx="32" cy="32" r="29" fill="var(--rf-accent)" />
        <circle cx="32" cy="32" r="23.6" fill="none" stroke="var(--rf-ink)" strokeWidth="1.5" opacity="0.35" />
        <g fill="none" stroke="var(--rf-ink)" strokeWidth="4.8" strokeLinecap="round" strokeLinejoin="round" transform="translate(-0.6 0)">
          <path d="M17.6 44.5V19.5h8.9a6.45 6.45 0 0 1 0 12.9h-8.9M25.9 32.4l5.4 12.1" />
          <path d="M37.4 44.5V19.5h10.2M37.4 31.6h8.4" />
        </g>
      </svg>
      <span className={`rf-serif text-xl whitespace-nowrap ${textClassName}`}>
        Reality <span className="text-(--rf-accent-text)">Food</span>
      </span>
    </span>
  );
}
