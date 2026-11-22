"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { formatPrice } from "@/lib/format";
import { addToCart, toggleFavorite } from "@/lib/store/actions";
import { useIsFavorite } from "@/lib/store/hooks";
import { getState } from "@/lib/store/store";
import { getProduct } from "@/lib/data/products";
import type { Product } from "@/lib/types";
import { Icon } from "@/components/ui/Icon";
import { toast } from "@/components/ui/Toast";

/** Adds to cart and shows confirmation feedback (toast + inline check). */
export function useAddToCart() {
  return (product: Pick<Product, "slug" | "name">, quantity = 1) => {
    addToCart(product.slug, quantity);
    const { cart } = getState();
    const count = cart.reduce((n, i) => n + i.quantity, 0);
    const total = cart.reduce((n, i) => n + (getProduct(i.slug)?.price ?? 0) * i.quantity, 0);
    toast({
      title: quantity > 1 ? `${quantity} × ${product.name} ajoutés` : "Article ajouté au panier !",
      description: `${product.name} · Total : ${formatPrice(total)} (${count} article${count > 1 ? "s" : ""})`,
      icon: "check",
      action: { label: "Panier", href: "/panier" },
    });
  };
}

interface AddButtonProps {
  product: Pick<Product, "slug" | "name">;
  quantity?: number;
  className?: string;
  icon?: string;
  label?: string;
  size?: "xs" | "sm" | "md" | "lg";
  shape?: "rounded" | "pill";
  /** container = #135d54 (catalogue refs), solid = #00443d (home ref) */
  tone?: "container" | "solid";
}

const SIZE = {
  xs: "h-8 px-2.5 text-[11px] tracking-wide gap-1",
  sm: "h-9 px-3.5 text-label-md gap-1.5",
  md: "h-10 px-4 text-label-md gap-1.5",
  lg: "h-12 px-6 text-label-lg gap-2",
};

export function AddToCartButton({
  product,
  quantity = 1,
  className,
  icon = "add",
  label = "Ajouter",
  size = "md",
  shape = "rounded",
  tone = "container",
}: AddButtonProps) {
  const add = useAddToCart();
  const [added, setAdded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(null);
  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  return (
    <button
      type="button"
      aria-label={`Ajouter ${product.name} au panier`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        add(product, quantity);
        setAdded(true);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => setAdded(false), 1400);
      }}
      className={cn(
        "relative z-10 inline-flex shrink-0 items-center justify-center overflow-hidden font-bold whitespace-nowrap text-on-primary shadow-sm transition-[background-color,transform] active:scale-95",
        added ? "bg-primary" : tone === "solid" ? "bg-primary hover:bg-primary-container" : "bg-primary-container hover:bg-primary",
        shape === "pill" ? "rounded-full" : "rounded-xl",
        SIZE[size],
        className,
      )}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={added ? "done" : "idle"}
          initial={{ y: 14, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -14, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="inline-flex items-center gap-[inherit]"
        >
          <Icon name={added ? "check" : icon} size={size === "xs" ? 15 : 18} />
          <span>{added ? "Ajouté" : label}</span>
        </motion.span>
      </AnimatePresence>
    </button>
  );
}

export function FavoriteButton({ product, className, size = 28 }: { product: Pick<Product, "slug" | "name">; className?: string; size?: number }) {
  const active = useIsFavorite(product.slug);
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.8 }}
      aria-pressed={active}
      aria-label={active ? `Retirer ${product.name} des favoris` : `Ajouter ${product.name} aux favoris`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(product.slug);
      }}
      style={{ width: size, height: size }}
      className={cn(
        "z-10 grid place-items-center rounded-full bg-surface-container-lowest/90 shadow-sm backdrop-blur-sm transition-colors",
        active ? "text-error" : "text-outline hover:text-error",
        className,
      )}
    >
      <Icon name="favorite" fill={active} size={Math.round(size * 0.58)} />
    </motion.button>
  );
}
