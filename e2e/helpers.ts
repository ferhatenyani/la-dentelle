import { expect, type Page } from "@playwright/test";
import { SEED_ORDERS, SEED_USER } from "../lib/data/seed";

export const STORAGE_KEY = "ladentelle:v1";

export const isMobile = (page: Page) => (page.viewportSize()?.width ?? 1440) < 768;

/** Seeds localStorage before the app boots (logged-in demo user, optional cart). */
export async function seedState(
  page: Page,
  opts: { loggedIn?: boolean; cart?: { slug: string; quantity: number }[] } = {},
) {
  const state = {
    version: 1,
    cart: opts.cart ?? [],
    favorites: [],
    users: [SEED_USER],
    sessionUserId: opts.loggedIn ? SEED_USER.id : null,
    orders: SEED_ORDERS,
  };
  await page.addInitScript(
    ([key, value]) => {
      if (!window.sessionStorage.getItem("__seeded")) {
        window.localStorage.setItem(key, value);
        window.sessionStorage.setItem("__seeded", "1");
      }
    },
    [STORAGE_KEY, JSON.stringify(state)] as const,
  );
}

export async function readState(page: Page) {
  return page.evaluate((key) => JSON.parse(window.localStorage.getItem(key) ?? "null"), STORAGE_KEY);
}

/** Text helper: our prices use non-breaking spaces ("1 100 DA"). */
export const price = (n: number) => `${n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0")}\u00a0DA`;

export async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow, "page should not scroll horizontally").toBeLessThanOrEqual(1);
}
