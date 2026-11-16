"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { Category } from "@/lib/demo-data";

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function CategoryTabs({ categories, label }: { categories: Category[]; label: string }) {
  const [activeId, setActiveId] = useState(categories[0]?.id);
  const listRef = useRef<HTMLUListElement>(null);

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

  // Keep the active tab in view on narrow phones. Scrolls only the tab row,
  // so it never interrupts the page's own scrolling.
  useEffect(() => {
    const list = listRef.current;
    const tab = list?.querySelector<HTMLElement>(`[data-id="${activeId}"]`);
    if (!list || !tab) return;
    const left = tab.offsetLeft - (list.clientWidth - tab.offsetWidth) / 2;
    list.scrollTo({ left, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }, [activeId]);

  function scrollTo(id: Category["id"]) {
    setActiveId(id);
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }

  return (
    <nav
      aria-label={label}
      className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur"
    >
      <ul ref={listRef} className="flex gap-2 overflow-x-auto overscroll-x-contain px-4 py-2 [scrollbar-width:none]">
        {categories.map((category) => {
          const isActive = category.id === activeId;
          return (
            <li key={category.id} className="shrink-0">
              <button
                type="button"
                data-id={category.id}
                onClick={() => scrollTo(category.id)}
                aria-current={isActive ? "true" : undefined}
                className={cn(
                  "h-11 rounded-full px-4 text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  isActive
                    ? "bg-(--brand) text-(--brand-foreground)"
                    : "bg-muted text-foreground hover:bg-secondary/70",
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
