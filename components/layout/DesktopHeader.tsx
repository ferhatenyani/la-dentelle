"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { useOnHide } from "@/lib/use-on-hide";
import { cn } from "@/lib/cn";
import { formatPrice } from "@/lib/format";
import { useCart, useSessionUser } from "@/lib/store/hooks";
import { Icon } from "@/components/ui/Icon";
import { DESKTOP_NAV, loginHref, navHref } from "./nav";

export function BrandMark({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <Link href="/" className={cn("group flex shrink-0 items-center gap-3", className)} aria-label="La Dentelle — Accueil">
      <span className="grid size-10 place-items-center rounded-xl bg-primary text-primary-fixed shadow-sm transition-transform group-hover:scale-105">
        <Icon name="restaurant" size={24} />
      </span>
      <span className="flex flex-col">
        <span className="text-headline-sm font-bold uppercase leading-none tracking-tight text-primary">La Dentelle</span>
        {!compact && (
          <span className="mt-1 text-label-sm uppercase tracking-[0.14em] text-secondary">Gastronomie Algérienne</span>
        )}
      </span>
    </Link>
  );
}

export function DesktopHeader() {
  const pathname = usePathname();
  const { count, total } = useCart();
  const user = useSessionUser();
  const [menuOpen, setMenuOpen] = useState(false);
  useOnHide(() => setMenuOpen(false));

  return (
    <header style={{ viewTransitionName: "site-header" }} className="sticky top-0 z-50 hidden w-full bg-surface/90 shadow-header backdrop-blur-xl md:block">
      <div className="mx-auto flex h-20 max-w-[1320px] items-center justify-between gap-6 px-6">
        <BrandMark />
        <nav aria-label="Navigation principale" className="hidden items-center gap-5 lg:flex xl:gap-7">
          {DESKTOP_NAV.map((item) => {
            const active = item.match(pathname);
            return (
              <Link
                key={item.href}
                href={navHref(item.href, !!user)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative whitespace-nowrap py-1.5 text-label-lg tracking-normal transition-colors",
                  active ? "font-bold text-primary" : "text-on-surface-variant hover:text-primary",
                )}
              >
                {item.label}
                {active && (
                  <motion.span
                    layoutId="nav-underline"
                    className="absolute inset-x-0 -bottom-0.5 h-0.5 rounded-full bg-primary-container"
                  />
                )}
              </Link>
            );
          })}
        </nav>
        <div className="flex shrink-0 items-center gap-3">
          {/* Tablet (md–lg): nav links collapse into a sheet */}
          <button
            type="button"
            aria-label="Ouvrir le menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
            className="grid size-9 place-items-center rounded-full border border-outline-variant/30 bg-surface-container-lowest text-on-surface-variant shadow-sm hover:text-primary lg:hidden"
          >
            <Icon name="restaurant_menu" size={19} />
          </button>
          <Link
            href="/menu#recherche"
            aria-label="Rechercher un plat"
            className="grid size-9 place-items-center rounded-full border border-outline-variant/30 bg-surface-container-lowest text-on-surface-variant shadow-sm transition hover:border-primary/30 hover:text-primary"
          >
            <Icon name="search" size={19} />
          </Link>
          <div className="hidden items-center gap-2 rounded-full border border-outline-variant/30 bg-surface-container-low px-3.5 py-1.5 2xl:flex">
            <span className="size-2 animate-pulse rounded-full bg-primary-container" />
            <span className="text-label-md font-medium text-on-surface-variant">Livraison Alger &amp; Environs</span>
          </div>
          <Link
            href="/panier"
            data-testid="header-cart"
            className="flex items-center gap-2.5 rounded-full border border-outline-variant/40 bg-surface-container-lowest px-4 py-2 shadow-sm transition hover:border-primary hover:bg-surface-container-low"
          >
            <span className="relative">
              <Icon name="shopping_bag" size={20} className="text-primary" />
              {count > 0 && (
                <motion.span
                  key={count}
                  initial={{ scale: 0.4 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 18 }}
                  className="absolute -right-2 -top-1.5 grid size-4 place-items-center rounded-full bg-secondary-container text-[10px] font-extrabold text-on-secondary-fixed"
                >
                  {count}
                </motion.span>
              )}
            </span>
            <span className="whitespace-nowrap text-label-md font-bold text-primary lg:sr-only xl:not-sr-only" data-testid="header-cart-label">
              {count === 0 ? "Panier" : `${count} article${count > 1 ? "s" : ""} · ${formatPrice(total)}`}
            </span>
          </Link>
          <Link
            href={user ? "/compte" : loginHref(pathname)}
            aria-label={user ? `Espace de ${user.firstName}` : "Se connecter"}
            data-testid="header-account"
            className="grid size-9 place-items-center rounded-full bg-primary text-[13px] font-bold text-on-primary shadow-sm transition-colors hover:bg-primary-container"
          >
            {user ? `${user.firstName[0]}${user.lastName[0] ?? ""}` : <Icon name="person" size={18} />}
          </Link>
        </div>
      </div>
      <Sheet open={menuOpen} onClose={() => setMenuOpen(false)} title="Navigation">
        <nav aria-label="Navigation tablette" className="flex flex-col gap-1 pb-4">
          {[...DESKTOP_NAV, { href: "/favoris", label: "Mes Favoris", match: (p: string) => p.startsWith("/favoris") }].map((item) => (
            <Link
              key={item.href}
              href={navHref(item.href, !!user)}
              onClick={() => setMenuOpen(false)}
              aria-current={item.match(pathname) ? "page" : undefined}
              className={cn(
                "flex items-center justify-between rounded-xl px-4 py-3.5 text-label-lg transition-colors",
                item.match(pathname) ? "bg-primary text-on-primary" : "text-on-surface hover:bg-surface-container-low",
              )}
            >
              {item.label}
              <Icon name="chevron_right" size={20} />
            </Link>
          ))}
        </nav>
      </Sheet>
    </header>
  );
}
