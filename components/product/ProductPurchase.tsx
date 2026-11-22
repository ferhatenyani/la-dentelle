"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { formatPrice } from "@/lib/format";
import { MAX_QUANTITY } from "@/lib/store/actions";
import { useCartQuantity } from "@/lib/store/hooks";
import type { Product } from "@/lib/types";
import { Icon } from "@/components/ui/Icon";
import { QuantitySelector } from "@/components/ui/QuantitySelector";
import { useAddToCart } from "./ProductActions";

/** Quantity + add-to-cart block. Inline on desktop, sticky bottom bar on mobile. */
export function ProductPurchase({ product }: { product: Product }) {
  const [qty, setQty] = useState(1);
  const add = useAddToCart();
  const inCart = useCartQuantity(product.slug);
  const max = Math.max(1, MAX_QUANTITY - inCart);
  const total = product.price * qty;
  const [pulse, setPulse] = useState(0);

  const onAdd = () => {
    add(product, Math.min(qty, max));
    setPulse((p) => p + 1);
    setQty(1);
  };

  const status = (
    <AnimatePresence>
      {inCart > 0 && (
        <motion.p
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="flex items-center gap-1.5 text-body-sm text-on-surface-variant"
          data-testid="in-cart"
        >
          <Icon name="check_circle" size={16} className="text-primary-container" />
          <span>
            Déjà <strong className="text-primary">{inCart}</strong> dans votre panier ·{" "}
            <Link href="/panier" className="font-bold text-primary underline-offset-2 hover:underline">
              Voir le panier
            </Link>
          </span>
        </motion.p>
      )}
    </AnimatePresence>
  );

  const button = (
    <motion.button
      key={pulse}
      type="button"
      onClick={onAdd}
      disabled={inCart >= MAX_QUANTITY}
      animate={pulse ? { scale: [1, 0.96, 1.02, 1] } : undefined}
      transition={{ duration: 0.35 }}
      className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-primary-container px-5 text-label-lg font-bold text-on-primary shadow-sm transition-colors hover:bg-primary disabled:opacity-50"
    >
      <Icon name="add_shopping_cart" size={20} />
      <span className="whitespace-nowrap">
        Ajouter · <span data-testid="purchase-total">{formatPrice(total)}</span>
      </span>
    </motion.button>
  );

  return (
    <>
      <div className="hidden flex-col gap-3 md:flex">
        <div className="flex items-center gap-3">
          <QuantitySelector value={qty} onChange={setQty} max={max} size="lg" />
          {button}
        </div>
        {status}
      </div>

      <div className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-outline-variant/30 bg-surface-container-lowest/95 px-4 pt-3 shadow-[0_-8px_24px_rgba(19,93,84,0.08)] backdrop-blur-xl md:hidden">
        <div className="pb-3">
          {status}
          <div className="mt-1 flex items-center gap-2">
            <QuantitySelector value={qty} onChange={setQty} max={max} />
            {button}
          </div>
        </div>
      </div>
    </>
  );
}
