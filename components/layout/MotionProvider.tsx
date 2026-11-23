"use client";

import { MotionConfig } from "motion/react";

/** Motion's JS animations honour the OS "reduce motion" setting (CSS ones are handled in globals.css). */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
