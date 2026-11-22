import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/ui/States";
import { ConfirmationView } from "@/components/checkout/ConfirmationView";

export const metadata: Metadata = { title: "Commande confirmée" };

export default function ConfirmationPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ConfirmationView />
    </Suspense>
  );
}
