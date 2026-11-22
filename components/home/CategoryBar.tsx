"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/Icon";

const ITEMS = [
  { id: "tous", label: "Tous les Produits" },
  { id: "sandwiches", label: "Sandwiches & Matlouh", icon: "lunch_dining" },
  { id: "douceurs", label: "Pâtisseries & Douceurs", icon: "bakery_dining" },
  { id: "plats-signatures", label: "Plats de Terroir", icon: "soup_kitchen" },
  { id: "boissons", label: "Cherbet & Boissons", icon: "local_cafe" },
];

/** Sticky anchor pills with scroll-spy (home-page-desktop category bar). */
export function CategoryBar() {
  const [active, setActive] = useState("tous");

  useEffect(() => {
    const sections = ITEMS.slice(1)
      .map((i) => document.getElementById(i.id))
      .filter((el): el is HTMLElement => !!el);
    const onScroll = () => {
      const y = 180; // below header + bar
      let current = "tous";
      for (const s of sections) if (s.getBoundingClientRect().top <= y) current = s.id;
      setActive(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div id="carte" className="sticky top-20 z-40 mt-4 border-b border-outline-variant/30 bg-surface-container-lowest/95 py-3 backdrop-blur-md">
      <nav aria-label="Rubriques de la carte" className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto py-0.5">
          {ITEMS.map((item) => {
            const isActive = active === item.id;
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                aria-current={isActive ? "true" : undefined}
                className={cn(
                  "relative flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-sm transition-colors",
                  isActive ? "font-bold text-white" : "bg-surface-container-low font-semibold text-on-surface-variant hover:bg-surface-container hover:text-primary",
                )}
              >
                {isActive && (
                  <motion.span layoutId="home-cat" className="absolute inset-0 rounded-full bg-primary shadow-sm" transition={{ type: "spring", stiffness: 420, damping: 36 }} />
                )}
                {item.icon && <Icon name={item.icon} size={17} className="relative" />}
                <span className="relative">{item.label}</span>
              </a>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
