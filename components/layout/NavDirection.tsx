"use client";

import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef } from "react";

/**
 * Spatial order of the app, used to decide whether a navigation moves "forward" (content slides in
 * from the right) or "back" (from the left). Deeper = later. Mirrors the mobile tab order
 * (Accueil → Carte → Favoris → Profil) and the purchase funnel (Carte → Plat → Panier → Commande).
 */
const ORDER: [RegExp, number][] = [
  [/^\/$/, 0],
  [/^\/menu$/, 10],
  [/^\/menu\/.+/, 11],
  [/^\/panier/, 20],
  [/^\/commande\/confirmation/, 22],
  [/^\/commande/, 21],
  [/^\/favoris/, 30],
  [/^\/compte\/.+/, 41],
  [/^\/compte/, 40],
  [/^\/suivi/, 42],
  [/^\/connexion/, 50],
];

const rank = (path: string) => ORDER.find(([re]) => re.test(path))?.[1] ?? 5;

export function navDirection(from: string, to: string): "forward" | "back" {
  // Signing in lands on the destination: always reads as progress.
  if (from.startsWith("/connexion")) return "forward";
  return rank(to) >= rank(from) ? "forward" : "back";
}

const commitWaiters = new Set<() => void>();
let inAppNavigations = 0;

/** True once the user has moved between pages of the app in this tab (history.back() stays on site). */
export const canGoBackInApp = () => inAppNavigations > 0;

/**
 * Tags <html data-nav-dir> on every pathname change, whatever triggered it (Link, router.push,
 * browser back/forward). Layout effects run inside React's view-transition update callback, i.e.
 * before the ::view-transition pseudo-elements are styled, so the CSS picks up the right direction.
 */
export function NavDirection() {
  const pathname = usePathname();
  const last = useRef(pathname);
  useLayoutEffect(() => {
    if (last.current === pathname) return;
    document.documentElement.dataset.navDir = navDirection(last.current, pathname);
    last.current = pathname;
    inAppNavigations++;
    commitWaiters.forEach((fn) => fn());
    commitWaiters.clear();
  }, [pathname]);
  return null;
}

const visibleShell = () => [...document.querySelectorAll<HTMLElement>(".page-shell")].find((el) => el.checkVisibility());

/**
 * History back with the same "back" push as in-app links. Browser back (popstate) is flushed
 * synchronously by React, so no <ViewTransition> runs; native swipe-back gestures already animate,
 * but our on-screen "Retour" button should feel like the rest of the app.
 */
export function backWithTransition(back: () => void) {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const old = visibleShell();
  if (!document.startViewTransition || reduce || !old) return back();
  const tag = (el: HTMLElement | undefined, name: string, cls: string) => {
    if (!el) return;
    el.style.viewTransitionName = name;
    el.style.viewTransitionClass = cls;
  };
  tag(old, "page-back-old", "page-out");
  document.documentElement.dataset.navDir = "back";
  let next: HTMLElement | undefined;
  const t = document.startViewTransition(
    () =>
      new Promise<void>((resolve) => {
        tag(old, "", "");
        const done = () => {
          clearTimeout(timer);
          next = visibleShell();
          if (next !== old) tag(next, "page-back-new", "page-in");
          resolve();
        };
        // Resolve when the new route commits; cap the wait so a slow route never freezes the screen.
        const timer = setTimeout(() => {
          commitWaiters.delete(done);
          done();
        }, 600);
        commitWaiters.add(done);
        back();
      }),
  );
  t.finished.finally(() => tag(next, "", ""));
}
