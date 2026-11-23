import type { Metadata } from "next";
import { CartView } from "@/components/cart/CartView";
import { PageTransition } from "@/components/layout/PageTransition";

export const metadata: Metadata = { title: "Panier" };

export default function CartPage() {
  return (
    <PageTransition>
      <CartView />
    </PageTransition>
  );
}
