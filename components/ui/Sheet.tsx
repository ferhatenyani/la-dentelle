"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";
import { useHydrated } from "@/lib/store/store";
import { Icon } from "./Icon";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

/**
 * Accessible dialog: bottom sheet on mobile, centred modal on md+.
 * Focus moves into the dialog, Escape closes, body scroll is locked.
 */
export function Sheet({ open, onClose, title, description, children, footer, className }: SheetProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const hydrated = useHydrated();

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && panelRef.current) {
        const f = panelRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]),[href],input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])',
        );
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => {
      // On touch screens, focusing a field would pop the keyboard over the sheet as it opens.
      const touch = window.matchMedia("(pointer: coarse)").matches;
      const field = touch ? null : panelRef.current?.querySelector<HTMLElement>("input,select,textarea");
      if (field) field.focus();
      else panelRef.current?.focus();
    }, 50);
    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, [open, onClose]);

  if (!hydrated) return null;
  // Bottom sheet rises from the screen edge on phones; centred modal scales in on md+.
  const mobile = window.matchMedia("(max-width: 767px)").matches;
  const hidden = mobile ? { y: "100%" } : { y: 16, scale: 0.97, opacity: 0 };

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center md:items-center md:p-6">
          <motion.div
            className="absolute inset-0 bg-on-surface/45 md:backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            initial={hidden}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ ...hidden, transition: { duration: 0.22, ease: [0.4, 0, 1, 1] } }}
            transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "relative flex max-h-[92dvh] w-full flex-col rounded-t-3xl bg-surface-container-lowest shadow-float outline-none md:max-w-lg md:rounded-3xl",
              className,
            )}
          >
            <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-outline-variant md:hidden" aria-hidden />
            <div className="flex items-start justify-between gap-4 px-6 pb-2 pt-4 md:pt-6">
              <div>
                <h2 id={titleId} className="text-headline-sm font-bold text-primary">
                  {title}
                </h2>
                {description && <p className="mt-1 text-body-sm text-on-surface-variant">{description}</p>}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fermer"
                className="grid size-10 shrink-0 place-items-center rounded-full text-on-surface-variant hover:bg-surface-container"
              >
                <Icon name="close" size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-3">{children}</div>
            {footer && <div className="border-t border-outline-variant/30 px-6 py-4 pb-safe">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
