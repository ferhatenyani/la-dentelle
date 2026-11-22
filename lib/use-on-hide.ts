"use client";

import { useLayoutEffect, useRef } from "react";

/**
 * Runs `fn` when the component is hidden by Next's route <Activity> (or unmounted).
 * Next 16 keeps visited routes mounted but hidden, so transient UI state (open sheets,
 * pending overlays) must be reset explicitly — see docs/01-app/02-guides/preserving-ui-state.md.
 */
export function useOnHide(fn: () => void) {
  const ref = useRef(fn);
  useLayoutEffect(() => {
    ref.current = fn;
  });
  useLayoutEffect(() => () => ref.current(), []);
}
