"use client";

import { getProduct } from "@/lib/data/products";
import { useAppState, useHydrated } from "@/lib/store/store";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState, PageSkeleton } from "@/components/ui/States";
import { CompactCard, FeatureCard } from "@/components/product/ProductCard";

export function FavoritesView() {
  const hydrated = useHydrated();
  const { favorites } = useAppState();
  if (!hydrated) return <PageSkeleton />;
  const products = favorites.map(getProduct).filter((p) => !!p);

  return (
    <div className="mx-auto w-full max-w-[1320px] px-4 pt-4 xs:px-margin md:px-6 md:py-12">
      <p className="text-label-sm uppercase tracking-widest text-secondary">Vos coups de cœur</p>
      <h1 className="mb-6 text-headline-lg-mobile text-primary md:text-headline-lg">Mes Favoris</h1>
      {products.length === 0 ? (
        <EmptyState
          icon="favorite"
          title="Aucun favori pour l'instant"
          description="Touchez le cœur d'un plat pour l'épingler ici et le recommander en un geste."
          action={<ButtonLink href="/menu" icon="restaurant_menu">Explorer la carte</ButtonLink>}
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:hidden">
            {products.map((p) => (
              <CompactCard key={p.slug} product={p} />
            ))}
          </div>
          <div className="hidden grid-cols-2 gap-5 md:grid lg:grid-cols-4">
            {products.map((p) => (
              <FeatureCard key={p.slug} product={p} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
