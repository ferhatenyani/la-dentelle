"use client";

import { useMemo } from "react";
import { getProduct } from "@/lib/data/products";
import type { Product } from "@/lib/types";
import { computeTotals } from "./actions";
import { useAppState } from "./store";

export interface CartLine {
  product: Product;
  quantity: number;
  lineTotal: number;
}

export function useCart() {
  const { cart } = useAppState();
  return useMemo(() => {
    const lines: CartLine[] = cart.flatMap((i) => {
      const product = getProduct(i.slug);
      return product ? [{ product, quantity: i.quantity, lineTotal: product.price * i.quantity }] : [];
    });
    const count = lines.reduce((n, l) => n + l.quantity, 0);
    const subtotal = lines.reduce((n, l) => n + l.lineTotal, 0);
    return { lines, count, ...computeTotals(subtotal) };
  }, [cart]);
}

export function useCartQuantity(slug: string) {
  const { cart } = useAppState();
  return cart.find((i) => i.slug === slug)?.quantity ?? 0;
}

export function useSessionUser() {
  const { users, sessionUserId } = useAppState();
  return useMemo(() => users.find((u) => u.id === sessionUserId) ?? null, [users, sessionUserId]);
}

export function useIsFavorite(slug: string) {
  return useAppState().favorites.includes(slug);
}

export function useUserOrders() {
  const { orders, sessionUserId } = useAppState();
  return useMemo(
    () => orders.filter((o) => o.userId === sessionUserId).sort((a, b) => b.createdAt - a.createdAt),
    [orders, sessionUserId],
  );
}

export function useOrder(id: string | null) {
  const { orders } = useAppState();
  return useMemo(() => (id ? (orders.find((o) => o.id === id) ?? null) : null), [orders, id]);
}
