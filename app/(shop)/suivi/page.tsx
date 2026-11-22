import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/ui/States";
import { TrackingView } from "@/components/tracking/TrackingView";

export const metadata: Metadata = { title: "Suivi en direct" };

export default function TrackingPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <TrackingView />
    </Suspense>
  );
}
