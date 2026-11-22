"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { useUserOrders } from "@/lib/store/hooks";
import { getTrackingSnapshot } from "@/lib/tracking";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState, PageSkeleton } from "@/components/ui/States";
import { useRequireUser } from "@/components/account/AccountView";
import { OrderHistoryRow, useNow } from "./OrderParts";

export function OrdersView() {
  const user = useRequireUser("/compte/commandes");
  const orders = useUserOrders();
  const now = useNow();
  const [filter, setFilter] = useState<"all" | "active" | "done">("all");
  if (!user) return <PageSkeleton />;

  const list = orders.filter((o) => {
    if (filter === "all") return true;
    const delivered = getTrackingSnapshot(o, now).status === "livree";
    return filter === "done" ? delivered : !delivered;
  });

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-10 pt-4 xs:px-margin md:px-6 md:py-12">
      <p className="text-label-sm uppercase tracking-widest text-secondary">Espace privilège</p>
      <h1 className="mb-6 text-headline-lg-mobile text-primary md:text-headline-lg">Historique des Commandes</h1>
      <div role="tablist" aria-label="Filtrer les commandes" className="mb-5 flex gap-2">
        {([
          ["all", `Toutes (${orders.length})`],
          ["active", "En cours"],
          ["done", "Livrées"],
        ] as const).map(([id, label]) => (
          <button
            key={id}
            role="tab"
            type="button"
            aria-selected={filter === id}
            onClick={() => setFilter(id)}
            className={cn("rounded-full px-4 py-2 text-label-md transition-colors", filter === id ? "bg-primary text-on-primary" : "bg-surface-container-lowest text-on-surface-variant shadow-sm hover:text-primary")}
          >
            {label}
          </button>
        ))}
      </div>
      {list.length ? (
        <ul className="flex flex-col gap-3">
          {list.map((o) => (
            <OrderHistoryRow key={o.id} order={o} now={now} />
          ))}
        </ul>
      ) : (
        <EmptyState
          icon="receipt_long"
          title={orders.length ? "Aucune commande dans cette catégorie" : "Aucune commande pour le moment"}
          description="Vos dégustations apparaîtront ici dès votre première commande."
          action={<ButtonLink href="/menu" icon="restaurant_menu">Commander</ButtonLink>}
        />
      )}
    </div>
  );
}
