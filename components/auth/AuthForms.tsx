"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState, type FormEvent } from "react";
import { cn } from "@/lib/cn";
import { DEMO_OTP } from "@/lib/data/seed";
import { formatPhone, isValidAlgerianMobile, isValidEmail, normalizePhone } from "@/lib/format";
import { loginWithPassword, requestOtp, signup, verifyOtp, type AuthResult } from "@/lib/store/actions";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Field, TextField, inputClasses } from "@/components/ui/Field";
import { toast } from "@/components/ui/Toast";

type Errors = Record<string, string | undefined>;

export function AlgeriaFlag({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 30 20" className={cn("h-3.5 w-5 shrink-0 rounded-[2px] shadow-sm", className)} aria-hidden>
      <rect width="15" height="20" fill="#006233" />
      <rect x="15" width="15" height="20" fill="#fff" />
      <circle cx="15" cy="10" r="5" fill="#d21034" />
      <circle cx="16.3" cy="10" r="4" fill="#fff" />
      <path d="M17.2 10l3.6-1.2-2.2 3.1V8.1l2.2 3.1z" fill="#d21034" />
    </svg>
  );
}

/** +213 prefix + national number input (auth-desktop / auth-mobile phone field). */
export function PhoneInput({
  id,
  value,
  onChange,
  invalid,
  describedBy,
  autoFocus,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  invalid?: boolean;
  describedBy?: string;
  autoFocus?: boolean;
}) {
  return (
    <div className="flex gap-2">
      <span className="flex h-12 shrink-0 items-center gap-2 rounded-lg bg-surface-container-low px-3 text-label-lg text-on-surface" aria-hidden>
        <AlgeriaFlag /> +213
      </span>
      <input
        id={id}
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        placeholder="550 12 34 56"
        value={value}
        autoFocus={autoFocus}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        onChange={(e) => onChange(e.target.value.replace(/[^\d\s+]/g, "").slice(0, 16))}
        className={cn(inputClasses, "tabular tracking-wide")}
      />
    </div>
  );
}

function FormError({ message }: { message?: string }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.p
          role="alert"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="flex items-start gap-2 rounded-lg bg-error-container px-3 py-2.5 text-body-sm text-on-error-container"
        >
          <Icon name="error" size={18} className="mt-px" /> <span>{message}</span>
        </motion.p>
      )}
    </AnimatePresence>
  );
}

function useSubmit(onSuccess: (r: Extract<AuthResult, { ok: true }>) => void) {
  const [pending, setPending] = useState(false);
  const run = async (fn: () => Promise<AuthResult>, onError: (r: Extract<AuthResult, { ok: false }>) => void) => {
    setPending(true);
    try {
      const r = await fn();
      if (r.ok) onSuccess(r);
      else onError(r);
    } finally {
      setPending(false);
    }
  };
  return { pending, run };
}

// ---------------------------------------------------------------------------- Login

export function LoginForm({ onAuthenticated, onSwitchToSignup }: { onAuthenticated: (name: string) => void; onSwitchToSignup: () => void }) {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [emailOpen, setEmailOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [cooldown, setCooldown] = useState(0);
  const { pending, run } = useSubmit((r) => onAuthenticated(r.user.firstName));

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  // Step 1: request an SMS code, then move to the OTP step.
  const [otpPending, setOtpPending] = useState(false);
  const sendCodeAndAdvance = async (e: FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return setErrors({ phone: "Veuillez saisir votre numéro de mobile." });
    if (!isValidAlgerianMobile(phone)) return setErrors({ phone: "Numéro invalide : 9 chiffres commençant par 5, 6 ou 7 (ex. 550 12 34 56)." });
    setErrors({});
    setOtpPending(true);
    const r = await requestOtp(phone);
    setOtpPending(false);
    if (!r.ok) return setErrors({ phone: r.error });
    setStep("otp");
    setCooldown(30);
    toast({ title: "Code envoyé par SMS", description: `Au +213 ${formatPhone(normalizePhone(phone))}`, icon: "sms", tone: "info" });
  };

  const verify = (e: FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(otp)) return setErrors({ otp: "Le code contient 6 chiffres." });
    setErrors({});
    run(
      () => verifyOtp(phone, otp),
      (r) => setErrors({ otp: r.error }),
    );
  };

  const emailLogin = (e: FormEvent) => {
    e.preventDefault();
    const next: Errors = {};
    if (!isValidEmail(email)) next.email = "Adresse email invalide.";
    if (!password) next.password = "Veuillez saisir votre mot de passe.";
    setErrors(next);
    if (Object.keys(next).length) return;
    run(
      () => loginWithPassword(email, password),
      (r) => setErrors({ password: r.error }),
    );
  };

  return (
    <div className="flex flex-col gap-5">
      <AnimatePresence mode="wait" initial={false}>
        {step === "phone" ? (
          <motion.form
            key="phone"
            noValidate
            onSubmit={sendCodeAndAdvance}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            className="flex flex-col gap-4"
            aria-label="Connexion par numéro de mobile"
          >
            <Field label="Numéro de mobile" error={errors.phone} aside={<span className="text-body-sm text-on-surface-variant">Format Algérie (+213)</span>}>
              {({ id, describedBy, invalid }) => (
                <PhoneInput id={id} value={phone} onChange={setPhone} invalid={invalid} describedBy={describedBy} />
              )}
            </Field>
            <p className="-mt-1 flex items-center gap-2 text-body-sm text-on-surface-variant">
              <Icon name="sms" size={18} /> Un code de vérification SMS instantané vous sera envoyé.
            </p>
            <Button type="submit" size="lg" icon="send" loading={otpPending} variant="solid" className="w-full">
              Recevoir mon code de confirmation
            </Button>
          </motion.form>
        ) : (
          <motion.form
            key="otp"
            noValidate
            onSubmit={verify}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            className="flex flex-col gap-4"
            aria-label="Vérification du code SMS"
          >
            <div className="flex items-center justify-between gap-3 rounded-xl bg-surface-container-low px-4 py-3">
              <p className="text-body-sm text-on-surface-variant">
                Code envoyé au <strong className="text-on-surface">+213 {formatPhone(normalizePhone(phone))}</strong>
              </p>
              <button
                type="button"
                onClick={() => {
                  setStep("phone");
                  setOtp("");
                  setErrors({});
                }}
                className="shrink-0 text-label-md font-bold text-primary hover:underline"
              >
                Modifier
              </button>
            </div>
            <TextField
              label="Code de confirmation"
              error={errors.otp}
              hint={
                <>
                  Démo : utilisez le code <strong className="tabular text-primary">{DEMO_OTP}</strong>
                </>
              }
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="• • • • • •"
              autoFocus
              className="tabular text-center text-headline-sm tracking-[0.5em]"
            />
            <Button type="submit" size="lg" icon="lock" loading={pending} variant="solid" className="w-full">
              Vérifier et me connecter
            </Button>
            <button
              type="button"
              disabled={cooldown > 0}
              onClick={async () => {
                await requestOtp(phone);
                setCooldown(30);
                toast({ title: "Nouveau code envoyé", icon: "sms", tone: "info" });
              }}
              className="text-label-md text-on-surface-variant enabled:hover:text-primary disabled:opacity-60"
            >
              {cooldown > 0 ? `Renvoyer le code dans ${cooldown}s` : "Renvoyer le code"}
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {step === "phone" && (
        <div>
          <button
            type="button"
            aria-expanded={emailOpen}
            aria-controls="email-login"
            onClick={() => setEmailOpen((o) => !o)}
            className="mx-auto flex items-center gap-2 rounded-lg px-3 py-2 text-label-lg text-on-surface hover:bg-surface-container-low"
          >
            <Icon name="mail" size={20} />
            <span className="hidden xs:inline">Ou se connecter par Email &amp; Mot de passe</span>
            <span className="xs:hidden">Connexion par email</span>
            <Icon name="expand_more" size={20} className={cn("transition-transform", emailOpen && "rotate-180")} />
          </button>
          <AnimatePresence initial={false}>
            {emailOpen && (
              <motion.form
                id="email-login"
                noValidate
                onSubmit={emailLogin}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
                aria-label="Connexion par email"
              >
                <div className="flex flex-col gap-4 pt-4">
                  <TextField
                    label="Adresse email"
                    type="email"
                    autoComplete="email"
                    icon="alternate_email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    error={errors.email}
                    placeholder="vous@exemple.dz"
                  />
                  <Field
                    label="Mot de passe"
                    error={errors.password}
                    aside={
                      <button
                        type="button"
                        className="text-label-md font-bold text-primary hover:underline"
                        onClick={() => toast({ title: "Lien de réinitialisation envoyé", description: "Consultez votre boîte email.", icon: "mail", tone: "info" })}
                      >
                        Oublié ?
                      </button>
                    }
                  >
                    {({ id, describedBy, invalid }) => (
                      <div className="relative">
                        <input
                          id={id}
                          type={showPassword ? "text" : "password"}
                          autoComplete="current-password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          aria-invalid={invalid || undefined}
                          aria-describedby={describedBy}
                          className={cn(inputClasses, "pr-12")}
                        />
                        <button
                          type="button"
                          aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                          onClick={() => setShowPassword((s) => !s)}
                          className="absolute right-1.5 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full text-outline hover:text-primary"
                        >
                          <Icon name={showPassword ? "visibility_off" : "visibility"} size={20} />
                        </button>
                      </div>
                    )}
                  </Field>
                  <Button type="submit" variant="outline" size="lg" loading={pending} className="w-full">
                    Connexion Email
                  </Button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      )}
      <p className="text-center text-body-sm text-on-surface-variant">
        Nouveau chez nous ?{" "}
        <button type="button" onClick={onSwitchToSignup} className="font-bold text-primary hover:underline">
          Créer un compte
        </button>
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------- Signup

export function SignupForm({ onAuthenticated }: { onAuthenticated: (name: string) => void }) {
  const [form, setForm] = useState({ firstName: "", lastName: "", phone: "", email: "", password: "", terms: false });
  const [errors, setErrors] = useState<Errors>({});
  const [showPassword, setShowPassword] = useState(false);
  const { pending, run } = useSubmit((r) => onAuthenticated(r.user.firstName));
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next: Errors = {};
    if (form.firstName.trim().length < 2) next.firstName = "Prénom requis.";
    if (form.lastName.trim().length < 2) next.lastName = "Nom requis.";
    if (!isValidAlgerianMobile(form.phone)) next.phone = "Numéro algérien invalide (ex. 550 12 34 56).";
    if (!isValidEmail(form.email)) next.email = "Adresse email invalide.";
    if (form.password.length < 8 || !/\d/.test(form.password)) next.password = "8 caractères minimum, dont au moins un chiffre.";
    if (!form.terms) next.terms = "Veuillez accepter les conditions générales.";
    setErrors(next);
    if (Object.keys(next).length) {
      const first = Object.keys(next)[0];
      document.querySelector<HTMLElement>(`[data-field="${first}"] input`)?.focus();
      return;
    }
    run(
      () => signup(form),
      (r) => setErrors({ [r.field ?? "form"]: r.error }),
    );
  };

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-4" aria-label="Création de compte">
      <div className="grid gap-4 sm:grid-cols-2">
        <div data-field="firstName">
          <TextField label="Prénom" autoComplete="given-name" value={form.firstName} onChange={set("firstName")} error={errors.firstName} />
        </div>
        <div data-field="lastName">
          <TextField label="Nom" autoComplete="family-name" value={form.lastName} onChange={set("lastName")} error={errors.lastName} />
        </div>
      </div>
      <div data-field="phone">
        <Field label="Numéro de mobile" error={errors.phone}>
          {({ id, describedBy, invalid }) => (
            <PhoneInput id={id} value={form.phone} onChange={(v) => setForm((f) => ({ ...f, phone: v }))} invalid={invalid} describedBy={describedBy} />
          )}
        </Field>
      </div>
      <div data-field="email">
        <TextField label="Adresse email" type="email" autoComplete="email" icon="alternate_email" value={form.email} onChange={set("email")} error={errors.email} placeholder="vous@exemple.dz" />
      </div>
      <div data-field="password">
        <Field label="Mot de passe" error={errors.password} hint="8 caractères minimum, dont un chiffre.">
          {({ id, describedBy, invalid }) => (
            <div className="relative">
              <input
                id={id}
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={form.password}
                onChange={set("password")}
                aria-invalid={invalid || undefined}
                aria-describedby={describedBy}
                className={cn(inputClasses, "pr-12")}
              />
              <button
                type="button"
                aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-1.5 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full text-outline hover:text-primary"
              >
                <Icon name={showPassword ? "visibility_off" : "visibility"} size={20} />
              </button>
            </div>
          )}
        </Field>
      </div>
      <div data-field="terms">
        <label className="flex cursor-pointer items-start gap-3 text-body-sm text-on-surface-variant">
          <input
            type="checkbox"
            checked={form.terms}
            onChange={set("terms")}
            aria-invalid={!!errors.terms || undefined}
            className="mt-0.5 size-5 shrink-0 cursor-pointer appearance-none rounded-md border-[1.5px] border-primary-container bg-surface-container-lowest bg-center bg-no-repeat checked:border-primary-container checked:bg-primary-container checked:bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22><path fill=%22none%22 stroke=%22%23fed269%22 stroke-width=%223%22 d=%22M5 12.5l4.5 4.5L19 7.5%22/></svg>')] aria-[invalid=true]:border-error"
          />
          <span>
            J&apos;accepte les Conditions Générales et la politique de confidentialité de La Dentelle.
          </span>
        </label>
        {errors.terms && (
          <p role="alert" className="mt-1.5 text-body-sm text-error">
            {errors.terms}
          </p>
        )}
      </div>
      <FormError message={errors.form} />
      <Button type="submit" size="lg" icon="person_add" loading={pending} variant="solid" className="w-full">
        Créer mon compte
      </Button>
    </form>
  );
}
