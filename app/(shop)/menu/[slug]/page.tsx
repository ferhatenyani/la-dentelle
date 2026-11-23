import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CATEGORIES, LABELS } from "@/lib/data/catalog";
import { getProduct, PRODUCTS } from "@/lib/data/products";
import { formatPrice } from "@/lib/format";
import { Icon } from "@/components/ui/Icon";
import { CompactCard, FeatureCard } from "@/components/product/ProductCard";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductPurchase } from "@/components/product/ProductPurchase";
import { PageTransition } from "@/components/layout/PageTransition";

export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/menu/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) return { title: "Plat introuvable" };
  return { title: product.name, description: product.description };
}

const ASSURANCES = [
  { icon: "thermostat", title: "Caisson isotherme 65°C", text: "Servi chaud comme au restaurant" },
  { icon: "payments", title: "Paiement en espèces", text: "Réglez au livreur, en dinars" },
  { icon: "verified", title: "Viandes 100% halal", text: "Traçabilité intégrale" },
];

export default function ProductPage({ params }: PageProps<"/menu/[slug]">) {
  return (
    <PageTransition>
      <Suspense fallback={<ProductSkeleton />}>
        {params.then(({ slug }) => (
          <ProductDetail slug={slug} />
        ))}
      </Suspense>
    </PageTransition>
  );
}

function ProductSkeleton() {
  return (
    <div className="mx-auto grid w-full max-w-[1320px] gap-10 md:grid-cols-2 md:px-6 md:pt-14" aria-busy="true" aria-label="Chargement du plat">
      <div className="aspect-[4/3] animate-pulse bg-surface-container md:rounded-3xl" />
      <div className="space-y-4 px-4 md:px-0">
        <div className="h-5 w-40 animate-pulse rounded-full bg-surface-container" />
        <div className="h-10 w-3/4 animate-pulse rounded-xl bg-surface-container" />
        <div className="h-24 animate-pulse rounded-xl bg-surface-container" />
        <div className="h-12 animate-pulse rounded-xl bg-surface-container" />
      </div>
    </div>
  );
}

function ProductDetail({ slug }: { slug: string }) {
  const product = getProduct(slug);
  if (!product) notFound();

  const category = CATEGORIES.find((c) => c.id === product.category)!;
  const related = PRODUCTS.filter((p) => p.slug !== product.slug && p.category === product.category).slice(0, 4);
  const fill = PRODUCTS.filter((p) => p.slug !== product.slug && p.category !== product.category && p.popularity >= 8);
  const suggestions = [...related, ...fill].slice(0, 4);
  const labels = LABELS.filter((l) => product.labels.includes(l.id));

  return (
    <div className="mx-auto w-full max-w-[1320px] md:px-6 md:pt-6">
      <nav aria-label="Fil d'Ariane" className="mb-5 hidden items-center gap-1.5 text-label-md text-on-surface-variant md:flex">
        <Link href="/" className="hover:text-primary">
          Accueil
        </Link>
        <Icon name="chevron_right" size={16} />
        <Link href="/menu" className="hover:text-primary">
          Carte
        </Link>
        <Icon name="chevron_right" size={16} />
        <Link href={`/menu?categorie=${category.id}`} className="hover:text-primary">
          {category.name}
        </Link>
        <Icon name="chevron_right" size={16} />
        <span aria-current="page" className="truncate font-bold text-primary">
          {product.name}
        </span>
      </nav>

      <div className="grid gap-0 md:grid-cols-2 md:gap-10 lg:gap-14">
        <ProductGallery product={product} />

        <div className="relative z-10 -mt-6 flex flex-col gap-5 rounded-t-3xl bg-surface px-4 pt-6 xs:px-margin md:mt-0 md:rounded-none md:bg-transparent md:px-0 md:pt-0">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-secondary-container px-2.5 py-0.5 text-label-sm uppercase text-on-secondary-fixed">{product.origin}</span>
              <span className="flex items-center gap-1 text-label-md text-on-surface-variant">
                <Icon name="location_on" size={15} className="text-secondary" /> {product.locality}
              </span>
            </div>
            <h1 className="text-headline-lg-mobile text-primary md:text-headline-lg">{product.name}</h1>
            <p className="mt-1 text-label-md uppercase tracking-wider text-secondary">{product.subtitle}</p>
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-label-lg text-on-surface-variant">
              <span className="flex items-center gap-1">
                <Icon name="star" fill size={18} className="text-secondary" />
                <strong className="text-on-surface">{product.rating.toFixed(product.rating * 10 === Math.round(product.rating * 10) ? 1 : 2)}</strong>
                <span className="font-normal">({product.reviews} avis)</span>
              </span>
              <span className="flex items-center gap-1">
                <Icon name="schedule" size={18} className="text-primary" /> {product.prepMinutes} min
              </span>
              <span className="flex items-center gap-1">
                <Icon name="restaurant" size={18} className="text-primary" /> {product.serves}
              </span>
            </div>
          </div>

          <div className="flex items-end gap-2">
            <span className="text-headline-lg font-bold text-primary" data-testid="product-detail-price">
              {formatPrice(product.price)}
            </span>
            {product.unit && <span className="pb-1.5 text-body-sm text-on-surface-variant">/ {product.unit}</span>}
          </div>

          <p className="text-body-lg text-on-surface-variant">{product.story}</p>

          {labels.length > 0 && (
            <ul className="flex flex-wrap gap-2" aria-label="Labels">
              {labels.map((l) => (
                <li
                  key={l.id}
                  className="inline-flex h-7 items-center gap-1.5 rounded-full border border-secondary/30 bg-secondary/5 px-3 text-label-md text-on-secondary-fixed-variant"
                >
                  {l.icon ? <Icon name={l.icon} size={14} className="text-secondary" /> : <span className={`size-2 rounded-full ${l.dot}`} />}
                  {l.name}
                </li>
              ))}
            </ul>
          )}

          <ProductPurchase product={product} />

          <div className="grid gap-4 rounded-2xl border border-primary/10 bg-surface-container-lowest p-5 shadow-card sm:grid-cols-2">
            <div>
              <h2 className="mb-2 text-label-md uppercase tracking-wider text-secondary">Ingrédients</h2>
              <ul className="space-y-1 text-body-sm text-on-surface-variant">
                {product.ingredients.map((i) => (
                  <li key={i} className="flex items-center gap-1.5">
                    <span className="size-1 rounded-full bg-primary-container" /> {i}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="mb-2 text-label-md uppercase tracking-wider text-secondary">Allergènes</h2>
              <p className="text-body-sm text-on-surface-variant">{product.allergens.length ? product.allergens.join(", ") : "Aucun allergène majeur"}</p>
              <h2 className="mb-2 mt-4 text-label-md uppercase tracking-wider text-secondary">Accord du chef</h2>
              <p className="text-body-sm text-on-surface-variant">{product.pairing}</p>
            </div>
          </div>

          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {ASSURANCES.map((a) => (
              <li key={a.title} className="flex items-center gap-3 rounded-xl bg-surface-container-low p-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-surface-container-lowest text-primary">
                  <Icon name={a.icon} size={20} />
                </span>
                <span className="flex flex-col">
                  <span className="text-label-md font-bold text-on-surface">{a.title}</span>
                  <span className="text-[11px] text-on-surface-variant">{a.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <section aria-labelledby="suggestions" className="mt-12 px-4 pb-32 xs:px-margin md:mb-16 md:px-0 md:pb-0">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <span className="text-label-sm uppercase tracking-widest text-secondary">Pour compléter votre table</span>
            <h2 id="suggestions" className="text-headline-sm font-bold text-primary md:text-headline-md">
              Accords suggérés
            </h2>
          </div>
          <Link href={`/menu?categorie=${category.id}`} className="-my-3 flex shrink-0 items-center gap-1 py-3 text-label-md font-bold text-primary hover:underline">
            Voir {category.short.toLowerCase()} <Icon name="chevron_right" size={16} />
          </Link>
        </div>
        <div className="hidden grid-cols-2 gap-5 md:grid lg:grid-cols-4">
          {suggestions.map((p) => (
            <FeatureCard key={p.slug} product={p} />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 md:hidden">
          {suggestions.map((p) => (
            <CompactCard key={p.slug} product={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
