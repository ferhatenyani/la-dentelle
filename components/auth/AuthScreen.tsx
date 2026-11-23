"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import { useSessionUser } from "@/lib/store/hooks";
import { useHydrated } from "@/lib/store/store";
import { useOnHide } from "@/lib/use-on-hide";
import { Icon } from "@/components/ui/Icon";
import { toast } from "@/components/ui/Toast";
import { LoginForm, SignupForm } from "./AuthForms";

type Mode = "login" | "signup";

function safeNext(raw: string | null) {
  return raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/compte";
}

function GoogleLogo() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <path fill="#4285F4" d="M22.6 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2.1-1.9 3.3-4.8 3.3-8z" />
      <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.7c-1 .7-2.2 1.1-3.7 1.1-2.9 0-5.3-1.9-6.2-4.5H2.1v2.8A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.8 14.2a6.6 6.6 0 0 1 0-4.3V7H2.1a11 11 0 0 0 0 9.9z" />
      <path fill="#EA4335" d="M12 5.4c1.6 0 3 .6 4.2 1.6l3.1-3.1A11 11 0 0 0 2.1 7l3.7 2.9C6.7 7.3 9.1 5.4 12 5.4z" />
    </svg>
  );
}

function AppleLogo() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden fill="currentColor">
      <path d="M16.4 12.6c0-2.5 2-3.7 2.1-3.7a4.6 4.6 0 0 0-3.6-2c-1.5-.2-3 .9-3.8.9s-2-.9-3.3-.9a4.9 4.9 0 0 0-4.1 2.5c-1.8 3.1-.5 7.6 1.3 10.1.8 1.2 1.8 2.6 3.1 2.5 1.3 0 1.7-.8 3.3-.8s2 .8 3.3.8c1.4 0 2.2-1.3 3-2.5a10 10 0 0 0 1.4-2.8c-.1 0-2.7-1-2.7-4.1zM14 5.2c.7-.8 1.1-2 1-3.2-1 0-2.2.7-2.9 1.5-.6.7-1.2 1.9-1 3 1.1.1 2.2-.5 2.9-1.3z" />
    </svg>
  );
}

function SocialButtons({ stacked }: { stacked?: boolean }) {
  const soon = (provider: string) =>
    toast({ title: `Connexion ${provider} bientôt disponible`, description: "Utilisez votre numéro de mobile en attendant.", tone: "info" });
  const base = "flex h-12 items-center justify-center gap-2.5 rounded-xl text-label-lg text-on-surface transition-colors active:scale-[0.98]";
  return stacked ? (
    <div className="flex flex-col gap-3">
      <button type="button" onClick={() => soon("Apple")} className={cn(base, "h-14 bg-surface-container-lowest shadow-card hover:bg-surface-container-low")}>
        <AppleLogo /> Continuer avec Apple
      </button>
      <button type="button" onClick={() => soon("Google")} className={cn(base, "h-14 bg-surface-container-lowest shadow-card hover:bg-surface-container-low")}>
        <GoogleLogo /> Continuer avec Google
      </button>
    </div>
  ) : (
    <div className="grid grid-cols-2 gap-3">
      <button type="button" onClick={() => soon("Google")} className={cn(base, "bg-surface-container-low hover:bg-surface-container")}>
        <GoogleLogo /> Google
      </button>
      <button type="button" onClick={() => soon("Apple")} className={cn(base, "bg-surface-container-low hover:bg-surface-container")}>
        <AppleLogo /> Apple
      </button>
    </div>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-4" role="separator">
      <span className="h-px flex-1 bg-outline-variant/60" />
      <span className="text-label-md uppercase tracking-wider text-on-surface-variant">{label}</span>
      <span className="h-px flex-1 bg-outline-variant/60" />
    </div>
  );
}

function Tabs({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  return (
    <div role="tablist" aria-label="Accès au compte" className="grid grid-cols-2 rounded-full bg-surface-container-high p-1 shadow-inner">
      {(["login", "signup"] as const).map((m) => (
        <button
          key={m}
          role="tab"
          type="button"
          id={`tab-${m}`}
          aria-selected={mode === m}
          aria-controls="auth-panel"
          onClick={() => onChange(m)}
          className={cn("relative h-11 rounded-full text-label-lg transition-colors", mode === m ? "text-on-primary" : "text-on-surface-variant hover:text-primary")}
        >
          {mode === m && (
            <motion.span layoutId="auth-tab" className="absolute inset-0 rounded-full bg-primary shadow-sm" transition={{ type: "spring", stiffness: 450, damping: 36 }} />
          )}
          <span className="relative">{m === "login" ? "Se Connecter" : "Créer un compte"}</span>
        </button>
      ))}
    </div>
  );
}

export function AuthScreen() {
  const router = useRouter();
  const params = useSearchParams();
  const mode: Mode = params.get("mode") === "inscription" ? "signup" : "login";
  const next = safeNext(params.get("next"));
  const user = useSessionUser();
  const hydrated = useHydrated();
  const justAuthenticated = useRef(false);
  useOnHide(() => {
    justAuthenticated.current = false;
  });

  // Already signed in → go straight to the destination.
  useEffect(() => {
    if (hydrated && user && !justAuthenticated.current) router.replace(next);
  }, [hydrated, user, next, router]);

  const setMode = (m: Mode) => {
    const p = new URLSearchParams(params.toString());
    if (m === "signup") p.set("mode", "inscription");
    else p.delete("mode");
    const qs = p.toString();
    window.history.replaceState(null, "", `/connexion${qs ? `?${qs}` : ""}`);
  };

  const onAuthenticated = (firstName: string) => {
    justAuthenticated.current = true;
    toast({ title: `Bienvenue ${firstName} !`, description: mode === "signup" ? "Votre espace gourmet est prêt." : "Vous êtes connecté.", icon: "check" });
    router.push(next);
  };

  const panel = (
    <div key={mode} id="auth-panel" role="tabpanel" aria-labelledby={`tab-${mode}`} className="animate-swap-in">
      {mode === "login" ? (
        <LoginForm onAuthenticated={onAuthenticated} onSwitchToSignup={() => setMode("signup")} />
      ) : (
        <SignupForm onAuthenticated={onAuthenticated} />
      )}
    </div>
  );

  const guest = (
    <Link href="/menu" className="mx-auto flex items-center gap-2 rounded-lg px-3 py-2 text-center text-label-lg text-primary hover:bg-surface-container-low">
      <Icon name="restaurant_menu" size={20} />
      <span className="md:hidden">Explorer la carte en invité</span>
      <span className="hidden md:inline">Continuer en tant qu&apos;invité (Accès direct à la carte)</span>
    </Link>
  );

  return (
    <div className="flex min-h-dvh w-full items-center justify-center md:p-8 lg:p-12">
      <div className="grid w-full max-w-[1500px] grid-cols-1 overflow-hidden md:min-h-[760px] md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:rounded-3xl md:bg-surface-container-lowest md:shadow-float">
        {/* ---------- Brand panel (desktop) */}
        <aside className="relative hidden flex-col justify-between overflow-hidden bg-primary p-12 text-white md:flex">
          <Image src="/images/auth-bg.jpg" alt="" fill sizes="40vw" className="object-cover opacity-40 mix-blend-luminosity" loading="eager" />
          <div className="absolute inset-0 bg-gradient-to-b from-primary-container/80 via-primary-container/70 to-primary/95" />
          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/60 px-4 py-2 text-label-md uppercase tracking-[0.12em] text-primary-fixed backdrop-blur">
              <Icon name="verified" size={18} className="text-secondary-container" /> Maison fondée à Alger
            </span>
            <div className="mt-10 flex items-center gap-5">
              <Image src="/images/logo.jpg" alt="La Dentelle" width={76} height={76} className="size-[76px] rounded-full shadow-lg ring-2 ring-secondary-container/40" />
              <div>
                <span className="text-label-md uppercase tracking-[0.2em] text-secondary-container">Restaurant étoilé</span>
                <p className="text-headline-lg font-semibold leading-tight">La Dentelle</p>
              </div>
            </div>
          </div>
          <div className="relative">
            <span className="mb-6 block h-1 w-14 rounded-full bg-secondary-container" />
            <blockquote className="max-w-lg text-headline-md font-semibold leading-snug">
              “L&apos;Excellence Gastronomique Algérienne réinventée sous le prisme de la haute précision culinaire.”
            </blockquote>
            <p className="mt-3 text-body-md text-white/75">Constantine • Alger • Oran • Mascara</p>
          </div>
          <div className="relative grid grid-cols-2 gap-x-6 gap-y-3 rounded-2xl bg-primary/40 p-5 backdrop-blur-sm">
            <span className="flex items-center gap-2 text-label-lg">
              <Icon name="workspace_premium" size={20} className="text-secondary-container" /> Terroir certifié
            </span>
            <span className="flex items-center gap-2 text-label-lg">
              <Icon name="concierge" size={20} className="text-secondary-container" /> Conciergerie 7j/7
            </span>
            <p className="col-span-2 text-body-sm text-white/75">Réservations de tables d&apos;exception, salons privés et commandes gastronomiques à emporter.</p>
          </div>
        </aside>

        {/* ---------- Form side */}
        <div className="flex min-w-0 flex-col px-4 pb-10 pt-6 xs:px-5 md:px-12 md:py-12">
          {/* Mobile header (auth-mobile) */}
          <div className="mb-6 flex items-center justify-between md:hidden">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary-fixed/60 px-3 py-1.5 text-label-md uppercase text-on-secondary-fixed-variant">
              <Icon name="hotel_class" size={18} /> Maison fondée à Alger
            </span>
            <Link href="/menu" className="-my-3 -mr-2 flex items-center py-3 pl-3 pr-2 text-label-lg text-primary">
              Passer <Icon name="chevron_right" size={18} />
            </Link>
          </div>
          {/* Desktop top row */}
          <div className="mb-8 hidden items-center justify-between md:flex">
            <span className="flex items-center gap-2 text-label-md uppercase text-on-surface">
              <Icon name="lock" size={20} /> Espace privé sécurisé
            </span>
            <Link href="/menu" className="flex items-center gap-1 text-label-lg text-primary hover:underline">
              Explorer la carte <Icon name="arrow_forward" size={18} />
            </Link>
          </div>

          <div className="mx-auto flex w-full max-w-[560px] flex-1 flex-col gap-6">
            <div className="flex flex-col items-center text-center md:hidden">
              <div className="relative mb-4">
                <Image src="/images/logo.jpg" alt="La Dentelle" width={176} height={176} className="size-36 rounded-full shadow-float ring-4 ring-surface-container-lowest xs:size-44" loading="eager" />
                <span className="absolute bottom-1 right-1 grid size-11 place-items-center rounded-full bg-primary text-on-primary ring-4 ring-surface">
                  <Icon name="restaurant_menu" size={22} />
                </span>
              </div>
              <h1 className="text-headline-lg-mobile font-semibold text-on-surface xs:text-[34px] xs:leading-[42px]">
                {mode === "signup" ? "Rejoignez La Maison" : "Bienvenue à La Maison"}
              </h1>
              <p className="mt-2 text-body-md text-on-surface-variant">
                L&apos;excellence gastronomique algérienne réinventée sous le prisme de la haute précision culinaire.
              </p>
            </div>
            <div className="hidden md:block">
              <span className="text-label-md uppercase tracking-[0.12em] text-secondary">Accès gastronome</span>
              <h1 className="mt-2 text-display text-on-surface">{mode === "signup" ? "Créer votre compte" : "Bienvenue"}</h1>
              <p className="mt-2 max-w-md text-body-lg text-on-surface-variant">
                {mode === "signup"
                  ? "Enregistrez vos adresses à Alger et commandez en deux gestes."
                  : "Connectez-vous pour gérer vos commandes, vos adresses et vos dégustations exclusives."}
              </p>
            </div>

            <Tabs mode={mode} onChange={setMode} />

            <div className="rounded-3xl bg-surface-container-lowest p-5 shadow-card md:rounded-none md:bg-transparent md:p-0 md:shadow-none">{panel}</div>

            {mode === "login" && (
              <>
                <Divider label={"Connexion express"} />
                <div className="md:hidden">
                  <SocialButtons stacked />
                </div>
                <div className="hidden md:block">
                  <SocialButtons />
                </div>
              </>
            )}
            {guest}

            <div className="mt-auto flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-surface-container-low px-5 py-4">
              <span className="flex items-center gap-3">
                <Icon name="security" size={24} className="text-primary" />
                <span className="flex flex-col">
                  <span className="text-label-md text-on-surface">Chiffrement bancaire &amp; RGPD Algérie</span>
                  <span className="text-body-sm text-on-surface-variant">Données confidentielles et strictement protégées</span>
                </span>
              </span>
              <span className="flex items-center gap-1.5 text-label-md text-on-surface">
                <span className="size-2 rounded-full bg-primary-container" /> Service 7j/7
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
