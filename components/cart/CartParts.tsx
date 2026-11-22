"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { cn } from "@/lib/cn";
import { FREE_DELIVERY_THRESHOLD, DELIVERY_FEE } from "@/lib/data/catalog";
import { formatNumber, formatPrice } from "@/lib/format";
import { removeFromCart, setCartQuantity, MAX_QUANTITY } from "@/lib/store/actions";
import type { CartLine } from "@/lib/store/hooks";
import { Icon } from "@/components/ui/Icon";
import { QuantitySelector } from "@/components/ui/QuantitySelector";
import { toast } from "@/components/ui/Toast";
import { ProductImage } from "@/components/product/ProductImage";

function remove(line: CartLine) {
  removeFromCart(line.product.slug);
  toast({ title: "Article retiré", description: line.product.name, icon: "delete", tone: "info" });
}

/** Editable cart line. `compact` = checkout-mobile row, default = desktop card. */
export function CartLineRow({ line, compact }: { line: CartLine; compact?: boolean }) {
  const { product, quantity } = line;
  const onQty = (q: number) => (q < 1 ? remove(line) : setCartQuantity(product.slug, q));

  if (compact) {
    return (
      <div data-testid="cart-line" className="flex items-center gap-3 rounded-2xl bg-surface-container-lowest p-3 shadow-card">
        <Link href={`/menu/${product.slug}`} className="relative size-16 shrink-0 overflow-hidden rounded-xl">
          <ProductImage product={product} sizes="64px" />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="truncate text-label-lg text-on-surface">{product.name}</p>
          <p className="text-label-md font-bold text-primary" data-testid="line-total">
            {formatPrice(line.lineTotal)}
          </p>
          <p className="truncate text-[11px] tracking-wide text-on-surface-variant">{product.pairing}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <QuantitySelector value={quantity} onChange={onQty} min={0} max={MAX_QUANTITY} size="sm" label={`Quantité de ${product.name}`} />
        </div>
      </div>
    );
  }

  return (
    <div data-testid="cart-line" className="flex gap-5 rounded-2xl bg-surface-container-lowest p-4 shadow-card">
      <Link href={`/menu/${product.slug}`} className="relative aspect-[4/3] w-36 shrink-0 overflow-hidden rounded-xl">
        <ProductImage product={product} sizes="144px" imgClassName="transition-transform duration-500 hover:scale-105" />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <span className="text-label-sm uppercase tracking-wider text-secondary">{product.origin}</span>
            <Link href={`/menu/${product.slug}`} className="block text-headline-sm text-primary hover:text-primary-container">
              {product.name}
            </Link>
            <p className="text-body-sm text-on-surface-variant">
              {formatPrice(product.price)} / {product.unit ?? "portion"} · {product.pairing}
            </p>
          </div>
          <span className="whitespace-nowrap text-headline-sm font-bold text-primary" data-testid="line-total">
            {formatPrice(line.lineTotal)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <QuantitySelector value={quantity} onChange={onQty} min={0} max={MAX_QUANTITY} label={`Quantité de ${product.name}`} />
          <button
            type="button"
            onClick={() => remove(line)}
            aria-label={`Retirer ${product.name} du panier`}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-label-md text-on-surface-variant transition-colors hover:bg-error-container/50 hover:text-error"
          >
            <Icon name="delete" size={18} /> Retirer
          </button>
        </div>
      </div>
    </div>
  );
}

/** Progress towards free delivery. */
export function FreeDeliveryMeter({ subtotal }: { subtotal: number }) {
  const left = FREE_DELIVERY_THRESHOLD - subtotal;
  const pct = Math.min(100, (subtotal / FREE_DELIVERY_THRESHOLD) * 100);
  return (
    <div className="rounded-xl bg-surface-container-low p-3.5" data-testid="free-delivery">
      <p className="mb-2 flex items-center gap-2 text-label-md text-on-surface">
        <Icon name={left > 0 ? "local_shipping" : "check_circle"} size={18} className="text-primary" />
        {left > 0 ? (
          <span>
            Plus que <strong className="text-primary">{formatPrice(left)}</strong> pour la livraison offerte
          </span>
        ) : (
          <span>Livraison offerte sur votre commande</span>
        )}
      </p>
      <div className="h-1.5 overflow-hidden rounded-full bg-surface-container-high">
        <motion.div className="h-full rounded-full bg-secondary-container" initial={false} animate={{ width: `${pct}%` }} transition={{ type: "spring", stiffness: 140, damping: 22 }} />
      </div>
    </div>
  );
}

/** Totals block (checkout-desktop "Sous-total plats / Frais de livraison / Total Net"). */
export function TotalsBlock({ subtotal, deliveryFee, total, count, className }: { subtotal: number; deliveryFee: number; total: number; count: number; className?: string }) {
  return (
    <div className={cn("space-y-3 rounded-xl border border-outline-variant/30 bg-surface-container-low/60 p-4", className)}>
      <div className="flex items-center justify-between text-body-md">
        <span className="text-on-surface-variant">
          Sous-total plats <span className="text-body-sm">({count} article{count > 1 ? "s" : ""})</span>
        </span>
        <span className="font-bold text-on-surface" data-testid="subtotal">
          {formatPrice(subtotal)}
        </span>
      </div>
      <div className="flex items-center justify-between text-body-md">
        <span className="text-on-surface-variant">Frais de livraison Alger</span>
        {deliveryFee === 0 ? (
          <span className="flex items-center gap-2" data-testid="delivery-fee">
            <span className="text-body-sm text-outline line-through">{formatPrice(DELIVERY_FEE)}</span>
            <span className="text-label-md font-bold text-primary-container">GRATUIT</span>
          </span>
        ) : (
          <span className="font-bold text-on-surface" data-testid="delivery-fee">
            {formatPrice(deliveryFee)}
          </span>
        )}
      </div>
      <div className="flex items-center justify-between text-body-md">
        <span className="text-on-surface-variant">Emballage isotherme thermorégulé</span>
        <span className="text-label-md font-bold text-primary-container">Inclus</span>
      </div>
      <div className="flex items-end justify-between gap-3 border-t border-outline-variant/30 pt-4">
        <div>
          <p className="text-headline-sm font-semibold text-primary">Total net à régler</p>
          <p className="text-label-sm uppercase tracking-wide text-secondary">En espèces au livreur</p>
        </div>
        <p className="whitespace-nowrap text-[34px] font-bold leading-none tracking-tight text-primary" data-testid="total">
          {formatNumber(total)} <span className="text-headline-sm">DA</span>
        </p>
      </div>
    </div>
  );
}
