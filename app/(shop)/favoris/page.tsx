import type { Metadata } from "next";
import { FavoritesView } from "@/components/favorites/FavoritesView";
import { PageTransition } from "@/components/layout/PageTransition";

export const metadata: Metadata = { title: "Mes favoris" };

export default function FavoritesPage() {
  return (
    <PageTransition>
      <FavoritesView />
    </PageTransition>
  );
}
