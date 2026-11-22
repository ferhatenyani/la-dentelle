import type { Metadata } from "next";
import { Suspense } from "react";
import { Icon } from "@/components/ui/Icon";
import { Catalogue, CatalogueSkeleton } from "@/components/catalogue/Catalogue";

export const metadata: Metadata = {
  title: "Carte & Commandes",
  description: "Rechta, couscous constantinois, tajines, matlouh, boureks et pâtisseries de la Casbah — commandez en livraison à Alger.",
};

export default function MenuPage() {
  return (
    <div className="flex w-full flex-col">
      <div className="mx-auto hidden w-full max-w-[1320px] px-6 pb-6 pt-8 md:block">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="h-[2px] w-6 bg-secondary" />
              <span className="text-label-sm uppercase tracking-[0.2em] text-secondary">Carte Gastronomique · Terroirs d&apos;Algérie</span>
            </div>
            <h1 className="text-headline-lg text-primary">Nos Créations Culinaires</h1>
            <p className="mt-1 max-w-xl text-body-md text-on-surface-variant">
              L&apos;alliance raffinée des recettes séculaires d&apos;Alger, de Constantine et des Hauts Plateaux, magnifiées par nos maîtres queux et
              servies chaudes à votre table.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-4 rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-5 py-3.5 shadow-sm">
            <span className="grid size-10 place-items-center rounded-lg bg-surface-container text-primary">
              <Icon name="verified" size={22} />
            </span>
            <div className="flex flex-col">
              <span className="text-label-md font-bold leading-tight text-on-surface">100% Viandes Locales &amp; Épices Nobles</span>
              <span className="mt-0.5 text-body-sm leading-tight text-on-surface-variant">Livraison isotherme express Alger &amp; Hydra</span>
            </div>
          </div>
        </div>
      </div>
      <Suspense fallback={<CatalogueSkeleton />}>
        <Catalogue />
      </Suspense>
    </div>
  );
}
