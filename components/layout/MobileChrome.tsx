"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/cn";
import { formatPrice } from "@/lib/format";
import { useCart, useSessionUser } from "@/lib/store/hooks";
import { Icon } from "@/components/ui/Icon";
import { toast } from "@/components/ui/Toast";
import { MOBILE_NAV, mobileRoute } from "./nav";

/** Mobile top app bar (home-page-mobile header), with back button on sub-pages. */
export function MobileTopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useSessionUser();
  const route = mobileRoute(pathname);

  return (
    <header className="pt-safe sticky top-0 z-50 w-full bg-surface/85 shadow-[0_1px_8px_rgba(0,0,0,0.04)] backdrop-blur-xl md:hidden">
      <div className="flex h-[72px] items-center justify-between gap-2 px-4 xs:px-margin">
        <div className="flex min-w-0 items-center gap-2">
          {route.back && (
            <button
              type="button"
              aria-label="Retour"
              onClick={() => (window.history.length > 1 ? router.back() : router.push(route.back!))}
              className="-ml-2 grid size-11 shrink-0 place-items-center rounded-full text-on-surface hover:bg-surface-container"
            >
              <Icon name="arrow_back_ios_new" size={20} />
            </button>
          )}
          <Link href="/" aria-label="La Dentelle — Accueil" className="shrink-0">
            <Image src="/images/logo.jpg" alt="" width={36} height={36} className="size-9 rounded-full object-cover shadow-sm" />
          </Link>
          <div className="flex min-w-0 flex-col">
            <span className="text-label-sm uppercase tracking-widest text-secondary">La Dentelle</span>
            <span className="truncate text-headline-sm font-semibold tracking-tight text-primary" data-testid="mobile-title">
              {route.title}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            aria-label="Notifications"
            onClick={() => toast({ title: "Aucune nouvelle notification", description: "Vous serez alerté à chaque étape de livraison.", tone: "info" })}
            className="grid size-11 place-items-center rounded-full text-on-surface-variant hover:bg-surface-container"
          >
            <Icon name="notifications" />
          </button>
          <Link
            href={user ? "/compte" : "/connexion"}
            aria-label={user ? "Mon profil" : "Se connecter"}
            className="ml-1 grid size-9 place-items-center rounded-full bg-primary text-[13px] font-bold text-on-primary shadow-sm"
          >
            {user ? `${user.firstName[0]}${user.lastName[0] ?? ""}` : <Icon name="person" size={18} />}
          </Link>
        </div>
      </div>
    </header>
  );
}

/** Floating pill tab bar (home-page-mobile nav). */
export function BottomNav() {
  const pathname = usePathname();
  const route = mobileRoute(pathname);
  if (route.hideTabBar) return null;
  return (
    <nav aria-label="Navigation mobile" className="pb-safe pointer-events-none fixed inset-x-0 bottom-0 z-50 md:hidden">
      <div className="flex items-center justify-center px-margin pb-4">
        <div className="pointer-events-auto flex h-16 w-full max-w-sm items-center justify-around rounded-full bg-surface-container-lowest/90 px-2 shadow-float backdrop-blur-xl">
          {MOBILE_NAV.map((item) => {
            const active = item.match(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative grid size-12 place-items-center rounded-full transition-colors",
                  active ? "text-on-primary" : "text-on-surface-variant hover:text-primary",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="tab-active"
                    className="absolute inset-0 rounded-full bg-primary shadow-md shadow-primary/20"
                    transition={{ type: "spring", stiffness: 500, damping: 36 }}
                  />
                )}
                <Icon name={item.icon} fill={active} className="relative" />
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

/** Floating "Votre commande" pill (all-products-mobile), above the tab bar. */
export function MobileCartPill() {
  const pathname = usePathname();
  const { count, total } = useCart();
  const visible = mobileRoute(pathname).cartPill && count > 0;
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 30, opacity: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
          className="pointer-events-none fixed inset-x-0 bottom-[92px] z-40 flex justify-center px-margin md:hidden"
        >
          <Link
            href="/panier"
            data-testid="mobile-cart-pill"
            className="pointer-events-auto flex w-full max-w-sm items-center justify-between rounded-full bg-primary py-2.5 pl-3 pr-2.5 text-on-primary shadow-[0_12px_32px_-4px_rgba(0,68,61,0.35)] transition-transform active:scale-[0.98]"
          >
            <span className="flex items-center gap-3">
              <span className="grid size-8 place-items-center rounded-full bg-secondary text-label-md font-bold text-on-secondary shadow-sm">
                {count}
              </span>
              <span className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-secondary-fixed">Votre commande</span>
                <span className="text-[14px] font-bold">{formatPrice(total)}</span>
              </span>
            </span>
            <span className="flex items-center gap-1 rounded-full bg-secondary-container px-4 py-1.5 text-label-md font-bold text-on-secondary-fixed">
              Panier <Icon name="arrow_forward" size={16} />
            </span>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
