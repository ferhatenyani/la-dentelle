"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useSyncExternalStore } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "./Icon";

export interface ToastInput {
  title: string;
  description?: string;
  icon?: string;
  tone?: "success" | "info" | "error";
  action?: { label: string; href: string };
  duration?: number;
}

interface ToastItem extends ToastInput {
  id: number;
}

let toasts: ToastItem[] = [];
let seq = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function toast(input: ToastInput) {
  const item = { ...input, id: ++seq };
  // keep at most 3 visible
  toasts = [...toasts, item].slice(-3);
  emit();
  return item.id;
}

export function dismissToast(id: number) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const EMPTY: ToastItem[] = [];

function ToastCard({ t }: { t: ToastItem }) {
  useEffect(() => {
    const timer = setTimeout(() => dismissToast(t.id), t.duration ?? 3200);
    return () => clearTimeout(timer);
  }, [t.id, t.duration]);

  const tone = t.tone ?? "success";
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40, transition: { duration: 0.18 } }}
      transition={{ type: "spring", stiffness: 420, damping: 32 }}
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "pointer-events-auto flex w-full items-center gap-3 rounded-2xl px-4 py-3 shadow-float border",
        tone === "error" ? "bg-error-container text-on-error-container border-error/20" : "bg-primary text-on-primary border-primary-fixed/30",
      )}
    >
      <span
        className={cn(
          "grid size-8 shrink-0 place-items-center rounded-full",
          tone === "error" ? "bg-error text-on-error" : "bg-secondary-container text-on-secondary-fixed",
        )}
      >
        <Icon name={t.icon ?? (tone === "error" ? "error" : tone === "info" ? "info" : "check")} size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-label-lg font-bold leading-tight">{t.title}</p>
        {t.description && <p className="mt-0.5 text-body-sm opacity-85 truncate">{t.description}</p>}
      </div>
      {t.action && (
        <Link
          href={t.action.href}
          onClick={() => dismissToast(t.id)}
          className="shrink-0 rounded-full bg-secondary-container px-3 py-1.5 text-label-md font-bold text-on-secondary-fixed hover:bg-secondary-fixed"
        >
          {t.action.label}
        </Link>
      )}
      <button
        type="button"
        aria-label="Fermer la notification"
        onClick={() => dismissToast(t.id)}
        className="grid size-7 shrink-0 place-items-center rounded-full opacity-70 hover:opacity-100 hover:bg-white/10"
      >
        <Icon name="close" size={16} />
      </button>
    </motion.div>
  );
}

export function Toaster() {
  const items = useSyncExternalStore(subscribe, () => toasts, () => EMPTY);
  return (
    <div
      aria-live="polite"
      style={{ viewTransitionName: "toasts" }}
      className="pointer-events-none fixed inset-x-0 top-[84px] z-[70] flex flex-col items-center gap-2 px-4 md:inset-x-auto md:right-6 md:top-24 md:w-[380px] md:items-end md:px-0"
    >
      <AnimatePresence initial={false}>
        {items.map((t) => (
          <ToastCard key={t.id} t={t} />
        ))}
      </AnimatePresence>
    </div>
  );
}
