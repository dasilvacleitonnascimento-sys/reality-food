"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Box } from "lucide-react";

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
      className={`fixed inset-x-0 bottom-0 z-40 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] transition-transform duration-500 ease-out md:hidden ${
        shown ? "translate-y-0" : "translate-y-[120%]"
      }`}
      style={{ background: "linear-gradient(to top, var(--background) 55%, transparent)" }}
      aria-hidden={!shown}
    >
      <Link
        href={href}
        tabIndex={shown ? undefined : -1}
        className="group flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-(--rf-accent) text-base font-bold text-(--rf-ink) shadow-[0_10px_30px_-8px_var(--rf-accent)] outline-none focus-visible:ring-4 focus-visible:ring-(--rf-accent)/50"
      >
        <Box className="size-5" aria-hidden />
        {label}
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
      </Link>
    </div>
  );
}
