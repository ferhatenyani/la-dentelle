"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { RESTAURANT } from "@/lib/data/catalog";
import { getProduct } from "@/lib/data/products";
import { formatPhone, formatPrice } from "@/lib/format";
import { logout } from "@/lib/store/actions";
import { useSessionUser, useUserOrders } from "@/lib/store/hooks";
import { useAppState, useHydrated } from "@/lib/store/store";
import { communeName } from "@/lib/tracking";
import { useOnHide } from "@/lib/use-on-hide";
import type { Address, UserProfile } from "@/lib/types";
import { Icon } from "@/components/ui/Icon";
import { PageSkeleton } from "@/components/ui/States";
import { Sheet } from "@/components/ui/Sheet";
import { toast } from "@/components/ui/Toast";
import { AddToCartButton } from "@/components/product/ProductActions";
import { ProductImage } from "@/components/product/ProductImage";
import { ActiveOrderCard, ActiveOrderHero, isActive, OrderHistoryRow, useNow } from "@/components/orders/OrderParts";
import { AddressesPanel, AddressSheet, CHANGE_LABELS, PaymentPanel, PreferencesPanel, ProfileSheet } from "./AccountPanels";

/** Set while the user deliberately signs out, so guards don't bounce them to /connexion. */
let signingOut = false;

/** Redirects to /connexion when there is no session (after hydration). */
export function useRequireUser(next: string) {
  const hydrated = useHydrated();
  const user = useSessionUser();
  const router = useRouter();
  useEffect(() => {
    if (user) signingOut = false;
    else if (hydrated && !signingOut) router.replace(`/connexion?next=${encodeURIComponent(next)}`);
  }, [hydrated, user, router, next]);
  return hydrated ? user : null;
}

function Avatar({ user, size = 64 }: { user: UserProfile; size?: number }) {
  return (
    <span className="relative shrink-0" style={{ width: size, height: size }}>
      {user.id === "u-amine" ? (
        <Image src="/images/avatar-amine.jpg" alt="" fill sizes={`${size}px`} className="rounded-full object-cover" />
      ) : (
        <span className="grid size-full place-items-center rounded-full bg-primary-container text-headline-sm font-bold text-on-primary">
          {user.firstName[0]}
          {user.lastName[0] ?? ""}
        </span>
      )}
      <span className="absolute -bottom-0.5 -right-0.5 grid size-6 place-items-center rounded-full bg-secondary text-on-secondary ring-2 ring-surface-container-lowest">
        <Icon name="stars" size={14} />
      </span>
    </span>
  );
}

function Card({ title, icon, aside, children, className }: { title: string; icon: string; aside?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-2xl bg-surface-container-lowest p-5 shadow-card md:p-6", className)} aria-label={title}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-headline-sm font-semibold text-primary">
          <Icon name={icon} /> {title}
        </h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

function Favorites({ compact }: { compact?: boolean }) {
  const { favorites } = useAppState();
  const products = favorites.map(getProduct).filter((p) => !!p);
  if (products.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-outline-variant bg-surface-container-lowest p-6 text-center text-body-sm text-on-surface-variant">
        Épinglez vos plats préférés avec le <Icon name="favorite" size={16} className="align-text-bottom text-error" /> pour les retrouver ici.
        <Link href="/menu" className="mt-2 block font-bold text-primary">
          Parcourir la carte
        </Link>
      </div>
    );
  }
  return (
    <div className={cn("grid gap-3", compact ? "grid-cols-2" : "grid-cols-2 lg:grid-cols-3")}>
      {products.slice(0, 6).map((p) => (
        <div key={p.slug} className="overflow-hidden rounded-xl bg-surface-container-lowest shadow-card">
          <Link href={`/menu/${p.slug}`} className="relative block aspect-[16/10]">
            <ProductImage product={p} sizes="240px" />
            <span className="absolute right-2 top-2 rounded-full bg-surface-container-lowest/90 px-2 py-0.5 text-[10px] font-bold text-primary">{formatPrice(p.price)}</span>
          </Link>
          <div className="p-3">
            <p className="truncate text-label-lg text-on-surface">{p.shortName}</p>
            <p className="mb-2 line-clamp-2 text-[11px] text-on-surface-variant">{p.description}</p>
            <AddToCartButton product={p} size="xs" icon="add_shopping_cart" label="Commander" className="w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AccountView() {
  const user = useRequireUser("/compte");
  const orders = useUserOrders();
  const now = useNow();
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(0);
  const [editing, setEditing] = useState<{ address: Address | null; n: number } | null>(null);
  const [panel, setPanel] = useState<null | "addresses" | "preferences" | "payment">(null);
  useOnHide(() => {
    setProfileOpen(0);
    setEditing(null);
    setPanel(null);
  });

  if (!user) return <PageSkeleton />;

  const active = orders.find((o) => isActive(o, now));
  const history = orders.filter((o) => o !== active);
  const openAddress = (address: Address | null) => setEditing({ address, n: Date.now() });
  const signOut = () => {
    signingOut = true;
    logout();
    toast({ title: "À bientôt !", description: "Vous êtes déconnecté.", tone: "info", icon: "logout" });
    router.push("/");
  };
  const fullName = `${user.firstName} ${user.lastName}`.trim();

  return (
    <>
      {/* =============================================== Desktop (orders-desktop) */}
      <div className="hidden md:block">
        <div className="bg-gradient-to-br from-surface via-surface to-secondary-fixed/30 pb-10 pt-6">
          <div className="mx-auto max-w-[1280px] px-6">
            <div className="mb-6 flex items-center justify-between">
              <nav aria-label="Fil d'Ariane" className="flex items-center gap-1 text-label-md text-on-surface-variant">
                <Link href="/" className="hover:text-primary">
                  Accueil
                </Link>
                <Icon name="chevron_right" size={16} />
                <span className="font-bold text-on-surface">Espace Privilège Gastronome</span>
              </nav>
              <span className="flex items-center gap-2 rounded-full bg-surface-container-lowest px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-on-surface shadow-sm">
                <span className="size-2 rounded-full bg-primary-container" /> Compte actif • Alger
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-6 rounded-2xl bg-surface-container-lowest p-6 shadow-card lg:p-8">
              <div className="flex items-center gap-6">
                <Avatar user={user} size={72} />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-headline-md font-semibold text-on-surface" data-testid="profile-name">
                      {fullName}
                    </h1>
                    <span className="rounded-full bg-secondary-container px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-on-secondary-fixed">Membre Gourmet Privilège</span>
                  </div>
                  <p className="mt-1 text-body-sm text-on-surface-variant">
                    {user.addresses[0] ? communeName(user.addresses[0].commune).split(" / ")[0] : "Alger"}, Alger • Client d&apos;honneur depuis {new Date(user.memberSince).getUTCFullYear()}
                  </p>
                  <p className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-body-sm text-on-surface">
                    <span className="flex items-center gap-1.5" data-testid="profile-phone">
                      <Icon name="phone_iphone" size={16} /> +213 {formatPhone(user.phone)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Icon name="mail" size={16} /> {user.email}
                    </span>
                    <button type="button" onClick={() => setProfileOpen(Date.now())} className="flex items-center gap-1 font-bold text-primary hover:underline">
                      <Icon name="edit" size={16} /> Modifier mes informations
                    </button>
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Points privilège</p>
                <p className="text-display font-bold text-primary" data-testid="points">
                  {user.points}
                  <span className="ml-1 text-label-md text-secondary">PTS</span>
                </p>
                <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-secondary-fixed/50 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-on-secondary-fixed-variant">
                  <Icon name="redeem" size={14} /> Palier atteint : {Math.floor(user.points / 480) * 1000 || 500} DA déductibles
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-8 px-6 pb-16 lg:grid-cols-12">
          <div className="flex flex-col gap-8 lg:col-span-7">
            {active && (
              <section aria-label="Commande en cours">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-headline-sm font-semibold text-primary">
                    <span className="size-2 rounded-full bg-tertiary-container" /> Commande en cours
                  </h2>
                </div>
                <ActiveOrderCard order={active} now={now} />
              </section>
            )}
            <section aria-label="Historique des commandes">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-headline-sm font-semibold text-primary">Historique des Commandes</h2>
                <Link href="/compte/commandes" className="flex items-center gap-1 text-label-md text-on-surface hover:text-primary">
                  Tout afficher ({orders.length}) <Icon name="arrow_forward" size={16} />
                </Link>
              </div>
              {history.length ? (
                <ul className="flex flex-col gap-3">
                  {history.slice(0, 3).map((o) => (
                    <OrderHistoryRow key={o.id} order={o} now={now} />
                  ))}
                </ul>
              ) : (
                <p className="rounded-2xl bg-surface-container-lowest p-6 text-body-sm text-on-surface-variant shadow-card">Aucune commande passée pour le moment.</p>
              )}
            </section>
            <section aria-label="Vos créations favorites">
              <h2 className="mb-3 text-headline-sm font-semibold text-primary">Vos Créations Favorites</h2>
              <Favorites />
            </section>
          </div>

          <div className="flex flex-col gap-6 lg:col-span-5">
            <section className="relative overflow-hidden rounded-2xl bg-primary p-6 text-on-primary shadow-float">
              <span aria-hidden className="absolute -bottom-10 -right-10 size-40 rounded-full border-[14px] border-white/5" />
              <p className="flex items-center gap-2 text-label-sm uppercase tracking-wider text-secondary-container">
                <Icon name="workspace_premium" size={18} /> Ligne privilège membre
              </p>
              <h2 className="mt-2 text-headline-sm font-bold">Conciergerie &amp; Salons Privés</h2>
              <p className="mt-2 text-body-sm text-primary-fixed-dim">
                Accès prioritaire à notre salon mauresque privatisable à Hydra. Dégustations sur mesure et maître d&apos;hôtel dédié pour vos réceptions.
              </p>
              <a href="tel:+21321484950" className="mt-4 flex items-center justify-between rounded-xl bg-white/10 px-4 py-3 text-label-lg hover:bg-white/15">
                <span className="flex items-center gap-2">
                  <Icon name="support_agent" size={20} /> {RESTAURANT.concierge}
                </span>
                <span className="rounded bg-secondary-container px-1.5 py-0.5 text-[10px] font-bold text-on-secondary-fixed">24/7 VIP</span>
              </a>
              <button
                type="button"
                onClick={() => toast({ title: "Demande envoyée", description: "Notre maître d'hôtel vous rappelle sous 30 minutes.", icon: "calendar_month" })}
                className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-secondary-container text-label-lg font-bold text-on-secondary-fixed hover:bg-secondary-fixed"
              >
                <Icon name="calendar_month" size={20} /> Réserver un Salon Privé
              </button>
            </section>
            <Card
              title="Adresses Enregistrées"
              icon="location_on"
              aside={
                <button type="button" onClick={() => openAddress(null)} className="flex items-center gap-1 text-label-md text-primary hover:underline">
                  <Icon name="add" size={16} /> Ajouter
                </button>
              }
            >
              <AddressesPanel user={user} onEdit={openAddress} />
            </Card>
            <Card title="Modes de Règlement" icon="payments" aside={<span className="text-[10px] font-bold uppercase text-on-surface-variant">Dinar Algérien (DA)</span>}>
              <PaymentPanel user={user} />
            </Card>
            <Card title="Préférences & Allergies" icon="tune" aside={<span className="text-[10px] font-bold uppercase text-secondary">Profil chef</span>}>
              <PreferencesPanel user={user} />
            </Card>
            <button
              type="button"
              onClick={signOut}
              className="flex h-12 items-center justify-center gap-2 rounded-xl bg-surface-container text-label-lg text-on-surface-variant hover:bg-surface-container-high hover:text-error"
            >
              <Icon name="logout" size={20} /> Se déconnecter
            </button>
          </div>
        </div>
      </div>

      {/* =============================================== Mobile (profile-mobile) */}
      <div className="flex flex-col gap-5 px-4 pt-2 xs:px-margin md:hidden">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-label-sm uppercase tracking-widest text-secondary">Espace privilège</p>
            <h1 className="text-headline-sm font-bold text-primary">Mon Espace Gourmet</h1>
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-secondary-fixed/70 px-3 py-1.5 text-label-md text-on-secondary-fixed-variant">
            <Icon name="stars" size={16} className="text-secondary" /> Élite Alger
          </span>
        </div>

        <div className="rounded-3xl bg-gradient-to-br from-surface-container-lowest from-60% to-secondary-fixed/30 p-5 shadow-card">
          <div className="flex items-start gap-4">
            <Avatar user={user} size={68} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-headline-sm font-bold text-on-surface" data-testid="profile-name-mobile">
                {fullName}
              </p>
              <p className="text-body-sm text-on-surface-variant">+213 {formatPhone(user.phone)}</p>
              <p className="mt-1 flex items-center gap-1.5 text-label-sm uppercase text-secondary">
                <span className="size-2 rounded-full bg-secondary" /> Membre gourmet privilège
              </p>
            </div>
            <button type="button" aria-label="Modifier mes informations" onClick={() => setProfileOpen(Date.now())} className="grid size-10 place-items-center rounded-full text-outline hover:bg-surface-container hover:text-primary">
              <Icon name="edit" size={20} />
            </button>
          </div>
          <div className="mt-4 flex items-center gap-3 rounded-2xl bg-surface-container-low p-3">
            <span className="grid size-11 place-items-center rounded-full bg-secondary-container text-on-secondary-fixed">
              <Icon name="loyalty" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-headline-sm font-bold text-primary">
                {user.points} <span className="text-label-md font-semibold text-on-surface-variant">PTS</span>
              </p>
              <p className="truncate text-body-sm text-on-surface-variant">Réduction de 1 000 DA disponible dès 480 pts</p>
            </div>
            <button
              type="button"
              disabled={user.points < 480}
              onClick={() => toast({ title: "Réduction réservée", description: "1 000 DA seront déduits au paiement en espèces.", icon: "redeem" })}
              className="h-10 rounded-full bg-primary px-4 text-label-md font-bold text-on-primary disabled:opacity-50"
            >
              Utiliser
            </button>
          </div>
        </div>

        {active && <ActiveOrderHero order={active} now={now} />}

        <div>
          <p className="mb-2 flex justify-between px-1 text-label-sm uppercase tracking-wider text-secondary">
            <span>Services personnels</span>
            <span className="normal-case tracking-normal text-on-surface-variant">Préférences du convive</span>
          </p>
          <ul className="overflow-hidden rounded-3xl bg-surface-container-lowest shadow-card">
            {[
              { icon: "location_on", title: "Mes Adresses à Alger", text: [...new Set(user.addresses.map((a) => communeName(a.commune).split(" / ")[0]))].join(", ") || "Aucune adresse", badge: `${user.addresses.length} lieu${user.addresses.length > 1 ? "x" : ""}`, onClick: () => setPanel("addresses") },
              { icon: "receipt_long", title: "Historique des Commandes", text: `${orders.length} dégustation${orders.length > 1 ? "s" : ""} & réceptions`, href: "/compte/commandes" },
              { icon: "spa", title: "Préférences & Allergies", text: user.preferences.join(", ") || "Non configuré", badge: user.preferences.length ? "Configuré" : undefined, onClick: () => setPanel("preferences") },
              { icon: "payments", title: "Paiement en Espèces", text: `Préférence : ${CHANGE_LABELS[user.changePreference]}`, onClick: () => setPanel("payment") },
              { icon: "concierge", title: "Conciergerie Privée", text: `${RESTAURANT.concierge} • Ligne dédiée`, badge: "24/7", href: "tel:+21321484950" },
            ].map((item, i) => {
              const content = (
                <>
                  <span className="grid size-12 shrink-0 place-items-center rounded-full bg-surface-container text-primary">
                    <Icon name={item.icon} />
                  </span>
                  <span className="min-w-0 flex-1 text-left">
                    <span className="block truncate text-label-lg text-on-surface">{item.title}</span>
                    <span className="block truncate text-body-sm text-on-surface-variant">{item.text}</span>
                  </span>
                  {item.badge && <span className="shrink-0 rounded-full bg-secondary-fixed/60 px-2 py-0.5 text-[10px] font-bold text-on-secondary-fixed-variant">{item.badge}</span>}
                  <Icon name="chevron_right" className="shrink-0 text-outline-variant" />
                </>
              );
              const cls = cn("flex w-full items-center gap-3 px-4 py-4 transition-colors hover:bg-surface-container-low", i % 2 === 1 && "bg-surface-container-low/50");
              return (
                <li key={item.title}>
                  {item.href ? (
                    <Link href={item.href} className={cls}>
                      {content}
                    </Link>
                  ) : (
                    <button type="button" onClick={item.onClick} className={cls}>
                      {content}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <section aria-label="Vos créations favorites">
          <h2 className="mb-2 px-1 text-label-sm uppercase tracking-wider text-secondary">Vos créations favorites</h2>
          <Favorites compact />
        </section>

        <button type="button" onClick={signOut} className="mx-auto flex h-12 items-center gap-2 rounded-full bg-surface-container-high px-6 text-label-lg text-on-surface hover:text-error">
          <Icon name="logout" size={20} /> Se déconnecter de ce profil
        </button>
        <p className="text-center text-[11px] font-bold uppercase tracking-wide text-on-surface-variant">La Dentelle Gastronomie • Alger • Version 2.4.0</p>

        <Sheet open={panel === "addresses"} onClose={() => setPanel(null)} title="Mes adresses à Alger">
          <div className="pb-4">
            <AddressesPanel user={user} onEdit={(a) => { setPanel(null); openAddress(a); }} />
            <button type="button" onClick={() => { setPanel(null); openAddress(null); }} className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-outline-variant py-3 text-label-lg text-primary">
              <Icon name="add" size={18} /> Ajouter une adresse
            </button>
          </div>
        </Sheet>
        <Sheet open={panel === "preferences"} onClose={() => setPanel(null)} title="Préférences & Allergies">
          <div className="pb-4">
            <PreferencesPanel user={user} />
          </div>
        </Sheet>
        <Sheet open={panel === "payment"} onClose={() => setPanel(null)} title="Paiement en espèces">
          <div className="pb-4">
            <PaymentPanel user={user} />
          </div>
        </Sheet>
      </div>

      {/* key resets the form each time the sheet is opened */}
      <ProfileSheet key={`p${profileOpen}`} user={user} open={profileOpen > 0} onClose={() => setProfileOpen(0)} />
      {editing && <AddressSheet key={editing.n} user={user} address={editing.address} open onClose={() => setEditing(null)} />}
    </>
  );
}

