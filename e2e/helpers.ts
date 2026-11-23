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

// ---------------------------------------------------------------------------- View transitions

export interface RecordedTransition {
  dir?: string;
  /** "<pseudo-element>|<animation-name>", e.g. "::view-transition-new(_t_3_)|vt-page-in" */
  anims: string[];
}

/** Records every view transition the app starts (Chromium) with its direction and running animations. */
export async function recordViewTransitions(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { __vt: RecordedTransition[] };
    w.__vt = [];
    const start = document.startViewTransition?.bind(document);
    if (!start) return;
    document.startViewTransition = ((arg: Parameters<typeof start>[0]) => {
      const t = start(arg);
      t.ready.then(
        () =>
          w.__vt.push({
            dir: document.documentElement.dataset.navDir,
            anims: document
              .getAnimations()
              .map((a) => `${(a.effect as KeyframeEffect | null)?.pseudoElement ?? ""}|${(a as CSSAnimation).animationName ?? ""}`)
              .filter((s) => s.startsWith("::view-transition")),
          }),
        () => {},
      );
      return t;
    }) as typeof document.startViewTransition;
  });
}

/** Returns (and clears) the transitions recorded since the last call. */
export const takeTransitions = (page: Page) =>
  page.evaluate(() => {
    const w = window as unknown as { __vt: RecordedTransition[] };
    const out = w.__vt;
    w.__vt = [];
    return out;
  });

/** Waits for the next recorded transition after `action`. */
export async function transitionOf(page: Page, action: () => Promise<unknown>) {
  await takeTransitions(page);
  await action();
  let got: RecordedTransition[] = [];
  await expect
    .poll(async () => (got = got.concat(await takeTransitions(page))).length, { message: "a view transition should run" })
    .toBeGreaterThan(0);
  return got[got.length - 1];
}

export const pageAnims = (t: RecordedTransition) => t.anims.filter((a) => /\|vt-(page|fade)/.test(a) && !/\((site-header|mobile-top-bar|bottom-nav|cart-pill|toasts)\)/.test(a));

// ---------------------------------------------------------------------------- Layout

/**
 * Content that sticks out of the viewport. Unlike a scrollWidth check this also catches content
 * silently clipped by an `overflow: hidden` ancestor (the "cut off on the right" bug). Only real
 * content counts (text, controls, media); horizontal scrollers and decorative layers are ignored.
 */
export async function findCutOffContent(page: Page) {
  return page.evaluate(() => {
    const vw = window.innerWidth;
    const main = [...document.querySelectorAll("main")].find((m) => m.checkVisibility()) ?? document.body;
    const inScroller = (el: Element) => {
      for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) if (/auto|scroll/.test(getComputedStyle(a).overflowX)) return true;
      return false;
    };
    const decorative = (el: Element) => !!el.closest('[aria-hidden="true"], [data-testid="tracking-map"]');
    return [...main.querySelectorAll("a, button, input, select, textarea, label, h1, h2, h3, p, img")]
      .filter((el) => el.checkVisibility() && !decorative(el) && !inScroller(el))
      .map((el) => ({ el, r: el.getBoundingClientRect() }))
      .filter(({ r }) => r.width > 0 && (r.right > vw + 1 || r.left < -1))
      .map(({ el, r }) => `<${el.tagName.toLowerCase()}> "${(el.textContent ?? "").trim().slice(0, 40)}" spans ${Math.round(r.left)}→${Math.round(r.right)}px (viewport ${vw}px)`);
  });
}
