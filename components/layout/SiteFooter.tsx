"use client";

import Link from "next/link";
import { useState } from "react";
import { isValidEmail } from "@/lib/format";
import { Icon } from "@/components/ui/Icon";
import { toast } from "@/components/ui/Toast";

/** Desktop footer (all-products-desktop / checkout-desktop footer). Hidden on mobile like the refs. */
export function SiteFooter() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <footer id="a-propos" className="hidden w-full border-t border-outline-variant/30 bg-surface-container-low text-on-surface md:block">
      <div className="mx-auto max-w-[1320px] px-6 py-16">
        <div className="mb-12 grid grid-cols-2 gap-10 lg:grid-cols-5">
          <div className="col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-fixed">
                <Icon name="restaurant" size={20} />
              </span>
              <span className="text-headline-sm font-bold uppercase tracking-tight text-primary">La Dentelle</span>
            </div>
            <p className="max-w-sm text-body-md text-on-surface-variant">
              L&apos;excellence de la haute gastronomie algérienne réinventée au cœur d&apos;Alger. Produits d&apos;exception du terroir,
              safran de Tizi Ouzou, huiles d&apos;olive de Kabylie et agneaux confits des hauts plateaux livrés avec un soin méticuleux.
            </p>
            <div className="pt-2">
              <p className="mb-1.5 text-label-md font-bold uppercase tracking-wider text-secondary">Engagement Qualité &amp; Fraîcheur</p>
              <p className="max-w-sm text-body-sm text-on-surface-variant">
                Circuits courts artisanaux, sélection quotidienne des criées de la baie d&apos;Alger et traçabilité intégrale de nos viandes labellisées.
              </p>
            </div>
          </div>
          <div>
            <h2 className="mb-4 text-base font-bold text-primary">Salons &amp; Horaires</h2>
            <ul className="space-y-2 text-body-md text-on-surface-variant">
              <li>Sidi Yahia (Hydra) · Alger</li>
              <li>Déjeuner : 12h00 – 15h30</li>
              <li>Dîner : 19h00 – 23h30</li>
              <li>Service continu vendredi &amp; samedi</li>
              <li className="pt-2 font-bold text-primary">Salons privés &amp; réceptions sur réservation</li>
            </ul>
          </div>
          <div>
            <h2 className="mb-4 text-base font-bold text-primary">Zone de Livraison Express</h2>
            <ul className="space-y-2 text-body-md text-on-surface-variant">
              <li>Hydra · El Biar · Sidi Yahia</li>
              <li>Alger Centre · Telemly · El Mouradia</li>
              <li>Ben Aknoun · Val d&apos;Hydra · Dely Ibrahim</li>
              <li>Emballages isothermes haute fidélité thermique</li>
            </ul>
          </div>
          <div className="col-span-2 space-y-4 lg:col-span-1">
            <h2 className="text-base font-bold text-primary">Gazette Gourmande</h2>
            <p className="text-body-md text-on-surface-variant">Recevez en avant-première nos créations de saison et nos coffrets dégustation.</p>
            <form
              noValidate
              className="flex flex-col gap-2.5"
              onSubmit={(e) => {
                e.preventDefault();
                if (!isValidEmail(email)) return setError("Veuillez saisir une adresse email valide.");
                setError(null);
                setEmail("");
                toast({ title: "Inscription confirmée", description: "Bienvenue dans la Gazette Gourmande.", icon: "mail" });
              }}
            >
              <label htmlFor="newsletter" className="sr-only">
                Adresse email
              </label>
              <input
                id="newsletter"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Votre adresse email..."
                aria-invalid={!!error || undefined}
                className="rounded-lg border border-outline-variant/40 bg-surface-container-lowest px-3.5 py-2.5 text-body-md text-on-surface shadow-sm outline-none placeholder:text-outline focus:border-primary-container aria-[invalid=true]:border-error"
              />
              {error && <p className="text-body-sm text-error">{error}</p>}
              <button type="submit" className="rounded-lg bg-primary-container px-4 py-2.5 text-label-md font-bold text-on-primary shadow-sm transition-colors hover:bg-primary">
                S&apos;inscrire
              </button>
            </form>
          </div>
        </div>
        <div className="flex flex-col items-center justify-between gap-4 border-t border-outline-variant/20 pt-8 text-label-md text-on-surface-variant lg:flex-row">
          <p>© 2026 La Dentelle Alger. Tous droits réservés. Maison de Haute Gastronomie Algérienne.</p>
          <div className="flex flex-wrap items-center justify-center gap-6 font-medium">
            <Link className="hover:text-primary" href="/menu">Charte de Terroir</Link>
            <Link className="hover:text-primary" href="/menu">Conditions de Commande</Link>
            <Link className="hover:text-primary" href="/compte">Privatisations</Link>
            <a className="hover:text-primary" href="tel:+21323548890">Contactez-nous</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
