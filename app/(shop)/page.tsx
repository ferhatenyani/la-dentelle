import Link from "next/link";
import type { ReactNode } from "react";
import { getProduct } from "@/lib/data/products";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/Icon";
import { FeatureCard } from "@/components/product/ProductCard";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { CategoryBar } from "@/components/home/CategoryBar";
import { DeliveryEstimator } from "@/components/home/DeliveryEstimator";
import { DrinksBanner } from "@/components/home/DrinksBanner";
import { MobileHome } from "@/components/home/MobileHome";

const SECTIONS = [
  {
    id: "sandwiches",
    kicker: { label: "Street Food Haute Couture", className: "bg-secondary-container text-on-secondary-fixed" },
    meta: (
      <span className="flex items-center gap-1 text-xs font-bold text-primary">
        <Icon name="timer" size={15} /> Prêt en 12–15 min
      </span>
    ),
    title: "Sandwiches Gastronomiques & Pain Matlouh Artisanal",
    text: "Pains traditionnels pétris chaque matin et garnis de viandes tendres effilochées, marinades aux épices nobles et sauces signature.",
    aside: <span className="text-xs font-semibold text-on-secondary-fixed-variant">4 créations du chef</span>,
    slugs: ["matlouh-agneau-confit", "matlouh-poulet-hmiss", "merguez-oran-frites", "brioche-kebda-mchermla"],
  },
  {
    id: "douceurs",
    kicker: { label: "Atelier Sucre & Miel Pur", className: "bg-primary/10 text-primary" },
    meta: (
      <span className="flex items-center gap-1 text-xs font-bold text-secondary">
        <Icon name="eco" size={15} /> Amandes de Blida
      </span>
    ),
    title: "Pâtisseries & Douceurs de la Casbah",
    text: "Les joyaux sucrés du patrimoine algérois façonnés à la main, nappés de miel sauvage et parfumés à la fleur d'oranger distillée.",
    aside: (
      <Link href="/menu?categorie=douceurs" className="flex items-center gap-1 text-xs font-bold text-primary hover:underline">
        Voir tous les coffrets cadeaux <Icon name="chevron_right" size={15} />
      </Link>
    ),
    slugs: ["makrout-el-louz-dziriettes", "tcharek-samsa-miel", "mhalbi-fleur-oranger", "brioche-mona"],
  },
  {
    id: "plats-signatures",
    kicker: { label: "Haute Cuisine d'Apparat", className: "bg-primary text-white" },
    meta: <span className="text-xs font-semibold text-on-surface-variant">Emballage isotherme scellé 65°C</span>,
    title: "Grands Plats de Terroir & Spécialités d'Honneur",
    text: "Les grands classiques séculaires de notre gastronomie mijotés par nos maîtres-queux, prêts à servir sur vos tables.",
    aside: <span className="text-xs font-semibold text-on-secondary-fixed-variant">Portions copieuses 1 à 2 pers.</span>,
    slugs: ["rechta-imperiale", "couscous-royal-constantinois", "tajine-lham-lahlou", "chorba-frik-boureks"],
  },
] satisfies { id: string; kicker: { label: string; className: string }; meta: ReactNode; title: string; text: string; aside: ReactNode; slugs: string[] }[];

function DesktopHome() {
  return (
    <div className="hidden md:block" data-testid="home-desktop">
      <div className="flex items-center justify-center gap-2 border-b border-primary/20 bg-primary-container px-4 py-2 text-center text-sm font-medium text-primary-fixed">
        <span className="rounded-full bg-secondary-container px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-on-secondary-fixed">Offre Alger</span>
        <span>
          Livraison offerte dès <strong>3 000 DA</strong> sur Hydra, Sidi Yahia &amp; Alger Centre avec le code{" "}
          <strong className="underline decoration-secondary-container">DENTELLE</strong>
        </span>
      </div>
      <HeroCarousel />
      <CategoryBar />
      <div id="tous" className="mx-auto max-w-7xl scroll-mt-40 space-y-16 px-6 py-8 lg:px-8">
        {SECTIONS.map((s, si) => (
          <section key={s.id} id={s.id} aria-labelledby={`${s.id}-title`} className="scroll-mt-40 space-y-6 pt-4">
            <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
              <div className="max-w-3xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-extrabold uppercase tracking-wider", s.kicker.className)}>{s.kicker.label}</span>
                  {s.meta}
                </div>
                <h2 id={`${s.id}-title`} className="mt-2 text-3xl font-extrabold leading-tight tracking-tight text-primary">
                  {s.title}
                </h2>
                <p className="mt-1.5 text-sm text-on-surface-variant">{s.text}</p>
              </div>
              <div className="shrink-0">{s.aside}</div>
            </div>
            <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
              {s.slugs.map((slug, i) => (
                <FeatureCard key={slug} product={getProduct(slug)!} priority={si === 0 && i < 2} />
              ))}
            </div>
          </section>
        ))}
        <DrinksBanner />
        <DeliveryEstimator />
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      <DesktopHome />
      <MobileHome />
    </>
  );
}
