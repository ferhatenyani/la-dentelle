"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { CATEGORIES, LABELS, SORTS, type SortId } from "@/lib/data/catalog";
import { DEFAULT_QUERY, filterProducts, isDefaultQuery, parseQuery, serializeQuery, type CatalogueQuery } from "@/lib/catalogue";
import type { CategoryId, LabelId } from "@/lib/types";
import { useOnHide } from "@/lib/use-on-hide";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import { Sheet } from "@/components/ui/Sheet";
import { CatalogCard, CompactCard } from "@/components/product/ProductCard";

/** Quick label toggles shown on mobile (all-products-mobile). */
const MOBILE_LABELS: { id: LabelId; name: string; icon: string; on: string; off: string }[] = [
  { id: "terroir", name: "Terroir Algérien", icon: "verified", on: "bg-secondary text-on-secondary", off: "bg-secondary-fixed/50 text-secondary" },
  { id: "halal", name: "100% Halal Frais", icon: "task_alt", on: "bg-primary text-on-primary", off: "bg-primary-fixed text-on-primary-fixed-variant" },
  { id: "sans-gluten", name: "Options Sans Gluten", icon: "eco", on: "bg-on-surface-variant text-white", off: "bg-surface-container text-on-surface-variant" },
];

function useCatalogueQuery() {
  const params = useSearchParams();
  const query = useMemo(() => parseQuery(new URLSearchParams(params.toString())), [params]);
  const [q, setQ] = useState(query.q);
  const focused = useRef(false);

  // Keep the search box in sync when the URL changes from outside (e.g. header search link).
  useEffect(() => {
    if (!focused.current) setQ(query.q);
  }, [query.q]);

  const update = (patch: Partial<CatalogueQuery>) => {
    const next = { ...query, q, ...patch };
    // Shallow URL update: no server round-trip, keeps filters shareable & restorable.
    window.history.replaceState(null, "", `/menu${serializeQuery(next)}`);
  };

  return {
    query: { ...query, q },
    setSearch: (value: string) => {
      setQ(value);
      update({ q: value });
    },
    update,
    reset: () => {
      setQ("");
      window.history.replaceState(null, "", "/menu");
    },
    setFocused: (v: boolean) => {
      focused.current = v;
    },
  };
}

function SearchInput({
  value,
  onChange,
  onFocusChange,
  placeholder,
  className,
  inputClassName,
}: {
  value: string;
  onChange: (v: string) => void;
  onFocusChange: (focused: boolean) => void;
  placeholder: string;
  className?: string;
  inputClassName?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (window.location.hash === "#recherche" && ref.current?.offsetParent) ref.current.focus();
  }, []);
  return (
    <div className={cn("relative", className)}>
      <Icon name="search" size={20} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-outline" />
      <input
        ref={ref}
        type="search"
        aria-label="Rechercher un plat"
        value={value}
        onFocus={() => onFocusChange(true)}
        onBlur={() => onFocusChange(false)}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full bg-surface-container-lowest pl-10 pr-9 text-on-surface outline-none placeholder:text-outline [&::-webkit-search-cancel-button]:hidden",
          inputClassName,
        )}
      />
      {value && (
        <button
          type="button"
          aria-label="Effacer la recherche"
          onClick={() => onChange("")}
          className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full text-outline hover:bg-surface-container hover:text-primary"
        >
          <Icon name="close" size={18} />
        </button>
      )}
    </div>
  );
}

function CategoryPills({ value, onChange, mobile }: { value: CategoryId | "all"; onChange: (c: CategoryId | "all") => void; mobile?: boolean }) {
  const items: { id: CategoryId | "all"; name: string }[] = [
    { id: "all", name: mobile ? "Tous les Mets" : "Toutes nos créations" },
    ...CATEGORIES.map((c) => ({ id: c.id, name: c.name })),
  ];
  return (
    <div role="group" aria-label="Catégories" className={cn("no-scrollbar flex items-center gap-1.5 overflow-x-auto", mobile ? "-mx-4 px-4 pb-1 xs:-mx-margin xs:px-margin" : "pb-0.5")}>
      {items.map((c) => {
        const active = value === c.id;
        return (
          <button
            key={c.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(c.id)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 whitespace-nowrap px-4 py-2 text-label-md shadow-sm transition",
              mobile ? "rounded-full" : "rounded-xl",
              active
                ? "bg-primary font-bold text-on-primary shadow-primary/20"
                : mobile
                  ? "bg-surface-container-lowest font-medium text-on-surface-variant hover:bg-surface-container"
                  : "border border-outline-variant/40 bg-surface-container-lowest font-medium text-on-surface-variant hover:border-primary/40 hover:text-primary",
            )}
          >
            {mobile && c.id === "all" && <Icon name="dinner_dining" size={16} />}
            {c.name}
          </button>
        );
      })}
    </div>
  );
}

function LabelFilters({ value, onToggle, onClear }: { value: LabelId[]; onToggle: (l: LabelId) => void; onClear: () => void }) {
  return (
    <div role="group" aria-label="Labels" className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        aria-pressed={value.length === 0}
        onClick={onClear}
        className={cn(
          "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-label-md shadow-sm transition",
          value.length === 0 ? "bg-primary-container font-semibold text-on-primary" : "border border-outline-variant/40 bg-surface-container-lowest font-medium text-on-surface-variant hover:border-primary hover:text-primary",
        )}
      >
        Tous les labels
      </button>
      {LABELS.map((l) => {
        const active = value.includes(l.id);
        return (
          <button
            key={l.id}
            type="button"
            aria-pressed={active}
            onClick={() => onToggle(l.id)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-label-md shadow-sm transition",
              active ? "bg-primary-container font-semibold text-on-primary" : "border border-outline-variant/40 bg-surface-container-lowest font-medium text-on-surface-variant hover:border-primary hover:text-primary",
            )}
          >
            {l.icon ? <Icon name={l.icon} size={14} className={active ? "" : "text-secondary"} /> : <span className={cn("size-2 rounded-full", active ? "bg-white" : l.dot)} />}
            {l.name}
            {active && <Icon name="close" size={14} />}
          </button>
        );
      })}
    </div>
  );
}

function SortSelect({ value, onChange, id }: { value: SortId; onChange: (s: SortId) => void; id: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-outline-variant/40 bg-surface-container-lowest py-1 pl-3 pr-1 shadow-sm">
      <Icon name="tune" size={18} className="text-outline" />
      <label htmlFor={id} className="whitespace-nowrap text-label-sm uppercase tracking-wider text-on-surface-variant">
        Trier :
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as SortId)}
        className="h-8 cursor-pointer rounded-lg bg-transparent pl-1 pr-2 text-label-md font-semibold text-primary outline-none focus-visible:ring-2 focus-visible:ring-primary-container"
      >
        {SORTS.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export function Catalogue() {
  const router = useRouter();
  const { query, setSearch, update, reset, setFocused } = useCatalogueQuery();
  const results = useMemo(() => filterProducts(query), [query]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  useOnHide(() => setFiltersOpen(false));
  const activeCount = query.labels.length + (query.sort !== "popularite" ? 1 : 0);
  const toggleLabel = (l: LabelId) => update({ labels: query.labels.includes(l) ? query.labels.filter((x) => x !== l) : [...query.labels, l] });

  const empty = (
    <EmptyState
      icon="search_off"
      title="Aucune création ne correspond"
      description={query.q ? <>Aucun résultat pour « {query.q} » avec ces filtres. Essayez un autre mot-clé ou retirez un label.</> : "Essayez de retirer un label ou de changer de catégorie."}
      action={
        <Button icon="restart_alt" onClick={reset}>
          Réinitialiser les filtres
        </Button>
      }
      className="col-span-full"
    />
  );

  return (
    <>
      {/* ------------------------------------------------ Desktop (all-products-desktop) */}
      <div className="hidden md:block">
        <div className="sticky top-20 z-30 border-y border-outline-variant/25 bg-surface/95 py-4 shadow-[0_4px_20px_rgba(0,68,61,0.04)] backdrop-blur-xl">
          <div className="mx-auto flex max-w-[1320px] flex-col gap-3.5 px-6">
            <CategoryPills value={query.category} onChange={(category) => update({ category })} />
            <div className="flex items-center justify-between gap-3 pt-1">
              <SearchInput
                value={query.q}
                onChange={setSearch}
                onFocusChange={setFocused}
                placeholder="Rechercher Rechta, Chorba, Makrout, Bourek..."
                className="max-w-xl flex-1"
                inputClassName="h-10 rounded-xl border border-outline-variant/40 text-body-md shadow-sm focus:border-primary-container focus:ring-1 focus:ring-primary-container/20"
              />
              <div className="flex shrink-0 items-center gap-3">
                {!isDefaultQuery(query) && (
                  <button type="button" onClick={reset} className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-label-md font-semibold text-error transition-colors hover:bg-error-container/40">
                    <Icon name="restart_alt" size={17} /> Réinitialiser
                  </button>
                )}
                <SortSelect id="sort-desktop" value={query.sort} onChange={(sort) => update({ sort })} />
              </div>
            </div>
            <div className="flex items-start gap-3 border-t border-outline-variant/15 pt-3">
              <span className="mt-1.5 flex shrink-0 items-center gap-1 text-label-sm uppercase tracking-wider text-outline">
                <Icon name="label" size={16} className="text-secondary" /> Labels :
              </span>
              <div className="flex-1">
                <LabelFilters value={query.labels} onToggle={toggleLabel} onClear={() => update({ labels: [] })} />
              </div>
              <p className="mt-1.5 hidden shrink-0 text-label-sm normal-case tracking-normal text-outline lg:block" aria-live="polite">
                <span className="mr-1 font-bold text-primary" data-testid="results-count">
                  {results.length}
                </span>
                création{results.length > 1 ? "s" : ""} affichée{results.length > 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>
        <div className="mx-auto max-w-[1320px] px-6 pb-24 pt-6">
          <div className="grid grid-cols-2 gap-6 lg:grid-cols-3" data-testid="catalogue-grid">
            <AnimatePresence mode="popLayout" initial={false}>
              {results.map((p, i) => (
                <motion.div
                  key={p.slug}
                  layout
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                  className="flex"
                >
                  <CatalogCard product={p} priority={i < 3} />
                </motion.div>
              ))}
            </AnimatePresence>
            {results.length === 0 && empty}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------ Mobile (all-products-mobile) */}
      <div className="px-4 xs:px-margin md:hidden">
        <div className="mb-2 flex items-center justify-between gap-2 py-2">
          <button
            type="button"
            aria-label="Retour à l'accueil"
            onClick={() => router.push("/")}
            className="grid size-10 shrink-0 place-items-center rounded-full bg-surface-container-lowest text-primary shadow-sm hover:bg-surface-container"
          >
            <Icon name="arrow_back" size={20} />
          </button>
          <div className="flex min-w-0 flex-col items-center text-center">
            <span className="text-label-sm uppercase tracking-widest text-secondary">Sélection du Chef</span>
            <h1 className="truncate text-headline-sm font-semibold text-primary">Carte Gastronomique</h1>
          </div>
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-secondary-fixed px-2 py-1 text-label-md text-on-secondary-fixed-variant shadow-sm">
            <span className="size-1.5 rounded-full bg-secondary" />
            <span data-testid="results-count-mobile">{String(results.length).padStart(2, "0")}</span> Mets
          </span>
        </div>
        <div className="mb-4 flex items-center gap-2">
          <SearchInput
            value={query.q}
            onChange={setSearch}
            onFocusChange={setFocused}
            placeholder="Rechercher un mets, épice..."
            className="flex-1"
            inputClassName="h-11 rounded-full text-body-sm shadow-sm focus:ring-2 focus:ring-primary-container/30"
          />
          <button
            type="button"
            aria-label="Filtres et tri"
            onClick={() => setFiltersOpen(true)}
            className="relative grid size-11 shrink-0 place-items-center rounded-full bg-surface-container-high text-primary shadow-sm active:scale-95"
          >
            <Icon name="tune" size={20} />
            {activeCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid size-5 place-items-center rounded-full bg-secondary text-[10px] font-bold text-on-secondary">{activeCount}</span>
            )}
          </button>
        </div>
        <div className="mb-2">
          <CategoryPills mobile value={query.category} onChange={(category) => update({ category })} />
        </div>
        <div className="no-scrollbar -mx-4 mb-4 flex items-center gap-2 overflow-x-auto px-4 xs:-mx-margin xs:px-margin">
          {MOBILE_LABELS.map((l) => {
            const active = query.labels.includes(l.id);
            return (
              <button
                key={l.id}
                type="button"
                aria-pressed={active}
                onClick={() => toggleLabel(l.id)}
                className={cn("flex h-8 shrink-0 items-center gap-1 rounded-full px-3 text-label-sm uppercase tracking-wider transition-colors", active ? l.on : l.off)}
              >
                <Icon name={active ? "check" : l.icon} size={14} />
                {l.name}
              </button>
            );
          })}
        </div>
        <div
          key={`${query.category}|${query.labels.join(",")}|${query.sort}`}
          className="animate-swap-in grid grid-cols-2 gap-3"
          data-testid="catalogue-grid-mobile"
        >
          {results.map((p, i) => (
            <CompactCard key={p.slug} product={p} variant="menu" priority={i < 4} />
          ))}
          {results.length === 0 && empty}
        </div>
        <Link
          href="/menu?categorie=boissons"
          onClick={(e) => {
            e.preventDefault();
            update({ ...DEFAULT_QUERY, category: "boissons" });
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="mt-4 flex items-center justify-between rounded-xl bg-gradient-to-r from-primary-container to-primary p-4 text-on-primary shadow-md"
        >
          <span className="flex min-w-0 items-center gap-2 pr-2">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-secondary-fixed text-on-secondary-fixed shadow">
              <Icon name="local_cafe" fill size={20} />
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="text-[10px] font-bold uppercase tracking-widest text-secondary-fixed">Rituel de Clôture</span>
              <span className="truncate text-[15px] font-semibold">Thé à la Menthe &amp; Cherbet</span>
            </span>
          </span>
          <span className="whitespace-nowrap rounded-full bg-white/20 px-3 py-1 text-[12px] font-semibold backdrop-blur-md">Dès 250 DA</span>
        </Link>
      </div>

      <Sheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Filtres & tri"
        description={`${results.length} création${results.length > 1 ? "s" : ""} correspondent`}
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={reset}>
              Réinitialiser
            </Button>
            <Button className="flex-1" onClick={() => setFiltersOpen(false)}>
              Voir {results.length} résultat{results.length > 1 ? "s" : ""}
            </Button>
          </div>
        }
      >
        <div className="space-y-6 pb-2">
          <fieldset>
            <legend className="mb-2 text-label-md font-bold">Trier par</legend>
            <div className="grid grid-cols-2 gap-2">
              {SORTS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  aria-pressed={query.sort === s.id}
                  onClick={() => update({ sort: s.id })}
                  className={cn(
                    "rounded-xl px-3 py-2.5 text-left text-label-md transition-colors",
                    query.sort === s.id ? "bg-primary text-on-primary" : "bg-surface-container-low text-on-surface-variant",
                  )}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="mb-2 text-label-md font-bold">Labels</legend>
            <LabelFilters value={query.labels} onToggle={toggleLabel} onClear={() => update({ labels: [] })} />
          </fieldset>
        </div>
      </Sheet>
    </>
  );
}

export function CatalogueSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1320px] px-4 py-6 md:px-6" aria-busy="true" aria-label="Chargement de la carte">
      <div className="mb-6 flex gap-2 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-9 w-36 shrink-0 animate-pulse rounded-xl bg-surface-container" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 md:gap-6 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-72 animate-pulse rounded-2xl bg-surface-container md:h-[420px]" />
        ))}
      </div>
    </div>
  );
}
