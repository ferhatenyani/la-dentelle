"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { RESTAURANT } from "@/lib/data/catalog";
import { COURIERS } from "@/lib/data/seed";
import { formatPrice, formatTime } from "@/lib/format";
import { useOrder, useSessionUser, useUserOrders } from "@/lib/store/hooks";
import { useHydrated } from "@/lib/store/store";
import { communeArea, communeName, getTrackingSnapshot, STATUS_STEPS, type TrackingSnapshot } from "@/lib/tracking";
import type { Order } from "@/lib/types";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { EmptyState, PageSkeleton } from "@/components/ui/States";
import { toast } from "@/components/ui/Toast";
import { isActive, reorder, useNow } from "@/components/orders/OrderParts";
import { TrackingMap } from "./TrackingMap";

const HEADLINE: Record<TrackingSnapshot["status"], { title: string; sub: string; icon: string }> = {
  confirmee: { title: "Commande confirmée", sub: "Transmise à notre brigade d'Hydra", icon: "check_circle" },
  preparation: { title: "En préparation en cuisine", sub: "Nos maîtres-queux dressent vos plats", icon: "skillet" },
  en_route: { title: "En route vers votre adresse", sub: "Sorti de notre atelier gastronomique", icon: "electric_moped" },
  livree: { title: "Commande livrée", sub: "Bon appétit et merci de votre confiance", icon: "done_all" },
};

function StepTimeline({ snap, order }: { snap: TrackingSnapshot; order: Order }) {
  const courier = COURIERS[order.courierId];
  const sub = [
    snap.stepTimes[0] ? formatTime(snap.stepTimes[0]) : "",
    snap.stepIndex >= 1 ? "Chef Karim B." : "En attente",
    snap.stepIndex >= 2 ? `${courier?.name ?? "Coursier"} en route` : "Bientôt",
    snap.stepIndex >= 3 ? "Bon appétit" : "Bon appétit",
  ];
  return (
    <ol className="relative grid grid-cols-4 gap-2" aria-label="Progression de la commande">
      <span className="absolute left-[12.5%] right-[12.5%] top-6 h-[3px] rounded-full bg-surface-container-high" aria-hidden />
      <motion.span
        className="absolute left-[12.5%] right-[12.5%] top-6 h-[3px] origin-left rounded-full bg-primary"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: snap.stepIndex / 3 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        aria-hidden
      />
      {STATUS_STEPS.map((s, i) => {
        const done = i < snap.stepIndex || snap.status === "livree";
        const current = i === snap.stepIndex && snap.status !== "livree";
        return (
          <li key={s.id} className="relative flex flex-col items-center text-center" aria-current={current ? "step" : undefined} data-testid={`step-${s.id}`} data-state={done ? "done" : current ? "current" : "todo"}>
            <span
              className={cn(
                "relative z-10 grid size-12 place-items-center rounded-full ring-4 ring-surface-container-lowest transition-colors",
                done ? "bg-primary text-on-primary" : current ? "bg-secondary-container text-on-secondary-fixed" : "bg-surface-container text-outline",
              )}
            >
              {current && <span className="absolute inset-0 animate-ping rounded-full bg-secondary-container/40" />}
              <Icon name={done && i === 0 ? "check" : s.icon} size={22} className="relative" />
            </span>
            <span className={cn("mt-3 text-label-md", done ? "text-on-surface" : current ? "text-secondary" : "text-outline")}>{s.label}</span>
            <span className={cn("text-body-sm", current ? "font-bold text-secondary" : "text-on-surface-variant", !done && !current && "text-outline")}>{sub[i]}</span>
          </li>
        );
      })}
    </ol>
  );
}

function CourierCard({ order, compact }: { order: Order; compact?: boolean }) {
  const courier = COURIERS[order.courierId];
  if (!courier) return null;
  return (
    <div className="rounded-3xl bg-surface-container-lowest p-5 shadow-card md:rounded-2xl">
      <div className="flex items-center gap-4 border-b border-outline-variant/20 pb-4">
        <span className="relative size-14 shrink-0 overflow-hidden rounded-xl">
          <Image src={courier.photo} alt={`Photo de ${courier.name}`} fill sizes="56px" className="object-cover object-top" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2 text-headline-sm font-semibold text-on-surface">
            {courier.name}
            <span className="inline-flex items-center gap-0.5 rounded-full bg-secondary-fixed/60 px-2 py-0.5 text-label-md text-on-secondary-fixed-variant">
              <Icon name="star" size={14} fill /> {courier.rating}
            </span>
          </p>
          <p className="truncate text-body-sm text-on-surface-variant">
            <Icon name="electric_moped" size={16} className="align-text-bottom" /> {courier.vehicle} • La Dentelle Express
          </p>
        </div>
        {!compact && <span className="hidden rounded-full bg-primary-fixed/50 px-2.5 py-1 text-label-sm text-on-primary-fixed lg:inline">Certifié</span>}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <a href={`tel:${courier.phone.replace(/[^\d+]/g, "")}`} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-primary text-label-lg text-on-primary hover:bg-primary-container">
          <Icon name="call" size={20} /> Appeler
        </a>
        <button
          type="button"
          onClick={() => toast({ title: `Message envoyé à ${courier.name}`, description: "Il vous répondra dès qu'il sera à l'arrêt.", icon: "chat" })}
          className="flex h-12 items-center justify-center gap-2 rounded-xl bg-surface-container-high text-label-lg text-on-surface hover:bg-surface-container-highest"
        >
          <Icon name="chat" size={20} /> Message
        </button>
      </div>
    </div>
  );
}

function HandoverCode({ order }: { order: Order }) {
  return (
    <div className="flex items-center gap-4 rounded-3xl bg-surface-container p-5 md:rounded-2xl md:bg-surface-container-low">
      <span className="grid size-12 shrink-0 place-items-center rounded-full bg-secondary-container text-on-secondary-fixed">
        <Icon name="key" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-label-sm uppercase tracking-wider text-on-surface-variant">Code de remise sécurisé</p>
        <p className="text-body-sm text-on-surface">À énoncer lors de la remise en main propre</p>
      </div>
      <span className="rounded-xl bg-surface-container-lowest px-4 py-2 text-headline-md font-bold tracking-[0.2em] text-primary shadow-sm" data-testid="handover-code">
        {order.handoverCode}
      </span>
    </div>
  );
}

function OrderRecap({ order }: { order: Order }) {
  const [open, setOpen] = useState(false);
  const count = order.lines.reduce((n, l) => n + l.quantity, 0);
  return (
    <div className="rounded-3xl bg-surface-container-lowest p-5 shadow-card md:rounded-2xl">
      <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-4 text-left">
        <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-surface-container-low text-primary">
          <Icon name="receipt_long" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-label-lg text-on-surface">
            {count} création{count > 1 ? "s" : ""} gourmande{count > 1 ? "s" : ""}
          </span>
          <span className="block text-body-sm text-on-surface-variant">
            Total à régler en espèces : <strong className="text-primary">{formatPrice(order.total)}</strong>
          </span>
        </span>
        <span className="grid size-9 place-items-center rounded-full bg-surface-container-low">
          <Icon name="expand_more" className={cn("transition-transform", open && "rotate-180")} />
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <ul className="mt-4 divide-y divide-outline-variant/20 border-t border-outline-variant/20">
              {order.lines.map((l) => (
                <li key={l.slug} className="flex justify-between gap-3 py-2.5 text-body-sm">
                  <span>
                    <strong className="text-primary">{l.quantity}×</strong> {l.name}
                  </span>
                  <span className="whitespace-nowrap font-semibold">{formatPrice(l.price * l.quantity)}</span>
                </li>
              ))}
              <li className="flex justify-between py-2.5 text-body-sm text-on-surface-variant">
                <span>Livraison</span>
                <span>{order.deliveryFee ? formatPrice(order.deliveryFee) : "Offerte"}</span>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Tracking({ order }: { order: Order }) {
  const now = useNow(10_000);
  const snap = getTrackingSnapshot(order, now);
  const head = HEADLINE[snap.status];
  const destination = order.address.label ?? order.address.building ?? communeName(order.address.commune);
  const courier = COURIERS[order.courierId];
  const commune = communeArea(order.address.commune);
  const fullAddress = [order.address.street, order.address.building, communeName(order.address.commune)].filter(Boolean).join(", ");

  const shareGps = async () => {
    const url = `${window.location.origin}/suivi?id=${order.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "Lien de suivi copié", description: "Partagez-le avec la personne qui réceptionne.", icon: "near_me" });
    } catch {
      toast({ title: "Lien de suivi", description: url, icon: "near_me", tone: "info" });
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1320px] px-4 pb-10 pt-2 xs:px-margin md:px-6 md:py-8">
      {/* ---------- Desktop header card */}
      <div className="mb-8 hidden flex-wrap items-center justify-between gap-6 rounded-2xl bg-surface-container-lowest p-7 shadow-card md:flex">
        <div className="flex items-center gap-5">
          <span className="relative grid size-16 place-items-center rounded-2xl bg-primary text-primary-fixed">
            <Icon name={head.icon} size={30} />
            <span className="absolute -bottom-1 -right-1 size-4 rounded-full bg-secondary ring-2 ring-white" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-surface-container px-3 py-0.5 text-label-md text-on-surface">CMD #{order.id}</span>
              <span className="text-label-sm uppercase tracking-wider text-secondary">Hydra → {commune}</span>
            </div>
            <h1 className="mt-1 text-headline-lg font-bold text-primary" data-testid="tracking-title">
              {head.title}
            </h1>
            <p className="text-body-sm text-on-surface-variant">Destination : {fullAddress}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="rounded-xl border border-outline-variant/30 bg-surface-container-low px-5 py-3">
            <p className="text-label-sm uppercase tracking-wider text-on-surface-variant">{snap.status === "livree" ? "Livrée à" : "Heure estimée"}</p>
            <p className="text-headline-md font-bold text-primary">
              {formatTime(snap.etaTs)} {snap.status !== "livree" && <span className="text-label-md text-secondary">± 5 min</span>}
            </p>
          </div>
          <div className="rounded-xl bg-primary px-5 py-3 text-on-primary">
            <p className="text-label-sm uppercase tracking-wider text-primary-fixed">Délai restant</p>
            <p className="text-headline-md font-bold" data-testid="remaining-minutes">
              {snap.remainingMinutes} <span className="text-label-md font-normal">min</span>
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-5 md:gap-8 lg:grid-cols-12">
        <div className="flex flex-col gap-5 md:gap-8 lg:col-span-8">
          <div className="overflow-hidden rounded-[28px] shadow-card md:rounded-2xl">
            <TrackingMap snap={snap} destinationLabel={destination} courierLabel={`${courier?.name ?? "Coursier"} (${snap.remainingKm} km)`} className="h-[420px] md:h-[440px]">
              {/* Desktop chips */}
              <div className="absolute left-4 right-4 top-4 z-10 hidden items-start justify-between md:flex">
                <span className="flex items-center gap-2 rounded-lg bg-surface-container-lowest px-3 py-2 text-label-md text-on-surface shadow-md">
                  <span className="size-2.5 rounded-full bg-secondary-container" /> Trajet : Hydra → {commune}
                </span>
                <span className="flex items-center gap-2 rounded-lg bg-surface-container-lowest px-3 py-2 text-label-md text-on-surface shadow-md">
                  <Icon name="thermostat" size={18} className="text-secondary" /> Isotherme : 64°C
                </span>
              </div>
              {/* Mobile overlay (order-tracking-mobile) */}
              <div className="absolute left-3 right-3 top-3 z-10 flex items-stretch gap-2 md:hidden">
                <div className="flex flex-1 items-center gap-3 rounded-full bg-surface-container-lowest/95 px-4 py-2.5 shadow-md backdrop-blur">
                  <span className="size-2.5 shrink-0 rounded-full bg-secondary" />
                  <span className="text-label-lg leading-tight text-on-surface">
                    <span data-testid="remaining-minutes-mobile">{snap.remainingMinutes}</span> min
                    <span className="block text-[11px] font-normal text-on-surface-variant">restantes</span>
                  </span>
                  <span className="ml-auto text-right text-[11px] leading-tight text-on-surface-variant">
                    Arrivée estimée
                    <span className="block text-label-lg text-on-surface">{formatTime(snap.etaTs)}</span>
                  </span>
                </div>
                <span className="grid place-items-center rounded-full bg-surface-container-lowest/95 px-3 text-label-md text-secondary shadow-md">#{order.id.replace("LD-", "")}</span>
              </div>
            </TrackingMap>
            <div className="hidden items-center justify-between gap-4 bg-surface-container-low px-6 py-4 md:flex">
              <span className="flex items-center gap-2 text-label-lg text-on-surface">
                <Icon name="navigation" size={20} className="text-primary" /> {order.address.street}
                <span className="font-normal text-on-surface-variant">· Trafic fluide</span>
              </span>
              <span className="text-body-sm text-on-surface-variant">
                Distance restante : <strong className="text-headline-sm text-primary">{snap.remainingKm} km</strong>
              </span>
            </div>
          </div>

          {/* Mobile status card */}
          <div className="rounded-3xl bg-surface-container-lowest p-5 shadow-card md:hidden">
            <div className="flex items-start gap-4">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary-fixed text-primary">
                <Icon name={head.icon} />
              </span>
              <div className="min-w-0 flex-1">
                <h1 className="text-headline-sm font-semibold text-on-surface" data-testid="tracking-title-mobile">
                  {head.title}
                </h1>
                <p className="text-body-sm text-on-surface-variant">{head.sub}</p>
              </div>
            </div>
            <ol className="mt-5 grid grid-cols-4 gap-2" aria-label="Progression de la commande">
              {STATUS_STEPS.map((s, i) => {
                const reached = i <= snap.stepIndex;
                return (
                  <li key={s.id} className="flex flex-col items-center gap-2" data-state={i < snap.stepIndex || snap.status === "livree" ? "done" : i === snap.stepIndex ? "current" : "todo"}>
                    <span className={cn("h-1.5 w-full rounded-full", reached ? (i === snap.stepIndex && snap.status !== "livree" ? "bg-secondary" : "bg-primary") : "bg-surface-container-high")} />
                    <span className={cn("text-[11px] font-bold tracking-wide", reached ? (i === snap.stepIndex && snap.status !== "livree" ? "text-secondary" : "text-on-surface") : "text-outline")}>{s.short}</span>
                  </li>
                );
              })}
            </ol>
          </div>

          {/* Desktop progression */}
          <section aria-label="Progression de la commande" className="hidden rounded-2xl bg-surface-container-lowest p-7 shadow-card md:block">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-headline-sm font-semibold text-primary">Progression de la Commande</h2>
              <span className="rounded-full bg-surface-container-low px-3 py-1 text-label-md text-secondary" data-testid="step-counter">
                Étape {snap.stepIndex + 1} sur 4
              </span>
            </div>
            <StepTimeline snap={snap} order={order} />
          </section>

          <div className="md:hidden">
            <HandoverCode order={order} />
          </div>
          <div className="md:hidden">
            <CourierCard order={order} compact />
          </div>
          <div className="md:hidden">
            <OrderRecap order={order} />
          </div>
        </div>

        <aside className="hidden flex-col gap-5 md:flex lg:col-span-4">
          <CourierCard order={order} />
          <HandoverCode order={order} />
          <OrderRecap order={order} />
        </aside>
      </div>

      <div className="mt-5 flex flex-col gap-4 rounded-3xl bg-surface-container-lowest p-5 shadow-card sm:flex-row sm:items-center sm:justify-between md:mt-8 md:rounded-2xl">
        <p className="flex items-center gap-3 text-body-sm text-on-surface-variant">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-surface-container-low text-primary">
            <Icon name="notifications_active" />
          </span>
          Notification SMS active : appel discret du livreur 2 min avant l&apos;arrivée.
        </p>
        <div className="flex shrink-0 gap-2">
          {snap.status === "livree" ? (
            <button type="button" onClick={() => reorder(order)} className="flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-label-lg text-on-primary hover:bg-primary-container">
              <Icon name="sync" size={18} /> Recommander
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => toast({ title: "Instructions transmises", description: order.address.instructions || "Aucune instruction particulière.", icon: "info", tone: "info" })}
                className="h-11 rounded-xl bg-surface-container-low px-4 text-label-lg text-on-surface hover:bg-surface-container"
              >
                Instructions
              </button>
              <button type="button" onClick={shareGps} className="h-11 rounded-xl bg-primary px-4 text-label-lg text-on-primary hover:bg-primary-container">
                Partager accès GPS
              </button>
            </>
          )}
        </div>
      </div>
      <a href={`tel:${RESTAURANT.concierge.replace(/[^\d+]/g, "")}`} className="mt-4 flex items-center gap-3 rounded-3xl bg-surface-container p-4 md:hidden">
        <Icon name="room_service" className="text-primary" />
        <span className="flex-1 text-body-sm">
          <strong className="block text-label-lg text-on-surface">Conciergerie La Dentelle</strong>
          {RESTAURANT.concierge} • Service dédié
        </span>
        <Icon name="chevron_right" className="text-outline" />
      </a>
    </div>
  );
}

export function TrackingView() {
  const id = useSearchParams().get("id");
  const hydrated = useHydrated();
  const user = useSessionUser();
  const userOrders = useUserOrders();
  const byId = useOrder(id);
  const now = useNow(60_000);

  if (!hydrated) return <PageSkeleton />;
  const order = byId ?? (id ? null : (userOrders.find((o) => isActive(o, now)) ?? userOrders[0] ?? null));

  if (!order) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10">
        <EmptyState
          icon="near_me"
          title={id ? "Commande introuvable" : "Aucune commande à suivre"}
          description={user ? "Vos commandes en cours apparaîtront ici en temps réel." : "Connectez-vous pour suivre vos commandes en direct."}
          action={user ? <ButtonLink href="/menu" icon="restaurant_menu">Commander</ButtonLink> : <ButtonLink href="/connexion?next=/suivi" icon="login">Se connecter</ButtonLink>}
        />
        {user && userOrders.length > 0 && (
          <p className="mt-4 text-center">
            <Link href="/compte/commandes" className="text-label-lg text-primary hover:underline">
              Voir mon historique
            </Link>
          </p>
        )}
      </div>
    );
  }
  return <Tracking key={order.id} order={order} />;
}
