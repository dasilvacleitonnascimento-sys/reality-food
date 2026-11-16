"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Box } from "lucide-react";

/** Phone-only "See the menu in 3D" bar that slides up once the guest scrolls past the top. */
export function StickyMenuButton({ href, label }: { href: string; label: string }) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const onScroll = () => setShown(window.scrollY > window.innerHeight * 0.6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] transition-transform duration-500 ease-out motion-reduce:transition-none md:hidden ${
        shown ? "translate-y-0" : "translate-y-[120%]"
      }`}
      style={{ background: "linear-gradient(to top, var(--background) 55%, transparent)" }}
      // Hidden bar: out of the tab order and screen readers until it slides in.
      inert={!shown}
    >
      <Link
        href={href}
        className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-(--rf-accent) text-base font-bold text-(--rf-ink) outline-none active:brightness-95 focus-visible:ring-4 focus-visible:ring-(--rf-accent)/50"
      >
        <Box className="size-5" aria-hidden />
        {label}
      </Link>
    </div>
  );
}
