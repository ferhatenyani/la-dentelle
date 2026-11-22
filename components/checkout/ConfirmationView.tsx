"use client";

import { useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { formatPhone, formatPrice, formatTime } from "@/lib/format";
import { useOrder, useSessionUser } from "@/lib/store/hooks";
import { useHydrated } from "@/lib/store/store";
import { communeName, getTrackingSnapshot } from "@/lib/tracking";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { EmptyState, PageSkeleton } from "@/components/ui/States";

const CHANGE_LABEL = { exact: "Appoint exact", "2000": "Billets de 2 000 DA", "1000": "Billets de 1 000 DA", "5000": "Billets de 5 000 DA" } as const;

export function ConfirmationView() {
  const id = useSearchParams().get("id");
  const hydrated = useHydrated();
  const order = useOrder(id);
  const user = useSessionUser();

  if (!hydrated) return <PageSkeleton />;
  if (!order) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10">
        <EmptyState icon="receipt_long" title="Commande introuvable" description="Ce numéro de commande n'existe pas sur cet appareil." action={<ButtonLink href="/menu">Retour à la carte</ButtonLink>} />
      </div>
    );
  }

  const snap = getTrackingSnapshot(order, order.createdAt);
  const count = order.lines.reduce((n, l) => n + l.quantity, 0);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-16 pt-6 xs:px-margin md:py-14">
      <div className="flex flex-col items-center text-center">
        <motion.span
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 16 }}
          className="relative mb-5 grid size-20 place-items-center rounded-full bg-primary text-secondary-container shadow-float"
        >
          <motion.span
            className="absolute inset-0 rounded-full border-2 border-primary-container"
            initial={{ scale: 1, opacity: 0.8 }}
            animate={{ scale: 1.6, opacity: 0 }}
            transition={{ duration: 1.4, repeat: 2, ease: "easeOut" }}
          />
          <Icon name="check" size={44} />
        </motion.span>
        <span className="text-label-sm uppercase tracking-widest text-secondary">Commande confirmée</span>
        <h1 className="mt-1 text-headline-lg-mobile text-primary md:text-headline-lg">Merci{user ? ` ${user.firstName}` : ""}, c&apos;est en cuisine !</h1>
        <p className="mt-2 max-w-md text-body-md text-on-surface-variant">
          Votre commande <strong className="text-primary" data-testid="order-id">{order.id}</strong> a été transmise à notre brigade d&apos;Hydra. Livraison estimée vers{" "}
          <strong className="text-primary">{formatTime(snap.etaTs)}</strong>.
        </p>
      </div>

      <div className="mt-8 overflow-hidden rounded-3xl bg-surface-container-lowest shadow-card">
        <div className="grid gap-px bg-outline-variant/30 sm:grid-cols-3">
          {[
            { icon: "schedule", label: "Arrivée estimée", value: formatTime(snap.etaTs) },
            { icon: "payments", label: "À régler en espèces", value: formatPrice(order.total) },
            { icon: "key", label: "Code de remise", value: order.handoverCode },
          ].map((c) => (
            <div key={c.label} className="flex items-center gap-3 bg-surface-container-lowest p-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-surface-container text-primary">
                <Icon name={c.icon} size={20} />
              </span>
              <span className="flex flex-col">
                <span className="text-label-sm uppercase tracking-wider text-on-surface-variant">{c.label}</span>
                <span className="text-headline-sm font-bold text-primary">{c.value}</span>
              </span>
            </div>
          ))}
        </div>
        <div className="space-y-4 p-5 md:p-6">
          <ul className="divide-y divide-outline-variant/20">
            {order.lines.map((l) => (
              <li key={l.slug} className="flex items-center justify-between gap-3 py-2.5 text-body-md">
                <span className="text-on-surface">
                  <span className="font-bold text-primary">{l.quantity}×</span> {l.name}
                </span>
                <span className="whitespace-nowrap font-semibold text-on-surface">{formatPrice(l.price * l.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="space-y-1.5 border-t border-outline-variant/30 pt-4 text-body-md">
            <div className="flex justify-between text-on-surface-variant">
              <span>Sous-total ({count} articles)</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-on-surface-variant">
              <span>Livraison</span>
              <span>{order.deliveryFee ? formatPrice(order.deliveryFee) : "Offerte"}</span>
            </div>
            <div className="flex justify-between text-headline-sm font-bold text-primary">
              <span>Total</span>
              <span data-testid="confirmation-total">{formatPrice(order.total)}</span>
            </div>
          </div>
          <div className="grid gap-3 rounded-2xl bg-surface-container-low p-4 text-body-sm text-on-surface-variant sm:grid-cols-2">
            <p className="flex items-start gap-2">
              <Icon name="location_on" size={18} className="text-primary" />
              <span>
                <strong className="block text-on-surface">{order.contact.fullName}</strong>
                {order.address.building && <>{order.address.building}, </>}
                {order.address.street}, {communeName(order.address.commune)} · +213 {formatPhone(order.contact.phone)}
              </span>
            </p>
            <p className="flex items-start gap-2">
              <Icon name="payments" size={18} className="text-primary" />
              <span>
                <strong className="block text-on-surface">Espèces à la livraison</strong>
                {CHANGE_LABEL[order.changePreference]}
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <ButtonLink href={`/suivi?id=${order.id}`} variant="solid" size="lg" icon="near_me">
          Suivre ma commande
        </ButtonLink>
        {user ? (
          <ButtonLink href="/compte/commandes" variant="secondary" size="lg" icon="receipt_long">
            Mes commandes
          </ButtonLink>
        ) : (
          <ButtonLink href="/menu" variant="secondary" size="lg">
            Retour à la carte
          </ButtonLink>
        )}
      </div>
    </div>
  );
}
