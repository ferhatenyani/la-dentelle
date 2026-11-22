"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { COMMUNES } from "@/lib/data/catalog";
import { formatPhone, isValidAlgerianMobile, isValidEmail } from "@/lib/format";
import { deleteAddress, saveAddress, setDefaultAddress, updateProfile } from "@/lib/store/actions";
import { communeName } from "@/lib/tracking";
import type { Address, ChangePreference, UserProfile } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Field, TextField, inputClasses } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Sheet } from "@/components/ui/Sheet";
import { toast } from "@/components/ui/Toast";

export const ADDRESS_ICON: Record<Address["icon"], string> = { home: "home", work: "apartment", villa: "villa" };

export const CHANGE_LABELS: Record<ChangePreference, string> = {
  exact: "Appoint exact",
  "2000": "Billets de 2 000 DA",
  "1000": "Billets de 1 000 DA",
  "5000": "Billets de 5 000 DA",
};

export const PREFERENCE_OPTIONS = [
  { label: "100% Halal Certifié", icon: "verified" },
  { label: "Sans Gluten sur Demande", icon: "no_meals" },
  { label: "Épices Douces (Sans Harissa forte)", icon: "local_fire_department" },
  { label: "Agneau Confit Basse Température", icon: "skillet" },
  { label: "Sans Fruits à Coque", icon: "eco" },
  { label: "Végétarien", icon: "spa" },
];

// ------------------------------------------------------------------ Profile edit
export function ProfileSheet({ user, open, onClose }: { user: UserProfile; open: boolean; onClose: () => void }) {
  const [form, setForm] = useState({ firstName: user.firstName, lastName: user.lastName, phone: formatPhone(user.phone), email: user.email });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = () => {
    const errs: Record<string, string> = {};
    if (form.firstName.trim().length < 2) errs.firstName = "Prénom requis.";
    if (form.lastName.trim().length < 2) errs.lastName = "Nom requis.";
    if (!isValidAlgerianMobile(form.phone)) errs.phone = "Numéro algérien invalide (ex. 550 12 34 56).";
    if (!isValidEmail(form.email)) errs.email = "Adresse email invalide.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    updateProfile(user.id, { firstName: form.firstName.trim(), lastName: form.lastName.trim(), phone: form.phone, email: form.email.trim() });
    toast({ title: "Profil mis à jour", icon: "check" });
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose} title="Informations personnelles" description="Utilisées pour préremplir vos commandes." footer={<Button variant="solid" size="lg" className="w-full" icon="check" onClick={save}>Enregistrer</Button>}>
      <form
        className="grid gap-4 pb-2 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <TextField label="Prénom" value={form.firstName} onChange={set("firstName")} error={errors.firstName} autoComplete="given-name" />
        <TextField label="Nom" value={form.lastName} onChange={set("lastName")} error={errors.lastName} autoComplete="family-name" />
        <TextField label="Mobile (+213)" type="tel" icon="call" value={form.phone} onChange={set("phone")} error={errors.phone} containerClassName="sm:col-span-2" />
        <TextField label="Email" type="email" icon="mail" value={form.email} onChange={set("email")} error={errors.email} containerClassName="sm:col-span-2" />
        <button type="submit" hidden />
      </form>
    </Sheet>
  );
}

// ------------------------------------------------------------------ Address edit
export function AddressSheet({ user, address, open, onClose }: { user: UserProfile; address: Address | null; open: boolean; onClose: () => void }) {
  const [form, setForm] = useState<Omit<Address, "id">>(
    address ?? { label: "", commune: "", street: "", building: "", instructions: "", icon: "home" },
  );
  const [makeDefault, setMakeDefault] = useState(address ? user.defaultAddressId === address.id : user.addresses.length === 0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = () => {
    const errs: Record<string, string> = {};
    if (form.label.trim().length < 2) errs.label = "Donnez un nom à cette adresse.";
    if (!form.commune) errs.commune = "Choisissez une commune.";
    if (form.street.trim().length < 3) errs.street = "Indiquez la rue ou le quartier.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    saveAddress(user.id, { ...form, id: address?.id, label: form.label.trim(), street: form.street.trim() }, makeDefault);
    toast({ title: address ? "Adresse modifiée" : "Adresse ajoutée", description: form.label, icon: "location_on" });
    onClose();
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={address ? "Modifier l'adresse" : "Nouvelle adresse"}
      footer={
        <Button variant="solid" size="lg" className="w-full" icon="check" onClick={save}>
          Enregistrer l&apos;adresse
        </Button>
      }
    >
      <div className="grid gap-4 pb-2 sm:grid-cols-2">
        <TextField label="Nom de l'adresse" value={form.label} onChange={set("label")} error={errors.label} placeholder="Ex : Maison, Bureau…" />
        <div className="flex flex-col gap-1.5">
          <span className="text-label-md font-bold">Type</span>
          <div className="flex gap-2" role="radiogroup" aria-label="Type d'adresse">
            {(["home", "work", "villa"] as const).map((t) => (
              <button
                key={t}
                type="button"
                role="radio"
                aria-checked={form.icon === t}
                aria-label={t === "home" ? "Domicile" : t === "work" ? "Bureau" : "Villa"}
                onClick={() => setForm((f) => ({ ...f, icon: t }))}
                className={cn("grid h-12 flex-1 place-items-center rounded-lg transition-colors", form.icon === t ? "bg-primary text-on-primary" : "bg-surface-container-low text-on-surface-variant")}
              >
                <Icon name={ADDRESS_ICON[t]} size={20} />
              </button>
            ))}
          </div>
        </div>
        <Field label="Commune" error={errors.commune}>
          {({ id, describedBy, invalid }) => (
            <select id={id} value={form.commune} onChange={set("commune")} aria-invalid={invalid || undefined} aria-describedby={describedBy} className={inputClasses}>
              <option value="">Choisir…</option>
              {COMMUNES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </Field>
        <TextField label="Rue / Quartier" value={form.street} onChange={set("street")} error={errors.street} />
        <TextField label="Bâtiment, étage, porte" value={form.building} onChange={set("building")} containerClassName="sm:col-span-2" />
        <TextField label="Instructions pour le livreur" value={form.instructions} onChange={set("instructions")} containerClassName="sm:col-span-2" />
        <label className="flex items-center gap-2.5 text-body-sm text-on-surface-variant sm:col-span-2">
          <input type="checkbox" checked={makeDefault} onChange={(e) => setMakeDefault(e.target.checked)} className="size-4 accent-primary-container" />
          Utiliser comme adresse par défaut
        </label>
      </div>
    </Sheet>
  );
}

// ------------------------------------------------------------------ Panels
export function AddressesPanel({ user, onEdit }: { user: UserProfile; onEdit: (a: Address | null) => void }) {
  if (user.addresses.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-outline-variant p-5 text-center text-body-sm text-on-surface-variant">
        Aucune adresse enregistrée.
        <button type="button" onClick={() => onEdit(null)} className="mt-2 block w-full font-bold text-primary">
          + Ajouter une adresse
        </button>
      </div>
    );
  }
  return (
    <ul className="flex flex-col gap-2.5" aria-label="Adresses enregistrées">
      {user.addresses.map((a) => {
        const isDefault = a.id === user.defaultAddressId;
        return (
          <li key={a.id} data-testid="saved-address" className={cn("flex items-start gap-3 rounded-xl p-3.5", isDefault ? "bg-surface-container-low ring-1 ring-primary/15" : "bg-surface-container-low/60")}>
            <span className={cn("grid size-8 shrink-0 place-items-center rounded-full", isDefault ? "bg-primary text-on-primary" : "bg-surface-container-high text-primary")}>
              <Icon name={ADDRESS_ICON[a.icon]} size={16} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-2 text-label-lg text-on-surface">
                {a.label} <span className="font-normal text-on-surface-variant">• {communeName(a.commune).split(" / ")[0]}</span>
                {isDefault && <span className="rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold uppercase text-on-primary">Défaut</span>}
              </p>
              <p className="truncate text-body-sm text-on-surface-variant">{[a.building, a.street].filter(Boolean).join(", ")}</p>
              {!isDefault && (
                <button type="button" onClick={() => setDefaultAddress(user.id, a.id)} className="mt-1 text-label-md font-bold text-primary hover:underline">
                  Définir par défaut
                </button>
              )}
            </div>
            <div className="flex shrink-0 gap-0.5">
              <button type="button" aria-label={`Modifier ${a.label}`} onClick={() => onEdit(a)} className="grid size-9 place-items-center rounded-full text-on-surface-variant hover:bg-surface-container hover:text-primary">
                <Icon name="edit" size={18} />
              </button>
              <button
                type="button"
                aria-label={`Supprimer ${a.label}`}
                onClick={() => {
                  deleteAddress(user.id, a.id);
                  toast({ title: "Adresse supprimée", description: a.label, tone: "info", icon: "delete" });
                }}
                className="grid size-9 place-items-center rounded-full text-on-surface-variant hover:bg-error-container/50 hover:text-error"
              >
                <Icon name="delete" size={18} />
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function PaymentPanel({ user }: { user: UserProfile }) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-3 rounded-xl bg-surface-container-low p-3.5">
        <Icon name="check_circle" fill size={20} className="text-primary-container" />
        <div className="flex-1">
          <p className="text-label-lg text-on-surface">Espèces à la livraison</p>
          <p className="text-body-sm text-on-surface-variant">Règlement en mains propres lors de la remise</p>
        </div>
        <Icon name="account_balance_wallet" size={20} className="text-primary" />
      </div>
      <div className="flex items-center gap-3 rounded-xl border border-dashed border-outline-variant/70 p-3.5 opacity-70">
        <Icon name="circle" size={20} className="text-outline-variant" />
        <div className="flex-1">
          <p className="text-label-lg text-on-surface">Carte CIB / Edahabia</p>
          <p className="text-body-sm text-on-surface-variant">Paiement électronique SATIM — bientôt disponible</p>
        </div>
        <Icon name="credit_card" size={20} className="text-outline" />
      </div>
      <label className="mt-1 flex flex-col gap-1.5 rounded-xl bg-surface-container-low/60 p-3.5">
        <span className="text-label-md text-on-surface-variant">Précision monnaie (préremplie au paiement)</span>
        <select
          value={user.changePreference}
          aria-label="Précision monnaie"
          onChange={(e) => {
            updateProfile(user.id, { changePreference: e.target.value as ChangePreference });
            toast({ title: "Préférence enregistrée", description: CHANGE_LABELS[e.target.value as ChangePreference], icon: "payments" });
          }}
          className="h-10 cursor-pointer rounded-lg bg-surface-container-lowest px-3 text-label-lg text-primary outline-none ring-1 ring-outline-variant/40 focus:ring-primary-container"
        >
          {Object.entries(CHANGE_LABELS).map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

export function PreferencesPanel({ user }: { user: UserProfile }) {
  const toggle = (label: string) => {
    const next = user.preferences.includes(label) ? user.preferences.filter((p) => p !== label) : [...user.preferences, label];
    updateProfile(user.id, { preferences: next });
  };
  return (
    <div>
      <p className="mb-3 text-body-sm text-on-surface-variant">Vos instructions permanentes appliquées par notre brigade pour chaque plat préparé à la minute.</p>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Préférences culinaires">
        {PREFERENCE_OPTIONS.map((p) => {
          const active = user.preferences.includes(p.label);
          return (
            <button
              key={p.label}
              type="button"
              aria-pressed={active}
              onClick={() => toggle(p.label)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-label-md transition-colors",
                active ? "border-secondary/40 bg-secondary/10 text-on-secondary-fixed-variant" : "border-outline-variant/60 text-on-surface-variant hover:border-primary/40",
              )}
            >
              <Icon name={active ? p.icon : "add"} size={15} className={active ? "text-secondary" : ""} />
              {p.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
