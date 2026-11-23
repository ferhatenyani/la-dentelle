import { expect, test } from "@playwright/test";
import { isMobile, pageAnims, recordViewTransitions, seedState, takeTransitions, transitionOf } from "./helpers";

/**
 * Route transitions run through the View Transitions API (Chromium here). We assert on the
 * animations the browser actually starts, so a CSS or wiring regression (unnamed pages, wrong
 * direction, chrome sliding with the content) fails loudly instead of silently falling back.
 */
const tab = (page: import("@playwright/test").Page, href: string) => page.locator(`nav[aria-label="Navigation mobile"] a[href="${href}"]`);

test.describe("Page transitions", () => {
  test.beforeEach(async ({ page }) => {
    await recordViewTransitions(page);
  });

  test("forward navigation pushes the new page in from the right", async ({ page }) => {
    await page.goto("/");
    const t = await transitionOf(page, () =>
      isMobile(page) ? tab(page, "/menu").click() : page.locator("header").getByRole("link", { name: "Menu & Commandes" }).click(),
    );
    await expect(page).toHaveURL(/\/menu$/);
    expect(t.dir).toBe("forward");
    expect(pageAnims(t).some((a) => a.endsWith("|vt-page-in"))).toBe(true);
    expect(pageAnims(t).some((a) => a.endsWith("|vt-page-out"))).toBe(true);
  });

  test("nested routes animate too (catalogue → product → catalogue)", async ({ page }) => {
    await page.goto("/menu");
    const card = page.locator('main a[href^="/menu/"]').locator("visible=true").first();
    const forward = await transitionOf(page, () => card.click());
    await expect(page).toHaveURL(/\/menu\/.+/);
    expect(forward.dir).toBe("forward");
    expect(pageAnims(forward).length).toBeGreaterThan(0);
  });

  test("persistent chrome stays anchored while the page slides", async ({ page }) => {
    await page.goto("/");
    const t = await transitionOf(page, () =>
      isMobile(page) ? tab(page, "/favoris").click() : page.locator("header").getByRole("link", { name: "Menu & Commandes" }).click(),
    );
    const chrome = t.anims.filter((a) => /\((site-header|mobile-top-bar)\)/.test(a));
    expect(chrome.filter((a) => /vt-page/.test(a)), "header must not slide with the page").toEqual([]);
  });

  test("switching between shop and login animates in both directions", async ({ page }) => {
    await page.goto("/menu");
    const toLogin = await transitionOf(page, () => page.getByRole("link", { name: "Se connecter" }).first().click());
    await expect(page).toHaveURL(/\/connexion/);
    expect(pageAnims(toLogin).length).toBeGreaterThan(0);

    const back = await transitionOf(page, () =>
      isMobile(page) ? page.getByRole("link", { name: /Passer/ }).click() : page.getByRole("link", { name: /Explorer la carte/ }).first().click(),
    );
    await expect(page).toHaveURL(/\/menu$/);
    expect(pageAnims(back).length).toBeGreaterThan(0);
  });

  test("rapid taps during a transition are not swallowed", async ({ page }) => {
    await page.goto("/");
    if (isMobile(page)) {
      await tab(page, "/menu").click();
      await tab(page, "/favoris").click({ timeout: 2_000 });
      await expect(page).toHaveURL(/\/favoris$/);
    } else {
      await page.locator("header").getByRole("link", { name: "Menu & Commandes" }).click();
      await page.locator("header").getByRole("link", { name: "Suivi en Direct" }).click({ timeout: 2_000 });
      await expect(page).toHaveURL(/\/suivi$/);
    }
  });

  test("reduced motion keeps a crossfade but drops the slide", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const t = await transitionOf(page, () =>
      isMobile(page) ? tab(page, "/menu").click() : page.locator("header").getByRole("link", { name: "Menu & Commandes" }).click(),
    );
    expect(t.anims.filter((a) => /vt-page-(in|out)/.test(a))).toEqual([]);
    expect(pageAnims(t).some((a) => a.endsWith("|vt-fade-in"))).toBe(true);
  });
});

test.describe("Mobile navigation feel", () => {
  test.skip(({ isMobile }) => !isMobile, "mobile chrome only");
  test.beforeEach(async ({ page }) => {
    await recordViewTransitions(page);
  });

  test("tab order sets the slide direction", async ({ page }) => {
    await page.goto("/favoris");
    const toHome = await transitionOf(page, () => tab(page, "/").click());
    expect(toHome.dir).toBe("back");
    const toMenu = await transitionOf(page, () => tab(page, "/menu").click());
    expect(toMenu.dir).toBe("forward");
  });

  test("the tab bar docks out on product pages and back in on return", async ({ page }) => {
    await page.goto("/menu");
    const open = await transitionOf(page, () => page.locator('main a[href^="/menu/"]').locator("visible=true").first().click());
    expect(open.anims.some((a) => a.includes("(bottom-nav)|vt-dock-out"))).toBe(true);
    await expect(page.locator('nav[aria-label="Navigation mobile"]')).toHaveCount(0);

    const back = await transitionOf(page, () => page.getByRole("button", { name: "Retour" }).click());
    await expect(page).toHaveURL(/\/menu$/);
    expect(back.dir).toBe("back");
    expect(back.anims.some((a) => a.includes("(bottom-nav)|vt-dock-in"))).toBe(true);
    expect(pageAnims(back).some((a) => a.endsWith("|vt-page-in"))).toBe(true);
  });

  test("Retour on a deep-linked page stays on the site", async ({ page }) => {
    await page.goto("about:blank");
    await page.goto("/menu/rechta-imperiale");
    await page.getByRole("button", { name: "Retour" }).click();
    await expect(page).toHaveURL(/\/menu$/);
  });

  test("signed-out Profil tab goes straight to login, then back to the profile", async ({ page }) => {
    await seedState(page);
    await page.goto("/");
    await takeTransitions(page);
    await tab(page, "/connexion?next=%2Fcompte").click();
    await expect(page).toHaveURL(/\/connexion\?next=%2Fcompte/);
    await page.waitForTimeout(600);
    expect((await takeTransitions(page)).length, "one transition, not a slide + redirect slide").toBe(1);
  });
});
