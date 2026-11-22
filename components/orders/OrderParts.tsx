"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useCallback, useSyncExternalStore } from "react";
import { cn } from "@/lib/cn";
import { getProduct } from "@/lib/data/products";
import { COURIERS } from "@/lib/data/seed";
import { formatDay, formatPrice } from "@/lib/format";
import { addToCart } from "@/lib/store/actions";
import { communeName, getTrackingSnapshot, STATUS_LABEL } from "@/lib/tracking";
import type { Order, OrderStatus } from "@/lib/types";
import { Icon } from "@/components/ui/Icon";
import { toast } from "@/components/ui/Toast";

let clock = 0;
const readClock = () => clock || (clock = Date.now());

/**
 * Current time, refreshed periodically (drives simulated live tracking).
 * External-store based so prerendering never calls Date.now() (server snapshot = 0);
 * consumers only render time-dependent UI after hydration.
 */
export function useNow(intervalMs = 15_000) {
  const subscribe = useCallback(
    (notify: () => void) => {
      const t = setInterval(() => {
        clock = Date.now();
        notify();
      }, intervalMs);
      return () => clearInterval(t);
    },
    [intervalMs],
  );
  return useSyncExternalStore(subscribe, readClock, () => 0);
}

export function isActive(order: Order, now: number) {
  return getTrackingSnapshot(order, now).status !== "livree";
}

export function reorder(order: Order) {
  let added = 0;
  for (const l of order.lines) {
    if (getProduct(l.slug)) {
      addToCart(l.slug, l.quantity);
      added += l.quantity;
    }
  }
  toast({
    title: added ? "Commande ajoutée au panier" : "Plats indisponibles",
    description: added ? `${added} article${added > 1 ? "s" : ""} de ${order.id}` : undefined,
    icon: "sync",
    tone: added ? "success" : "error",
    action: added ? { label: "Panier", href: "/panier" } : undefined,
  });
}

const STATUS_STYLE: Record<OrderStatus, string> = {
  confirmee: "bg-primary-fixed text-on-primary-fixed",
  preparation: "bg-secondary-fixed text-on-secondary-fixed-variant",
  en_route: "bg-tertiary-fixed text-on-tertiary-fixed-variant",
  livree: "bg-surface-container-high text-on-surface-variant",
};
const STATUS_ICON: Record<OrderStatus, string> = { confirmee: "check_circle", preparation: "skillet", en_route: "two_wheeler", livree: "done_all" };

export function StatusPill({ status, className }: { status: OrderStatus; className?: string }) {
  return (
    <span data-testid="order-status" className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", STATUS_STYLE[status], className)}>
      <Icon name={STATUS_ICON[status]} size={13} /> {STATUS_LABEL[status]}
    </span>
  );
}

const summary = (o: Order) => o.lines.map((l) => `${l.quantity}x ${l.name}`).join(" • ");

/** "Commande en Cours" card (orders-desktop) — light variant. */
export function ActiveOrderCard({ order, now }: { order: Order; now: number }) {
  const snap = getTrackingSnapshot(order, now);
  const courier = COURIERS[order.courierId];
  const pct = [8, 35, 68, 100][snap.stepIndex];
  return (
    <div className="rounded-2xl bg-surface-container-lowest p-5 shadow-card md:p-6" data-testid="active-order">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-label-lg text-on-surface">Commande #{order.id}</span>
          <StatusPill status={snap.status} />
        </div>
        <span className="text-headline-sm font-semibold text-primary">{formatPrice(order.total)}</span>
      </div>
      <div className="mb-1.5 flex justify-between text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
        <span>Cuisines d&apos;Hydra</span>
        <span>En route ({communeName(order.address.commune).split(" / ")[0]})</span>
        <span>Dégustation</span>
      </div>
      <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-surface-container-high">
        <motion.div className="h-full rounded-full bg-primary" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }} />
      </div>
      <div className="mb-5 flex items-center justify-between gap-4 rounded-xl bg-surface-container-low p-4">
        <div className="min-w-0">
          <p className="truncate text-label-md text-on-surface">{summary(order)}</p>
          <p className="text-body-sm text-on-surface-variant">Livraison sécurisée avec boîte isotherme d&apos;artisan</p>
        </div>
        {courier && (
          <span className="flex shrink-0 items-center gap-2">
            <span className="grid size-8 place-items-center rounded-full bg-surface-container-high text-primary">
              <Icon name="sports_motorsports" size={16} />
            </span>
            <span className="hidden flex-col sm:flex">
              <span className="text-[11px] font-bold text-on-surface">{courier.name}</span>
              <span className="text-[11px] text-on-surface-variant">Livreur Maison</span>
            </span>
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-body-sm text-on-surface-variant">
          Adresse : {order.address.street}, {communeName(order.address.commune).split(" / ")[0]}
        </span>
        <Link href={`/suivi?id=${order.id}`} className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-label-md font-bold text-on-primary transition-colors hover:bg-primary-container">
          <Icon name="near_me" size={17} /> Suivre en direct
        </Link>
      </div>
    </div>
  );
}

/** Dark "En cours d'acheminement" card (profile-mobile). */
export function ActiveOrderHero({ order, now }: { order: Order; now: number }) {
  const snap = getTrackingSnapshot(order, now);
  const pct = [10, 38, 72, 100][snap.stepIndex];
  return (
    <Link
      href={`/suivi?id=${order.id}`}
      data-testid="active-order"
      className="relative block overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary-container p-5 text-on-primary shadow-float"
    >
      <span aria-hidden className="absolute -bottom-16 -right-10 size-48 rounded-full bg-white/5" />
      <div className="relative flex items-start justify-between gap-3">
        <span className="flex items-center gap-2 text-label-sm uppercase tracking-wider">
          <span className="size-2.5 rounded-full bg-secondary-container" /> {STATUS_LABEL[snap.status]}
        </span>
        <span className="text-right text-label-sm text-primary-fixed">
          Livraison estimée : {snap.remainingMinutes} min
        </span>
      </div>
      <div className="relative mt-3 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-headline-sm font-bold">#{order.id}</p>
          <p className="truncate text-body-sm text-primary-fixed-dim">{order.lines.map((l) => l.name).join(" & ")}</p>
        </div>
        <p className="whitespace-nowrap text-headline-sm font-bold text-secondary-container">{formatPrice(order.total)}</p>
      </div>
      <div className="relative mt-5 h-1.5 overflow-hidden rounded-full bg-white/15">
        <motion.div className="h-full rounded-full bg-secondary-container" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.9 }} />
      </div>
      <div className="relative mt-4 flex items-center justify-between text-body-sm">
        <span className="flex items-center gap-2 text-primary-fixed">
          <Icon name="two_wheeler" size={18} /> Coursier vers {communeName(order.address.commune).split(" / ")[0]}
        </span>
        <span className="flex items-center gap-0.5 font-bold text-secondary-container">
          Suivre en direct <Icon name="chevron_right" size={18} />
        </span>
      </div>
    </Link>
  );
}

export function OrderHistoryRow({ order, now }: { order: Order; now: number }) {
  const snap = getTrackingSnapshot(order, now);
  const first = order.lines[0];
  const isSweet = first && getProduct(first.slug)?.category === "douceurs";
  return (
    <li data-testid="history-order" className="flex flex-col gap-4 rounded-2xl bg-surface-container-lowest p-4 shadow-card sm:flex-row sm:items-center md:p-5">
      <span className="hidden size-12 shrink-0 place-items-center rounded-xl bg-surface-container-low text-primary sm:grid">
        <Icon name={isSweet ? "local_cafe" : "restaurant"} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <span className="text-label-lg font-bold text-on-surface">#{order.id}</span>
          {snap.status === "livree" ? (
            <span className="rounded-full bg-surface-container px-2 py-0.5 text-[10px] font-bold tracking-wide text-on-surface-variant">Livrée le {formatDay(order.createdAt)}</span>
          ) : (
            <StatusPill status={snap.status} />
          )}
        </div>
        <p className="line-clamp-2 text-body-sm text-on-surface-variant">{order.lines.map((l) => (l.quantity > 1 ? `${l.quantity}× ${l.name}` : l.name)).join(" • ")}</p>
        <p className="mt-1 text-label-sm uppercase tracking-wide text-secondary">Règlement espèces (DA) • {formatPrice(order.total)}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Link
          href={`/suivi?id=${order.id}`}
          aria-label={`Détail de la commande ${order.id}`}
          className="flex h-9 items-center gap-1.5 rounded-lg bg-surface-container-low px-3 text-label-md text-primary hover:bg-surface-container"
        >
          <Icon name={snap.status === "livree" ? "description" : "near_me"} size={17} />
          {snap.status === "livree" ? "Détail" : "Suivre"}
        </Link>
        <button
          type="button"
          onClick={() => reorder(order)}
          className="flex h-9 items-center gap-1.5 rounded-lg bg-surface-container-low px-3 text-label-md text-primary hover:bg-surface-container"
        >
          <Icon name="sync" size={17} /> Recommander
        </button>
      </div>
    </li>
  );
}
