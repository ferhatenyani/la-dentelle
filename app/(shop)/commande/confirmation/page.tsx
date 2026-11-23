import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/ui/States";
import { ConfirmationView } from "@/components/checkout/ConfirmationView";
import { PageTransition } from "@/components/layout/PageTransition";

export const metadata: Metadata = { title: "Commande confirmée" };

export default function ConfirmationPage() {
  return (
    <PageTransition>
      <Suspense fallback={<PageSkeleton />}>
        <ConfirmationView />
      </Suspense>
    </PageTransition>
  );
}
