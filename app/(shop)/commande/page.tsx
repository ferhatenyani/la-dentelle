import type { Metadata } from "next";
import { CheckoutView } from "@/components/checkout/CheckoutView";
import { PageTransition } from "@/components/layout/PageTransition";

export const metadata: Metadata = { title: "Finalisation de commande" };

export default function CheckoutPage() {
  return (
    <PageTransition>
      <CheckoutView />
    </PageTransition>
  );
}
