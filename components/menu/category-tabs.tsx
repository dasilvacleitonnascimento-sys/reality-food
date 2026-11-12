"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { Category } from "@/lib/demo-data";

export function CategoryTabs({ categories }: { categories: Category[] }) {
  const [activeId, setActiveId] = useState(categories[0]?.id);

  // Highlight the tab of the section currently near the top of the screen.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting);
        if (visible) setActiveId(visible.target.id as Category["id"]);
      },
      { rootMargin: "-64px 0px -70% 0px" },
    );
    for (const category of categories) {
      const section = document.getElementById(category.id);
      if (section) observer.observe(section);
    }
    return () => observer.disconnect();
  }, [categories]);

  function scrollTo(id: Category["id"]) {
    setActiveId(id);
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  }

  return (
    <nav
      aria-label="Menu categories"
      className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur"
    >
      <ul className="flex gap-2 overflow-x-auto px-4 py-2">
        {categories.map((category) => {
          const isActive = category.id === activeId;
          return (
            <li key={category.id} className="shrink-0">
              <button
                type="button"
                onClick={() => scrollTo(category.id)}
                aria-current={isActive ? "true" : undefined}
                className={cn(
                  "h-11 rounded-full px-4 text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  isActive
                    ? "bg-(--brand) text-white"
                    : "bg-muted text-foreground hover:bg-muted/70",
                )}
              >
                {category.name}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
