"use client";

import { getProduct } from "@/lib/data/products";
import { formatPrice } from "@/lib/format";
import { Icon } from "@/components/ui/Icon";
import { useAddToCart } from "@/components/product/ProductActions";

/** "Cherbet de Boufarik & Thés aux Herbes" strip (home-page-desktop #boissons). */
export function DrinksBanner() {
  const add = useAddToCart();
  const cherbet = getProduct("cherbet-citron-boufarik")!;
  const the = getProduct("the-menthe-timimoun")!;
  return (
    <section id="boissons" className="rounded-3xl border border-outline-variant/30 bg-surface-container-low p-6 sm:p-8">
      <div className="flex flex-col items-center justify-between gap-6 lg:flex-row">
        <div className="space-y-2 text-center lg:text-left">
          <span className="rounded-full bg-secondary-container px-2.5 py-0.5 text-xs font-extrabold uppercase text-on-secondary-fixed">
            Rafraîchissements du Terroir
          </span>
          <h2 className="pt-1 text-xl font-extrabold text-primary sm:text-2xl">Cherbet de Boufarik &amp; Thés aux Herbes</h2>
          <p className="max-w-xl text-sm text-on-surface-variant">
            Citronnade traditionnelle aux zestes pressés et eau de fleur d&apos;oranger fraîche, ou thé à la menthe douce de Timimoun préparé à la
            commande.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => add(cherbet)}
            className="flex items-center gap-2 rounded-xl border border-outline-variant/40 bg-white px-4 py-2.5 text-sm font-bold text-primary shadow-sm transition-all hover:border-primary active:scale-95"
          >
            <Icon name="local_drink" size={18} />
            <span>Cherbet Citron 1L ({formatPrice(cherbet.price)})</span>
          </button>
          <button
            type="button"
            onClick={() => add(the)}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-primary-container active:scale-95"
          >
            <Icon name="emoji_food_beverage" size={18} />
            <span>Thé Menthe ({formatPrice(the.price)})</span>
          </button>
        </div>
      </div>
    </section>
  );
}
