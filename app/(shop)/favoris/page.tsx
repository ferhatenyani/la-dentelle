import type { Metadata } from "next";
import { FavoritesView } from "@/components/favorites/FavoritesView";

export const metadata: Metadata = { title: "Mes favoris" };

export default function FavoritesPage() {
  return <FavoritesView />;
}
