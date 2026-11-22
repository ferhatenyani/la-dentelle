"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { formatNumber } from "@/lib/format";
import { clearCart } from "@/lib/store/actions";
import { useCart } from "@/lib/store/hooks";
import { useHydrated } from "@/lib/store/store";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { EmptyState, PageSkeleton } from "@/components/ui/States";
import { CartLineRow, FreeDeliveryMeter, TotalsBlock } from "./CartParts";

export function CartView() {
  const hydrated = useHydrated();
  const cart = useCart();

  if (!hydrated) return <PageSkeleton />;

  if (cart.lines.length === 0) {
    return (
      <div className="mx-auto w-full max-w-[1280px] px-4 py-8 md:px-6 md:py-12">
        <EmptyState
          icon="shopping_bag"
          title="Votre panier est vide"
          description="Composez votre table : rechta, couscous constantinois, matlouh artisanal ou douceurs de la Casbah."
          action={
            <ButtonLink href="/menu" size="lg" icon="restaurant_menu">
              Découvrir la carte
            </ButtonLink>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1280px] px-4 pb-36 pt-4 xs:px-margin md:px-6 md:py-10 md:pb-16">
      <div className="mb-6 flex flex-col gap-2 md:mb-8 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2 text-label-md uppercase text-on-surface">
            <Icon name="shopping_bag" size={18} /> {cart.count} délice{cart.count > 1 ? "s" : ""} sélectionné{cart.count > 1 ? "s" : ""}
          </div>
          <h1 className="text-headline-lg-mobile text-primary md:text-headline-lg">Votre Panier Gastronomique</h1>
        </div>
        <button
          type="button"
          onClick={clearCart}
          className="flex w-fit items-center gap-1.5 rounded-lg px-3 py-2 text-label-md text-on-surface-variant hover:bg-error-container/40 hover:text-error"
        >
          <Icon name="delete" size={18} /> Vider le panier
        </button>
      </div>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        <div className="flex flex-col gap-3 lg:col-span-7">
          <AnimatePresence initial={false}>
            {cart.lines.map((line) => (
              <motion.div
                key={line.product.slug}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -40, height: 0, marginTop: -12 }}
                transition={{ duration: 0.25 }}
              >
                <div className="md:hidden">
                  <CartLineRow line={line} compact />
                </div>
                <div className="hidden md:block">
                  <CartLineRow line={line} />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <Link href="/menu" className="mt-2 flex w-fit items-center gap-1.5 text-label-lg text-primary hover:underline">
            <Icon name="add" size={18} /> Ajouter d&apos;autres plats
          </Link>
        </div>

        <aside className="flex flex-col gap-4 rounded-3xl bg-surface-container-lowest p-5 shadow-card md:p-6 lg:sticky lg:top-28 lg:col-span-5">
          <h2 className="flex items-center gap-2 text-headline-sm font-semibold text-primary">
            <Icon name="receipt_long" /> Récapitulatif
          </h2>
          <FreeDeliveryMeter subtotal={cart.subtotal} />
          <TotalsBlock {...cart} />
          <div className="hidden md:block">
            <ButtonLink href="/commande" variant="solid" size="lg" iconRight="arrow_forward" className="h-14 w-full text-body-lg">
              Passer la commande
            </ButtonLink>
          </div>
          <p className="flex items-center justify-center gap-1.5 text-body-sm text-on-surface-variant">
            <Icon name="lock" size={16} /> Paiement comptant en dinars algériens à la réception
          </p>
        </aside>
      </div>

      {/* Mobile sticky CTA (checkout-mobile "Confirmer la Commande · total") */}
      <div className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-outline-variant/30 bg-surface/95 px-4 pt-3 backdrop-blur-xl md:hidden">
        <Link
          href="/commande"
          className="mb-3 flex h-14 w-full items-center justify-between rounded-full bg-on-surface px-6 text-body-lg font-bold text-surface-container-lowest shadow-lg active:scale-[0.98]"
        >
          <span>Commander</span>
          <span className="flex items-center gap-2">
            <span className="whitespace-nowrap">{formatNumber(cart.total)} DA</span>
            <Icon name="arrow_forward" size={22} />
          </span>
        </Link>
      </div>
    </div>
  );
}
