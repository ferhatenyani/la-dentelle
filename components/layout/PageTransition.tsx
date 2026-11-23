import { ViewTransition } from "react";
import { cn } from "@/lib/cn";

/**
 * Route-level transition. Wrap each page's content (not a layout: layouts persist, so enter/exit never fire).
 * The browser snapshots old & new pages and runs the push on the compositor *after* React commits,
 * so the animation never competes with route mounting on the main thread. Direction comes from
 * `html[data-nav-dir]` (see NavDirection); keyframes live in globals.css (`.page-in` / `.page-out`).
 * Without View Transitions support the swap is instant, with a light CSS entrance fallback.
 */
export function PageTransition({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <ViewTransition enter="page-in" exit="page-out" default="none">
      <div className={cn("page-shell flex w-full flex-1 flex-col bg-surface", className)}>{children}</div>
    </ViewTransition>
  );
}

/**
 * Same animation one level up, around a route group's <main>. It stays mounted while navigating inside
 * the group (no animation: `default="none"`), and only enters/exits when switching groups, e.g.
 * (shop) ↔ (auth), where React would otherwise skip the nested per-page transitions.
 */
export function GroupTransition({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition enter="page-in" exit="page-out" default="none">
      {children}
    </ViewTransition>
  );
}
