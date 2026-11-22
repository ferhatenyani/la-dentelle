"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { COMMUNES } from "@/lib/data/catalog";
import { Icon } from "@/components/ui/Icon";

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z ]/g, " ");

const ALIASES: Record<string, string[]> = {
  hydra: ["hydra", "sidi yahia", "bir mourad rais", "paradou"],
  "el-biar": ["el biar", "telemly", "el mouradia", "mouradia"],
  "alger-centre": ["alger centre", "alger", "didouche", "casbah", "bab el oued"],
  "ben-aknoun": ["ben aknoun", "val d hydra", "val hydra"],
  "dely-ibrahim": ["dely ibrahim", "cheraga", "ouled fayet"],
};

export function findCommune(query: string) {
  const q = norm(query).trim();
  if (q.length < 3) return null;
  const hit = Object.entries(ALIASES).find(([, words]) => words.some((w) => q.includes(w) || w.includes(q)));
  return hit ? COMMUNES.find((c) => c.id === hit[0]) ?? null : null;
}

type Result = { ok: true; name: string; eta: string } | { ok: false; message: string } | null;

/** "Estimez votre heure de dégustation" (home-page-desktop #suivi). */
export function DeliveryEstimator() {
  const [value, setValue] = useState("");
  const [result, setResult] = useState<Result>(null);

  return (
    <section id="suivi" className="relative overflow-hidden rounded-3xl bg-primary p-6 text-white shadow-lg sm:p-10">
      <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full border border-primary-fixed/10" />
      <div aria-hidden className="pointer-events-none absolute -bottom-24 right-32 size-72 rounded-full bg-primary-container/40 blur-2xl" />
      <div className="relative z-10 grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
        <div className="space-y-2 lg:col-span-7">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-container px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary-fixed">
            <Icon name="moped" size={15} /> Coursiers dédiés
          </span>
          <h2 className="text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl">Estimez votre heure de dégustation à Alger</h2>
          <p className="text-sm text-white/80">
            Nos livreurs équipés de caissons thermiques intelligents livrent directement à votre porte à Hydra, Sidi Yahia, El Biar,
            Telemly et environs.
          </p>
        </div>
        <form
          className="lg:col-span-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (value.trim().length < 3) return setResult({ ok: false, message: "Saisissez au moins 3 lettres de votre quartier." });
            const c = findCommune(value);
            setResult(
              c
                ? { ok: true, name: c.name, eta: c.eta }
                : { ok: false, message: "Cette zone n'est pas encore desservie. Nous livrons Hydra, El Biar, Alger Centre, Ben Aknoun et Dely Ibrahim." },
            );
          }}
        >
          <div className="flex flex-col items-stretch gap-2.5 sm:flex-row">
            <label htmlFor="estimate-input" className="sr-only">
              Votre quartier ou adresse
            </label>
            <div className="relative flex-1">
              <Icon name="pin_drop" size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-outline" />
              <input
                id="estimate-input"
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  setResult(null);
                }}
                placeholder="Entrez votre quartier ou adresse..."
                className="h-12 w-full rounded-xl border-0 bg-white pl-10 pr-3 text-sm text-on-surface outline-none placeholder:text-outline focus:ring-2 focus:ring-secondary-container"
              />
            </div>
            <button
              type="submit"
              className="h-12 whitespace-nowrap rounded-xl bg-secondary-container px-6 text-sm font-bold text-on-secondary-fixed shadow-md transition hover:bg-secondary-fixed active:scale-95"
            >
              Vérifier
            </button>
          </div>
          <AnimatePresence mode="wait">
            {result && (
              <motion.p
                key={JSON.stringify(result)}
                role="status"
                data-testid="estimate-result"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-3 flex items-start gap-2 rounded-xl bg-white/10 px-3 py-2.5 text-sm"
              >
                <Icon name={result.ok ? "check_circle" : "info"} size={18} className={result.ok ? "text-secondary-container" : "text-white/80"} />
                {result.ok ? (
                  <span>
                    Livraison à <strong>{result.name}</strong> estimée en <strong>{result.eta}</strong>.
                  </span>
                ) : (
                  <span>{result.message}</span>
                )}
              </motion.p>
            )}
          </AnimatePresence>
        </form>
      </div>
    </section>
  );
}
