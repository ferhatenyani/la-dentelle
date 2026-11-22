import { expect, test } from "@playwright/test";
import { seedState } from "./helpers";

/**
 * Responsive smoke test: every route at reference and intermediate widths must render
 * without horizontal overflow and without console / hydration errors.
 */
const ROUTES = [
  "/",
  "/menu",
  "/menu?categorie=douceurs&labels=vegetarien",
  "/menu/couscous-royal-constantinois",
  "/menu/cherbet-citron-boufarik",
  "/panier",
  "/commande",
  "/compte",
  "/compte/commandes",
  "/suivi?id=LD-84920",
  "/favoris",
  "/connexion",
  "/connexion?mode=inscription",
  "/route-inexistante",
];
const WIDTHS = [360, 768, 1024, 1280];

test.describe("Responsive layout smoke test", () => {
  test.skip(({ isMobile }) => !!isMobile, "viewport sizes are set explicitly; run once in the desktop project");

  for (const width of WIDTHS) {
    test(`all routes render cleanly at ${width}px`, async ({ page }) => {
      test.setTimeout(120_000);
      await page.setViewportSize({ width, height: 900 });
      await seedState(page, { loggedIn: true, cart: [{ slug: "rechta-imperiale", quantity: 2 }, { slug: "the-menthe-timimoun", quantity: 1 }] });
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(`${page.url()} → ${e.message.split("\n")[0]}`));
      page.on("console", (m) => {
        if (m.type() === "error" && !/404 \(Not Found\)|Failed to load resource/.test(m.text())) errors.push(`${page.url()} → ${m.text().split("\n")[0]}`);
      });
      for (const route of ROUTES) {
        await page.goto(route);
        await page.waitForLoadState("networkidle");
        // Next keeps previously visited routes mounted but hidden (<Activity>), so scope to the visible one.
        await expect(page.locator("main").locator("visible=true")).toHaveCount(1);
        const overflow = await page.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth);
        expect.soft(overflow, `${route} overflows horizontally at ${width}px`).toBeLessThanOrEqual(1);
      }
      expect(errors, errors.join("\n")).toEqual([]);
    });
  }
});
