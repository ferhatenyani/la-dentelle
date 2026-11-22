"use client";

import { motion } from "motion/react";

/** Subtle page transition on every navigation within the shop. */
export default function ShopTemplate({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.2, 0.8, 0.2, 1] }}
      className="flex w-full flex-1 flex-col"
    >
      {children}
    </motion.div>
  );
}
