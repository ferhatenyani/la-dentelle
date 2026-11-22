import Link from "next/link";
import { cn } from "@/lib/cn";
import { formatNumber, formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";
import { Icon } from "@/components/ui/Icon";
import { AddToCartButton, FavoriteButton } from "./ProductActions";
import { ProductImage } from "./ProductImage";

const href = (p: Product) => `/menu/${p.slug}`;

function Rating({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5 font-bold text-secondary", className)}>
      <Icon name="star" fill size={14} />
      <span className="sr-only">Note </span>
      {value.toFixed(value * 10 === Math.round(value * 10) ? 1 : 2)}
    </span>
  );
}

/** Home page desktop card (home-page-desktop: 4-up grids). */
export function FeatureCard({ product, priority }: { product: Product; priority?: boolean }) {
  const isSweet = product.category === "douceurs";
  return (
    <article
      data-testid="product-card"
      className="group relative flex flex-col justify-between rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-3 shadow-sm transition-all duration-300 hover:border-primary/40 hover:shadow-xl"
    >
      <div>
        <div className="relative aspect-[4/3] overflow-hidden rounded-xl">
          <ProductImage
            product={product}
            sizes="(min-width:1024px) 300px, (min-width:640px) 45vw, 90vw"
            imgClassName="transition-transform duration-500 group-hover:scale-105"
            priority={priority}
          />
          {product.badge && (
            <span
              className={cn(
                "absolute left-2.5 top-2.5 rounded-md px-2 py-0.5 text-[11px] font-bold",
                isSweet || product.badge === "Best-Seller"
                  ? "bg-secondary-container text-on-secondary-fixed"
                  : "bg-primary/90 text-white backdrop-blur",
              )}
            >
              {product.badge}
            </span>
          )}
          {isSweet ? (
            <FavoriteButton product={product} className="absolute right-2.5 top-2.5" />
          ) : (
            <span className="absolute bottom-2.5 right-2.5 flex items-center gap-1 rounded bg-black/60 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur">
              <Icon name="schedule" size={13} className="text-secondary-fixed" /> {product.prepMinutes} min
            </span>
          )}
        </div>
        <div className="pt-3">
          {isSweet ? (
            <span className="text-xs font-bold uppercase tracking-wider text-secondary">{product.origin === "Atelier Sucre & Miel Pur" ? product.subtitle : product.origin}</span>
          ) : (
            <div className="mb-1 flex items-center justify-between gap-2 text-xs font-medium text-on-surface-variant">
              <span className="truncate">{product.subtitle}</span>
              <Rating value={product.rating} />
            </div>
          )}
          <h3 className="mt-0.5 text-base font-bold leading-snug text-primary group-hover:text-primary-container">
            <Link href={href(product)} className="after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-primary-container">
              {product.name}
            </Link>
          </h3>
          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-on-surface-variant">{product.description}</p>
        </div>
      </div>
      <div className="mt-auto flex items-end justify-between gap-2 pt-4">
        <div className="min-w-0">
          {product.unit && <span className="block text-xs text-on-surface-variant">{product.unit}</span>}
          <span className="block whitespace-nowrap text-lg font-extrabold text-primary" data-testid="product-price">
            {formatPrice(product.price)}
          </span>
        </div>
        <AddToCartButton product={product} icon="add_shopping_cart" size="sm" tone="solid" />
      </div>
    </article>
  );
}

/** Catalogue desktop card (all-products-desktop: 3-up grid). */
export function CatalogCard({ product, priority }: { product: Product; priority?: boolean }) {
  return (
    <article
      data-testid="product-card"
      className="group relative flex w-full flex-col overflow-hidden rounded-2xl bg-surface-container-lowest shadow-sm transition-all hover:shadow-md"
    >
      <div className="relative aspect-[16/10] w-full">
        <ProductImage
          product={product}
          sizes="(min-width:1024px) 420px, (min-width:768px) 50vw, 100vw"
          imgClassName="transition-transform duration-500 group-hover:scale-105"
          priority={priority}
        />
        <span className="absolute left-3 top-3 rounded-full bg-surface-container-lowest/90 px-2.5 py-1 text-label-sm uppercase tracking-wider text-secondary backdrop-blur-md">
          {product.origin}
        </span>
        <FavoriteButton product={product} className="absolute right-3 top-3" size={32} />
        {product.badge && (
          <span className="absolute bottom-3 right-3 rounded-full bg-primary-container px-2.5 py-0.5 text-label-sm text-on-primary">
            {product.badge}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col justify-between p-5">
        <div>
          <div className="mb-1.5 flex items-start justify-between gap-3">
            <h3 className="text-headline-sm font-semibold text-primary transition-colors group-hover:text-primary-container">
              <Link href={href(product)} className="after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-primary-container">
                {product.name}
              </Link>
            </h3>
            <span className="whitespace-nowrap text-headline-sm font-bold text-primary" data-testid="product-price">
              {formatPrice(product.price)}
            </span>
          </div>
          <p className="line-clamp-2 text-body-md text-on-surface-variant">{product.description}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {product.tags.map((t) => (
              <span key={t.label} className="inline-flex items-center gap-1 rounded bg-surface-container px-2 py-0.5 text-label-sm font-semibold normal-case tracking-normal text-on-surface-variant">
                {t.icon && <Icon name={t.icon} size={13} className="text-primary" />} {t.label}
              </span>
            ))}
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-outline-variant/20 pt-5">
          <span className="text-label-sm uppercase tracking-wide text-secondary">{product.pairing}</span>
          <AddToCartButton product={product} />
        </div>
      </div>
    </article>
  );
}

/** Mobile 2-up compact card (home-page-mobile / all-products-mobile). */
export function CompactCard({ product, priority, variant = "home" }: { product: Product; priority?: boolean; variant?: "home" | "menu" }) {
  return (
    <article
      data-testid="product-card"
      className="group relative flex min-w-0 flex-col rounded-[20px] bg-surface-container-lowest p-2.5 shadow-soft"
    >
      <div className="mb-1.5 flex min-w-0 items-center justify-between gap-1">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-label-lg font-bold text-on-surface">
            <Link href={href(product)} className="after:absolute after:inset-0 after:rounded-[20px]">
              {product.shortName}
            </Link>
          </h3>
          <div className="flex min-w-0 items-center gap-1 text-label-md">
            <Icon name="star" size={14} className="text-secondary" />
            <span className="font-bold text-on-surface">{product.rating.toFixed(1)}</span>
            {variant === "home" && <span className="truncate text-[11px] font-normal text-outline">• {product.locality}</span>}
          </div>
          {variant === "menu" && (
            <div className="mt-0.5 flex items-center gap-0.5 truncate text-[11px] text-on-surface-variant">
              <Icon name="location_on" size={13} className="text-outline" />
              {product.locality}
            </div>
          )}
        </div>
        <span aria-hidden className="grid size-7 shrink-0 place-items-center rounded-full bg-surface-container-low text-on-surface-variant">
          <Icon name="arrow_forward" size={16} />
        </span>
      </div>
      <div className="relative mb-2 h-32 overflow-hidden rounded-2xl">
        <ProductImage
          product={product}
          sizes="50vw"
          imgClassName="transition-transform duration-300 group-hover:scale-105"
          priority={priority}
        />
        <FavoriteButton product={product} className="absolute right-2 top-2" />
      </div>
      <div className="mt-auto flex flex-wrap items-end justify-between gap-x-1 gap-y-2 pt-1">
        <div className="flex min-w-0 flex-col">
          <span className="text-[10px] font-bold uppercase tracking-wider text-outline">Prix</span>
          <span className="whitespace-nowrap text-[15px] font-bold leading-tight text-primary xs:text-[17px]" data-testid="product-price">
            {formatNumber(product.price)} <span className="text-[11px] font-semibold text-outline">DA</span>
          </span>
        </div>
        <AddToCartButton product={product} size="xs" shape="pill" />
      </div>
    </article>
  );
}
