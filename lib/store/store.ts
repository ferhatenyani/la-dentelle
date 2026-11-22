"use client";

import { useSyncExternalStore } from "react";
import { SEED_ORDERS, SEED_USER } from "@/lib/data/seed";
import type { CartItem, Order, UserProfile } from "@/lib/types";

/**
 * Tiny persistent store built on useSyncExternalStore.
 *
 * - The server snapshot is the deterministic INITIAL_STATE, so SSR/prerender output never
 *   depends on the browser. After hydration React re-renders with the persisted client state.
 * - State is persisted to localStorage and synchronised across tabs via the `storage` event.
 * - Swap the action implementations (lib/store/actions.ts) for API calls when a backend exists.
 */

export interface AppState {
  version: 1;
  cart: CartItem[];
  favorites: string[];
  users: UserProfile[];
  sessionUserId: string | null;
  orders: Order[];
}

export const STORAGE_KEY = "ladentelle:v1";

export const INITIAL_STATE: AppState = {
  version: 1,
  cart: [],
  favorites: [],
  users: [SEED_USER],
  sessionUserId: null,
  orders: SEED_ORDERS,
};

let state: AppState = INITIAL_STATE;
let loaded = false;
const listeners = new Set<() => void>();

function readStorage(): AppState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_STATE;
    const parsed = JSON.parse(raw) as Partial<AppState>;
    if (parsed.version !== 1) return INITIAL_STATE;
    return { ...INITIAL_STATE, ...parsed };
  } catch {
    return INITIAL_STATE;
  }
}

function ensureLoaded() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  state = readStorage();
}

function emit() {
  listeners.forEach((l) => l());
}

export function getState(): AppState {
  ensureLoaded();
  return state;
}

export function setState(updater: (s: AppState) => AppState) {
  ensureLoaded();
  const next = updater(state);
  if (next === state) return;
  state = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage full or disabled: keep in-memory state */
  }
  emit();
}

function onStorage(e: StorageEvent) {
  if (e.key !== STORAGE_KEY) return;
  state = readStorage();
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}

const getServerState = () => INITIAL_STATE;

export function useAppState(): AppState {
  return useSyncExternalStore(subscribe, getState, getServerState);
}

const noopSubscribe = () => () => {};

/** false during SSR/prerender and hydration, true afterwards. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}
