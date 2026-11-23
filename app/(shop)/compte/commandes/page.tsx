import type { Metadata } from "next";
import { OrdersView } from "@/components/orders/OrdersView";
import { PageTransition } from "@/components/layout/PageTransition";

export const metadata: Metadata = { title: "Mes commandes" };

export default function OrdersPage() {
  return (
    <PageTransition>
      <OrdersView />
    </PageTransition>
  );
}
