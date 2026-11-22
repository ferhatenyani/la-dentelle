"use client";

import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/cn";
import { Icon } from "./Icon";

interface Props {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
}

/** Segmented pill (− value +) from DESIGN.md "Quantity Selector". */
export function QuantitySelector({ value, onChange, min = 1, max = 20, size = "md", label = "Quantité", className }: Props) {
  const btn = size === "sm" ? "size-8" : size === "lg" ? "size-11" : "size-9";
  const width = size === "sm" ? "w-7" : size === "lg" ? "w-10" : "w-8";
  return (
    <div
      role="group"
      aria-label={label}
      className={cn("inline-flex items-center gap-1 rounded-full bg-surface-container-low p-1", className)}
    >
      <button
        type="button"
        aria-label="Diminuer la quantité"
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
        className={cn(
          btn,
          "grid place-items-center rounded-full bg-surface-container-lowest text-primary shadow-sm transition active:scale-90 hover:bg-primary-container hover:text-on-primary disabled:opacity-40 disabled:hover:bg-surface-container-lowest disabled:hover:text-primary",
        )}
      >
        <Icon name="remove" size={18} />
      </button>
      <span data-testid="quantity-value" data-value={value} className={cn(width, "relative h-6 overflow-hidden text-center text-label-lg font-bold text-on-surface tabular")}>
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span
            key={value}
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -12, opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }}
            className="absolute inset-0 grid place-items-center"
            aria-live="polite"
          >
            {value}
          </motion.span>
        </AnimatePresence>
      </span>
      <button
        type="button"
        aria-label="Augmenter la quantité"
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
        className={cn(
          btn,
          "grid place-items-center rounded-full bg-surface-container-lowest text-primary shadow-sm transition active:scale-90 hover:bg-primary-container hover:text-on-primary disabled:opacity-40",
        )}
      >
        <Icon name="add" size={18} />
      </button>
    </div>
  );
}
