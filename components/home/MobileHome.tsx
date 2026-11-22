"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CATEGORIES } from "@/lib/data/catalog";
import { getProduct } from "@/lib/data/products";
import { useSessionUser } from "@/lib/store/hooks";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { toast } from "@/components/ui/Toast";
import { CompactCard } from "@/components/product/ProductCard";
import { inputClasses } from "@/components/ui/Field";
import { useOnHide } from "@/lib/use-on-hide";

const SIGNATURES = ["matlouh-agneau-confit", "rechta-imperiale", "makrout-el-louz-dziriettes", "chorba-frik-boureks"];
const CHIP_IMAGES: Record<string, string> = {
  sandwiches: "/images/products/matlouh-agneau-1.jpg",
  plats: "/images/products/couscous-1.jpg",
  douceurs: "/images/products/makrout-dziriettes-1.jpg",
  entrees: "/images/products/trio-boureks-1.jpg",
};

function Greeting() {
  const user = useSessionUser();
  return (
    <div className="mb-4 flex items-center justify-between">
      <div className="flex min-w-0 items-center gap-2">
        <div className="relative size-12 shrink-0 overflow-hidden rounded-full bg-surface-container shadow-sm">
          {user?.id === "u-amine" ? (
            <Image src="/images/avatar-amine.jpg" alt="" fill sizes="48px" className="object-cover" />
          ) : (
            <span className="grid size-full place-items-center bg-primary-container text-label-lg font-bold text-on-primary">
              {user ? `${user.firstName[0]}${user.lastName[0] ?? ""}` : <Icon name="person" />}
            </span>
          )}
          <span className="absolute bottom-0 right-0 size-3 rounded-full bg-secondary ring-2 ring-surface" />
        </div>
        <div className="flex min-w-0 flex-col">
          <span className="text-label-md text-on-surface-variant">Sabah El Kheir</span>
          {user ? (
            <span className="truncate text-headline-sm font-bold tracking-tight text-primary" data-testid="greeting-name">
              {user.firstName} {user.lastName}
            </span>
          ) : (
            <Link href="/connexion" className="text-headline-sm font-bold tracking-tight text-primary underline-offset-4 hover:underline">
              Se connecter
            </Link>
          )}
        </div>
      </div>
      <Link
        href="/menu"
        aria-label="Filtrer la carte"
        className="grid size-10 place-items-center rounded-full bg-surface-container-lowest text-primary shadow-sm active:scale-95"
      >
        <Icon name="tune" size={20} />
      </Link>
    </div>
  );
}

function SalonSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [guests, setGuests] = useState("6");
  const [date, setDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Réserver un Salon Privé"
      description="Notre maître d'hôtel vous rappelle sous 30 minutes pour confirmer."
      footer={
        <Button
          className="w-full"
          size="lg"
          icon="calendar_month"
          onClick={() => {
            if (!date) return setError("Choisissez une date de réception.");
            setError(null);
            onClose();
            toast({ title: "Demande envoyée", description: `Salon privé pour ${guests} convives — nous vous rappelons.`, icon: "table_restaurant" });
          }}
        >
          Envoyer la demande
        </Button>
      }
    >
      <div className="space-y-4 pb-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-label-md font-bold">Date de réception</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClasses} aria-invalid={!!error || undefined} />
          {error && <span className="text-body-sm text-error">{error}</span>}
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-label-md font-bold">Nombre de convives</span>
          <select value={guests} onChange={(e) => setGuests(e.target.value)} className={inputClasses}>
            {["4", "6", "8", "10", "12", "16"].map((n) => (
              <option key={n} value={n}>
                {n} convives
              </option>
            ))}
          </select>
        </label>
      </div>
    </Sheet>
  );
}

/** Mobile home (home-page-mobile). */
export function MobileHome() {
  const router = useRouter();
  const [salonOpen, setSalonOpen] = useState(false);
  useOnHide(() => setSalonOpen(false));
  const [q, setQ] = useState("");
  const hero = getProduct("tajine-lham-lahlou")!;

  return (
    <div className="flex flex-col px-4 pt-2 xs:px-margin md:hidden">
      <Greeting />

      <form
        role="search"
        className="mb-4"
        onSubmit={(e) => {
          e.preventDefault();
          router.push(q.trim() ? `/menu?q=${encodeURIComponent(q.trim())}` : "/menu");
        }}
      >
        <label className="flex h-12 w-full items-center gap-2 rounded-full bg-surface-container-lowest px-4 shadow-card transition-shadow focus-within:shadow-md">
          <Icon name="search" size={22} className="text-outline" />
          <span className="sr-only">Rechercher un plat</span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher un plat, rechta, matlouh..."
            className="w-full bg-transparent text-body-md text-on-surface outline-none placeholder:text-outline"
          />
        </label>
      </form>

      <div className="relative mb-4 overflow-hidden rounded-3xl bg-primary p-4 text-on-primary shadow-[0_12px_28px_-6px_rgba(0,68,61,0.28)]">
        <div aria-hidden className="pointer-events-none absolute -right-12 -top-12 size-48 rounded-full bg-primary-container/30 blur-2xl" />
        <div className="relative z-10 flex items-center justify-between gap-2">
          <div className="flex min-w-0 flex-1 flex-col pr-1">
            <div className="mb-1.5 flex items-center gap-1.5">
              <Icon name="local_fire_department" size={18} className="text-secondary-container" />
              <span className="text-label-sm uppercase tracking-wider text-secondary-container">Offre Signature Privilège</span>
            </div>
            <h2 className="mb-1 text-headline-sm font-bold leading-tight">
              Dégustation Royale du Soir <span className="text-secondary-fixed">-30%</span>
            </h2>
            <p className="mb-4 line-clamp-2 text-body-sm text-primary-fixed-dim">Menu 5 temps élaboré avec le safran pur de Tizi Ouzou.</p>
            <Link
              href="/menu"
              className="inline-flex h-10 w-fit items-center gap-1 rounded-full bg-surface-container-lowest px-4 text-label-lg text-primary shadow-sm active:scale-95"
            >
              Découvrir la Carte <Icon name="arrow_forward" size={16} />
            </Link>
          </div>
          <div className="relative size-28 shrink-0 rounded-full bg-gradient-to-tr from-secondary/50 via-primary-fixed-dim/30 to-secondary-container p-1 shadow-md">
            <div className="relative size-full overflow-hidden rounded-full">
              <Image src={hero.images[0]} alt={hero.name} fill sizes="112px" className="object-cover" loading="eager" />
            </div>
            <span className="absolute -bottom-1 -right-1 whitespace-nowrap rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold text-on-secondary shadow-sm">
              Édition Chef
            </span>
          </div>
        </div>
      </div>

      <div className="no-scrollbar -mx-4 mb-4 flex items-center gap-2 overflow-x-auto px-4 xs:-mx-margin xs:px-margin">
        <Link href="/menu" className="flex h-11 shrink-0 items-center gap-1 rounded-full bg-primary px-4 text-on-primary shadow-sm active:scale-95">
          <span className="grid size-6 place-items-center rounded-full bg-white/20">
            <Icon name="restaurant" size={16} className="text-secondary-fixed" />
          </span>
          <span className="text-label-lg font-bold">Tous</span>
        </Link>
        {CATEGORIES.filter((c) => CHIP_IMAGES[c.id]).map((c) => (
          <Link
            key={c.id}
            href={`/menu?categorie=${c.id}`}
            className="flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-surface-container-lowest pl-2.5 pr-4 text-on-surface shadow-[0_2px_10px_rgba(0,0,0,0.03)] active:scale-95"
          >
            <span className="relative size-6 shrink-0 overflow-hidden rounded-full">
              <Image src={CHIP_IMAGES[c.id]} alt="" fill sizes="24px" className="object-cover" />
            </span>
            <span className="text-label-lg">{c.short}</span>
          </Link>
        ))}
      </div>

      <Link
        href="/menu"
        className="mb-6 flex h-12 w-full items-center justify-center gap-1 rounded-full bg-on-surface text-label-lg text-surface-container-lowest shadow-md active:scale-[0.98]"
      >
        Explorer toute la Carte <Icon name="arrow_forward_ios" size={16} />
      </Link>

      <div className="mb-2 flex items-end justify-between gap-2">
        <div className="flex min-w-0 flex-col">
          <h2 className="text-headline-sm font-bold text-primary">Nos Signatures du Terroir</h2>
          <span className="text-body-sm text-on-surface-variant">Recettes séculaires revisitées par la Cheffe</span>
        </div>
        <Link href="/menu" className="flex shrink-0 items-center text-label-md font-bold text-secondary">
          Voir tout <Icon name="chevron_right" size={16} />
        </Link>
      </div>
      <div className="mb-6 grid grid-cols-2 gap-2">
        {SIGNATURES.map((slug, i) => (
          <CompactCard key={slug} product={getProduct(slug)!} priority={i < 2} />
        ))}
      </div>

      <div className="flex items-center gap-3 rounded-3xl bg-secondary-fixed/40 p-4 shadow-sm">
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-secondary text-on-secondary shadow-sm">
          <Icon name="table_restaurant" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-label-lg font-bold text-on-surface">Réserver un Salon Privé</span>
          <span className="text-body-sm text-on-surface-variant">Pour vos dîners d&apos;exception sous les alcôves</span>
        </div>
        <button
          type="button"
          onClick={() => setSalonOpen(true)}
          className="h-9 shrink-0 rounded-full bg-primary px-4 text-label-md font-semibold text-on-primary active:scale-95"
        >
          Choisir
        </button>
      </div>
      <SalonSheet open={salonOpen} onClose={() => setSalonOpen(false)} />
    </div>
  );
}
