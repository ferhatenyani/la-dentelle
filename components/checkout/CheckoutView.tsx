"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useState, type FormEvent, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { COMMUNES, RESTAURANT } from "@/lib/data/catalog";
import { formatNumber, formatPhone, formatPrice, isValidAlgerianMobile } from "@/lib/format";
import { placeOrder, saveAddress, updateProfile } from "@/lib/store/actions";
import { useCart, useSessionUser } from "@/lib/store/hooks";
import { useHydrated } from "@/lib/store/store";
import { useOnHide } from "@/lib/use-on-hide";
import type { ChangePreference, UserProfile } from "@/lib/types";
import { communeName } from "@/lib/tracking";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Field, TextField, inputClasses } from "@/components/ui/Field";
import { EmptyState, PageSkeleton } from "@/components/ui/States";
import { toast } from "@/components/ui/Toast";
import { ProductImage } from "@/components/product/ProductImage";
import { CartLineRow, TotalsBlock } from "@/components/cart/CartParts";

const CHANGE_OPTIONS: { id: ChangePreference; label: string; hint: string }[] = [
  { id: "exact", label: "Appoint exact", hint: "Montant exact" },
  { id: "2000", label: "Billets de 2 000 DA", hint: "Le livreur rend la monnaie" },
  { id: "1000", label: "Billets de 1 000 DA", hint: "Le livreur rend la monnaie" },
  { id: "5000", label: "Billets de 5 000 DA", hint: "Le livreur rend la monnaie" },
];

interface FormState {
  fullName: string;
  phone: string;
  addressId: string | null; // saved address being used, null = new
  commune: string;
  street: string;
  building: string;
  instructions: string;
  change: ChangePreference;
  saveToProfile: boolean;
}

function initialState(user: UserProfile | null): FormState {
  const addr = user?.addresses.find((a) => a.id === user.defaultAddressId) ?? user?.addresses[0];
  return {
    fullName: user ? `${user.firstName} ${user.lastName}`.trim() : "",
    phone: user?.phone ? formatPhone(user.phone) : "",
    addressId: addr?.id ?? null,
    commune: addr?.commune ?? "",
    street: addr?.street ?? "",
    building: addr?.building ?? "",
    instructions: addr?.instructions ?? "",
    change: user?.changePreference ?? "exact",
    saveToProfile: !!user && !addr,
  };
}

type Errors = Partial<Record<"fullName" | "phone" | "commune" | "street", string>>;

function validate(f: FormState): Errors {
  const e: Errors = {};
  if (f.fullName.trim().length < 3) e.fullName = "Indiquez votre nom et prénom.";
  if (!isValidAlgerianMobile(f.phone)) e.phone = "Numéro algérien invalide (ex. 550 12 34 56).";
  if (!f.commune) e.commune = "Choisissez votre commune de livraison.";
  if (f.street.trim().length < 3) e.street = "Indiquez la rue ou le quartier.";
  return e;
}

function Section({ step, icon, title, subtitle, badge, children, highlight }: { step: number; icon: string; title: string; subtitle: string; badge?: ReactNode; children: ReactNode; highlight?: boolean }) {
  return (
    <section
      aria-labelledby={`step-${step}`}
      className={cn("rounded-3xl bg-surface-container-lowest p-5 shadow-card md:rounded-xl md:p-8", highlight && "md:border-2 md:border-primary/20")}
    >
      <div className="mb-5 flex items-start justify-between gap-3 border-b border-outline-variant/20 pb-4 md:mb-6 md:pb-5">
        <div className="flex items-center gap-3">
          <span className={cn("grid size-9 shrink-0 place-items-center rounded-lg", highlight ? "bg-primary-container text-on-primary" : "bg-surface-container text-primary")}>
            <Icon name={icon} size={20} />
          </span>
          <div>
            <h2 id={`step-${step}`} className="text-label-lg font-bold text-primary md:text-headline-sm">
              <span className="hidden md:inline">Étape {step}. </span>
              {title}
            </h2>
            <p className="text-body-sm text-on-surface-variant">{subtitle}</p>
          </div>
        </div>
        {badge}
      </div>
      {children}
    </section>
  );
}

function CheckoutForm({ user }: { user: UserProfile | null }) {
  const router = useRouter();
  const cart = useCart();
  const [f, setF] = useState<FormState>(() => initialState(user));
  const [errors, setErrors] = useState<Errors>({});
  // Mobile shows a compact address card when a complete address is prefilled (checkout-mobile).
  const [editingAddress, setEditingAddress] = useState(() => {
    const init = initialState(user);
    return !init.commune || init.street.trim().length < 3;
  });
  const [submitting, setSubmitting] = useState(false);
  const [placed, setPlaced] = useState(false);
  // Leaving the page (e.g. to the confirmation) must not leave a stale pending overlay behind.
  useOnHide(() => {
    setSubmitting(false);
    setPlaced(false);
    setErrors({});
  });

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setF((s) => ({ ...s, [k]: v }));
    if (k in errors) setErrors((e) => ({ ...e, [k]: undefined }));
  };
  const setAddressField = <K extends "commune" | "street" | "building" | "instructions">(k: K, v: string) => {
    setF((s) => ({ ...s, [k]: v, saveToProfile: !!user && (s.saveToProfile || !s.addressId) }));
    if (k in errors) setErrors((e) => ({ ...e, [k]: undefined }));
  };
  const pickAddress = (id: string | null) => {
    const a = user?.addresses.find((x) => x.id === id);
    setF((s) => ({
      ...s,
      addressId: id,
      commune: a?.commune ?? "",
      street: a?.street ?? "",
      building: a?.building ?? "",
      instructions: a?.instructions ?? "",
      saveToProfile: !a && !!user,
    }));
    setErrors({});
    if (!a) setEditingAddress(true);
  };

  // After a successful order the cart empties: keep showing the pending state until navigation.
  if (cart.lines.length === 0 && !placed) {
    return (
      <div className="mx-auto w-full max-w-[1280px] px-4 py-10 md:px-6">
        <EmptyState
          icon="shopping_bag"
          title="Votre panier est vide"
          description="Ajoutez des plats avant de finaliser votre commande."
          action={<ButtonLink href="/menu" icon="restaurant_menu">Voir la carte</ButtonLink>}
        />
      </div>
    );
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const errs = validate(f);
    setErrors(errs);
    if (Object.keys(errs).length) {
      if (errs.commune || errs.street) setEditingAddress(true);
      requestAnimationFrame(() => document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      toast({ title: "Informations incomplètes", description: "Vérifiez les champs signalés.", tone: "error" });
      return;
    }
    setSubmitting(true);
    try {
      if (user && f.saveToProfile) {
        const [firstName, ...rest] = f.fullName.trim().split(/\s+/);
        updateProfile(user.id, { firstName, lastName: rest.join(" "), phone: f.phone, changePreference: f.change });
        const saved = user.addresses.find((a) => a.id === f.addressId);
        saveAddress(
          user.id,
          {
            id: saved?.id,
            label: saved?.label ?? (f.building.split(",")[0] || communeName(f.commune)),
            icon: saved?.icon ?? "home",
            commune: f.commune,
            street: f.street.trim(),
            building: f.building.trim(),
            instructions: f.instructions.trim(),
          },
          !user.defaultAddressId,
        );
      }
      setPlaced(true);
      const order = await placeOrder({
        contact: { fullName: f.fullName, phone: f.phone },
        address: { label: user?.addresses.find((a) => a.id === f.addressId)?.label, commune: f.commune, street: f.street.trim(), building: f.building.trim(), instructions: f.instructions.trim() },
        changePreference: f.change,
      });
      router.replace(`/commande/confirmation?id=${order.id}`);
    } catch (err) {
      setPlaced(false);
      setSubmitting(false);
      toast({ title: "La commande n'a pas pu être envoyée", description: err instanceof Error ? err.message : "Réessayez dans un instant.", tone: "error" });
    }
  };

  const commune = COMMUNES.find((c) => c.id === f.commune);
  const lines = cart.lines;

  const confirmLabel = (
    <>
      <span>Confirmer la Commande</span>
      <span className="opacity-60">•</span>
      <span className="whitespace-nowrap">{formatNumber(cart.total)} DA</span>
    </>
  );

  return (
    <form id="checkout-form" noValidate onSubmit={submit} className="mx-auto w-full max-w-[1280px] px-4 pb-40 pt-4 xs:px-margin md:px-6 md:py-12">
      {/* Heading */}
      <div className="mb-6 flex flex-col justify-between gap-6 md:mb-10 lg:flex-row lg:items-center">
        <div className="text-center md:text-left">
          <div className="mb-2 hidden items-center gap-2 md:flex">
            <span className="rounded-full bg-secondary-fixed px-2.5 py-0.5 text-label-sm uppercase tracking-wider text-on-secondary-fixed">Commande rapide &amp; directe</span>
            <span className="text-outline-variant">•</span>
            <span className="text-label-md text-on-surface-variant">Alger &amp; Environs</span>
          </div>
          <span className="mx-auto mb-3 grid size-12 place-items-center rounded-full bg-surface-container text-primary md:hidden">
            <Icon name="verified" />
          </span>
          <h1 className="text-headline-lg-mobile font-semibold text-on-surface md:text-headline-lg md:font-bold md:text-primary">Finalisation de Commande</h1>
          <p className="mt-1 text-body-sm text-on-surface-variant md:hidden">Paiement sécurisé en espèces à la livraison (DZD)</p>
        </div>
        <ol className="hidden items-center gap-3 md:flex" aria-label="Étapes">
          {["Coordonnées", "Livraison", "Paiement Espèces"].map((s, i) => (
            <li key={s} className="flex items-center gap-3">
              {i > 0 && <span className="h-[2px] w-8 bg-primary" aria-hidden />}
              <span className="flex items-center gap-2">
                <span className="grid size-7 place-items-center rounded-full bg-primary text-label-sm text-on-primary">{i + 1}</span>
                <span className="text-label-md font-bold text-primary">{s}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>

      {!user && (
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-secondary/30 bg-secondary-fixed/40 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-start gap-2 text-body-sm text-on-secondary-fixed-variant">
            <Icon name="info" size={20} className="shrink-0" />
            Connectez-vous pour préremplir vos coordonnées et retrouver cette commande dans votre historique.
          </p>
          <ButtonLink href="/connexion?next=/commande" size="sm" variant="solid" icon="login" className="w-fit">
            Se connecter
          </ButtonLink>
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-5 md:gap-8 lg:grid-cols-12">
        <div className="flex flex-col gap-5 md:gap-8 lg:col-span-7">
          {/* Mobile: editable items (checkout-mobile) */}
          <div className="flex flex-col gap-3 md:hidden">
            {lines.map((l) => (
              <CartLineRow key={l.product.slug} line={l} compact />
            ))}
          </div>

          <Section
            step={1}
            icon="person"
            title="Vos Coordonnées"
            subtitle="Uniquement les informations essentielles pour vous joindre"
            badge={
              <span className="hidden items-center gap-1.5 rounded-full bg-primary-fixed/50 px-2.5 py-1 text-label-sm text-on-primary-fixed sm:inline-flex">
                <Icon name="check_circle" size={14} /> Rapide
              </span>
            }
          >
            <div className="grid gap-4 md:grid-cols-2">
              <TextField label="Nom et Prénom *" icon="badge" autoComplete="name" value={f.fullName} onChange={(e) => set("fullName", e.target.value)} error={errors.fullName} placeholder="Ex : Amine Benali" />
              <TextField label="Numéro de mobile (+213) *" icon="call" type="tel" inputMode="tel" autoComplete="tel-national" value={f.phone} onChange={(e) => set("phone", e.target.value)} error={errors.phone} placeholder="550 12 34 56" />
            </div>
          </Section>

          <Section
            step={2}
            icon="location_on"
            title="Adresse de Livraison à Alger"
            subtitle="Livraison directe à votre domicile ou bureau"
            badge={
              <span className="hidden items-center gap-1.5 rounded-full bg-secondary-container px-2.5 py-1 text-label-sm text-on-secondary-fixed sm:inline-flex">
                <span className="size-1.5 rounded-full bg-secondary" /> Grand Alger
              </span>
            }
          >
            {user && user.addresses.length > 0 && (
              <div className="mb-5 flex flex-wrap gap-2" role="radiogroup" aria-label="Adresses enregistrées">
                {user.addresses.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    role="radio"
                    aria-checked={f.addressId === a.id}
                    onClick={() => pickAddress(a.id)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full px-3.5 py-2 text-label-md transition-colors",
                      f.addressId === a.id ? "bg-primary text-on-primary" : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container",
                    )}
                  >
                    <Icon name={a.icon === "work" ? "apartment" : a.icon === "villa" ? "villa" : "home"} size={16} />
                    {a.label}
                  </button>
                ))}
                <button
                  type="button"
                  role="radio"
                  aria-checked={f.addressId === null}
                  onClick={() => pickAddress(null)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-3.5 py-2 text-label-md transition-colors",
                    f.addressId === null ? "bg-primary text-on-primary" : "border border-dashed border-outline-variant text-on-surface-variant hover:bg-surface-container-low",
                  )}
                >
                  <Icon name="add" size={16} /> Nouvelle adresse
                </button>
              </div>
            )}

            {/* Mobile collapsed card when a valid address is prefilled */}
            {!editingAddress && (
              <div className="mb-4 flex items-start gap-3 rounded-xl bg-surface-container-low p-3.5 md:hidden" data-testid="address-card">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-surface-container-lowest text-primary">
                  <Icon name="home" size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-label-lg text-on-surface">{f.building || communeName(f.commune)}</p>
                  <p className="text-body-sm text-on-surface-variant">
                    {f.street}, {communeName(f.commune)}
                  </p>
                  <p className="text-[11px] tracking-wide text-on-surface-variant">+213 {f.phone}</p>
                </div>
                <button type="button" onClick={() => setEditingAddress(true)} className="text-label-md font-bold text-secondary">
                  Modifier
                </button>
              </div>
            )}

            <div className={cn("flex-col gap-4", editingAddress ? "flex" : "hidden md:flex")}>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Commune *" error={errors.commune}>
                  {({ id, describedBy, invalid }) => (
                    <select
                      id={id}
                      value={f.commune}
                      onChange={(e) => setAddressField("commune", e.target.value)}
                      aria-invalid={invalid || undefined}
                      aria-describedby={describedBy}
                      className={cn(inputClasses, "cursor-pointer")}
                    >
                      <option value="">Choisir une commune…</option>
                      {COMMUNES.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  )}
                </Field>
                <TextField label="Rue / Voie / Quartier *" value={f.street} onChange={(e) => setAddressField("street", e.target.value)} error={errors.street} placeholder="Rue ou boulevard" autoComplete="address-line1" />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <TextField label="Bâtiment, Étage & Porte" value={f.building} onChange={(e) => setAddressField("building", e.target.value)} placeholder="Ex : Résidence Les Pins, 3ème ét., Apt 14" autoComplete="address-line2" />
                <TextField label="Instructions pour le livreur" value={f.instructions} onChange={(e) => setAddressField("instructions", e.target.value)} placeholder="Ex : Sonnette Benali, portail noir…" />
              </div>
            </div>

            {user && (
              <label className="mt-4 flex cursor-pointer items-center gap-2.5 text-body-sm text-on-surface-variant">
                <input
                  type="checkbox"
                  checked={f.saveToProfile}
                  onChange={(e) => set("saveToProfile", e.target.checked)}
                  className="size-4 cursor-pointer accent-primary-container"
                />
                Enregistrer ces coordonnées dans mon profil
              </label>
            )}

            <div className="mt-5">
              <p className="mb-2.5 text-label-md font-bold text-on-surface">Délai estimé</p>
              <div className="flex items-center gap-3 rounded-xl border border-outline-variant/30 bg-surface-container-low p-3.5">
                <Icon name="schedule" size={22} className="text-primary" />
                <div className="flex-1">
                  <span className="text-label-md font-bold text-primary">Livraison Express Alger ({commune?.eta ?? "35 – 50 min"})</span>
                  <p className="text-body-sm text-on-surface-variant">Préparation immédiate en cuisine et départ direct de notre atelier d&apos;Hydra.</p>
                </div>
                <span className="hidden shrink-0 rounded-full bg-secondary-fixed px-2.5 py-1 text-label-sm text-on-secondary-fixed sm:inline">En direct</span>
              </div>
            </div>
          </Section>

          <Section
            step={3}
            icon="payments"
            title="Mode de Règlement"
            subtitle="Simple, sécurisé et 100% sans paiement en ligne"
            highlight
            badge={
              <span className="hidden items-center gap-1.5 rounded-full bg-secondary-container px-2.5 py-1 text-label-sm text-on-secondary-fixed sm:inline-flex">
                <Icon name="verified" size={14} /> Paiement garanti
              </span>
            }
          >
            <div className="rounded-xl border-2 border-primary/20 bg-surface-container-low/60 p-4 md:p-6">
              <div className="flex items-start gap-3">
                <Icon name="check_circle" fill size={24} className="text-primary" />
                <div>
                  <p className="text-label-lg font-bold text-primary md:text-headline-sm">Paiement en espèces à la réception</p>
                  <p className="mt-1 text-body-sm text-on-surface-variant md:text-body-md">
                    Vous réglez directement le montant exact ou avec appoint auprès du livreur lors de la remise en main propre. Un reçu vous sera remis.
                  </p>
                </div>
              </div>
              <fieldset className="mt-5 border-t border-outline-variant/30 pt-5">
                <legend className="mb-3 text-label-md font-bold text-on-surface">Précisez votre monnaie pour faciliter l&apos;appoint :</legend>
                <div className="grid grid-cols-2 gap-2.5">
                  {CHANGE_OPTIONS.map((o) => {
                    const active = f.change === o.id;
                    return (
                      <label
                        key={o.id}
                        className={cn(
                          "flex cursor-pointer items-center justify-between gap-2 rounded-xl border px-3.5 py-3 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary-container",
                          active ? "border-primary bg-primary text-on-primary" : "border-outline-variant/50 bg-surface-container-lowest text-on-surface hover:border-primary/50",
                        )}
                      >
                        <span className="flex flex-col">
                          <span className="text-label-md font-bold">{o.label}</span>
                          <span className={cn("hidden text-[11px] sm:block", active ? "text-white/75" : "text-on-surface-variant")}>{o.hint}</span>
                        </span>
                        <input type="radio" name="change" value={o.id} checked={active} onChange={() => set("change", o.id)} className="sr-only" />
                        <Icon name={active ? "check_circle" : "circle"} size={20} className={active ? "text-secondary-container" : "text-outline-variant"} />
                      </label>
                    );
                  })}
                </div>
                <p className="mt-3 text-body-sm text-on-surface-variant">Le coursier disposera de la monnaie nécessaire selon votre sélection.</p>
              </fieldset>
            </div>
          </Section>

          {/* Mobile totals (checkout-mobile) */}
          <div className="md:hidden">
            <TotalsBlock {...cart} className="bg-surface-container-lowest shadow-card" />
          </div>
        </div>

        {/* Desktop summary (checkout-desktop right column) */}
        <aside className="hidden flex-col gap-5 md:flex lg:sticky lg:top-28 lg:col-span-5">
          <div className="rounded-xl bg-surface-container-lowest p-6 shadow-card">
            <div className="mb-5 flex items-center justify-between border-b border-outline-variant/20 pb-4">
              <h2 className="flex items-center gap-2 text-headline-sm font-semibold text-primary">
                <Icon name="restaurant" /> Détail de la Commande
              </h2>
              <Link href="/panier" className="text-label-md font-bold text-secondary hover:underline">
                {cart.count} plat{cart.count > 1 ? "s" : ""} · Modifier
              </Link>
            </div>
            <ul className="mb-5 flex max-h-[320px] flex-col gap-3 overflow-y-auto pr-1">
              {lines.map((l) => (
                <li key={l.product.slug} className="flex items-center gap-3 rounded-xl bg-surface-container-low p-3">
                  <span className="relative size-14 shrink-0 overflow-hidden rounded-lg">
                    <ProductImage product={l.product} sizes="56px" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-label-lg text-on-surface">{l.product.name}</span>
                    <span className="block text-body-sm text-on-surface-variant">
                      Qté : {l.quantity} · {l.product.pairing}
                    </span>
                  </span>
                  <span className="whitespace-nowrap text-label-md font-bold text-primary">{formatPrice(l.lineTotal)}</span>
                </li>
              ))}
            </ul>
            <TotalsBlock {...cart} />
            <Button type="submit" variant="solid" loading={submitting} className="mt-5 h-auto w-full flex-col gap-0.5 rounded-xl py-4 text-headline-sm shadow-lg">
              <span className="flex items-center gap-2">
                Confirmer la Commande <Icon name="arrow_forward" />
              </span>
              <span className="text-label-sm uppercase tracking-wider text-primary-fixed">Paiement à la livraison en espèces</span>
            </Button>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <span className="flex items-center gap-2 rounded-lg border border-outline-variant/30 bg-surface-container-low p-3 text-label-md text-on-surface">
                <Icon name="local_shipping" size={20} className="text-primary" /> Livraison rapide · {commune?.eta ?? "35–50 min"}
              </span>
              <span className="flex items-center gap-2 rounded-lg border border-outline-variant/30 bg-surface-container-low p-3 text-label-md text-on-surface">
                <Icon name="receipt_long" size={20} className="text-primary" /> Reçu officiel délivré sur place
              </span>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-xl bg-surface-container p-5">
            <Icon name="headset_mic" className="text-secondary" />
            <p className="text-body-sm text-on-surface-variant">
              <strong className="block text-label-md text-primary">Besoin d&apos;aide ou demande spéciale ?</strong>
              Liaison directe avec notre maître d&apos;hôtel au {RESTAURANT.concierge}
            </p>
          </div>
        </aside>
      </div>

      {/* Mobile sticky confirm (checkout-mobile) */}
      <div className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-outline-variant/30 bg-surface/95 px-4 pt-3 backdrop-blur-xl md:hidden">
        <button
          type="submit"
          disabled={submitting}
          aria-busy={submitting || undefined}
          className="flex h-14 w-full items-center justify-center gap-2 whitespace-nowrap rounded-full bg-on-surface px-5 text-[15px] font-bold text-surface-container-lowest shadow-lg active:scale-[0.98] disabled:opacity-70"
        >
          {submitting ? <span className="size-5 animate-spin rounded-full border-2 border-current border-r-transparent" /> : confirmLabel}
          {!submitting && <Icon name="arrow_forward" size={22} />}
        </button>
        <p className="flex items-center justify-center gap-1.5 py-2 text-[11px] tracking-wide text-on-surface">
          <Icon name="lock" size={14} /> Paiement comptant en dinars algériens à la réception
        </p>
      </div>

      <AnimatePresence>
        {submitting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] grid place-items-center bg-surface/70 backdrop-blur-sm"
            role="status"
            aria-live="assertive"
          >
            <div className="flex flex-col items-center gap-3 rounded-3xl bg-surface-container-lowest px-8 py-6 shadow-float">
              <span className="size-10 animate-spin rounded-full border-[3px] border-primary-container border-r-transparent" />
              <p className="text-label-lg text-primary">Transmission à la cuisine…</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  );
}

export function CheckoutView() {
  const hydrated = useHydrated();
  const user = useSessionUser();
  if (!hydrated) return <PageSkeleton />;
  // key: re-initialise prefilled values if the session changes
  return <CheckoutForm key={user?.id ?? "guest"} user={user} />;
}

