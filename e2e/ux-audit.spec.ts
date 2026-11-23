import { expect, test, type Page } from "@playwright/test";
import { SEED_USER } from "../lib/data/seed";
import { findCutOffContent, seedState } from "./helpers";

const PHONE_WIDTHS = [320, 360, 375, 390];

const ROUTES = [
  "/",
  "/menu",
  "/menu/couscous-royal-constantinois",
  "/panier",
  "/commande",
  "/compte",
  "/compte/commandes",
  "/suivi?id=LD-84920",
  "/favoris",
  "/connexion",
  "/connexion?mode=inscription",
];

async function expectNothingCutOff(page: Page, label: string) {
  expect(await findCutOffContent(page), `${label}: content cut off`).toEqual([]);
}

test.describe("Small phones: nothing is cut off", () => {
  test.skip(({ isMobile }) => !isMobile, "phone widths only");

  for (const width of PHONE_WIDTHS) {
    test(`login & signup, every state, at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await seedState(page);
      await page.goto("/connexion");
      await expectNothingCutOff(page, "phone step");

      await page.getByRole("button", { name: /email/i }).first().click();
      await expect(page.getByRole("textbox", { name: "Adresse email" })).toBeVisible();
      await expectNothingCutOff(page, "email expanded");

      await page.getByLabel("Numéro de mobile", { exact: true }).fill(SEED_USER.phone);
      await page.getByRole("button", { name: /Recevoir mon code/ }).click();
      await expect(page.getByLabel("Code de confirmation")).toBeVisible();
      await expectNothingCutOff(page, "OTP step");

      await page.getByRole("tab", { name: "Créer un compte" }).click();
      await page.getByRole("button", { name: "Créer mon compte" }).click(); // all errors visible
      await expect(page.getByText("Prénom requis.")).toBeVisible();
      await expectNothingCutOff(page, "signup with errors");
    });
  }

  test("every route at 360px", async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: 360, height: 800 });
    await seedState(page, { loggedIn: true, cart: [{ slug: "rechta-imperiale", quantity: 2 }] });
    for (const route of ROUTES) {
      await page.goto(route);
      await page.waitForLoadState("networkidle");
      await expectNothingCutOff(page, route);
    }
  });
});

test.describe("Dead ends & basics", () => {
  test("every internal link on the main pages resolves", async ({ page, request }) => {
    test.setTimeout(90_000);
    await seedState(page, { loggedIn: true, cart: [{ slug: "rechta-imperiale", quantity: 1 }] });
    const hrefs = new Set<string>();
    for (const route of ["/", "/menu", "/menu/rechta-imperiale", "/panier", "/compte", "/favoris", "/connexion"]) {
      await page.goto(route);
      await page.waitForLoadState("networkidle");
      const found = await page.locator("a[href]").evaluateAll((as) => as.map((a) => a.getAttribute("href") ?? ""));
      for (const h of found) {
        expect(h, `empty/placeholder link on ${route}`).not.toMatch(/^(#|javascript:)?$/);
        if (h.startsWith("/")) hrefs.add(h.split("#")[0]);
      }
    }
    for (const h of hrefs) {
      const res = await request.get(h);
      expect(res.status(), `${h} is broken`).toBeLessThan(400);
    }
  });

  test("every visible control has an accessible name and images load", async ({ page }) => {
    test.setTimeout(90_000);
    await seedState(page, { loggedIn: true, cart: [{ slug: "rechta-imperiale", quantity: 1 }] });
    for (const route of ROUTES) {
      await page.goto(route);
      await page.waitForLoadState("networkidle");
      const problems = await page.evaluate(() => {
        const out: string[] = [];
        for (const el of document.querySelectorAll<HTMLElement>("a, button, input:not([type=hidden]), select, textarea, [role=tab]")) {
          if (!el.checkVisibility()) continue;
          const labels = (el as HTMLInputElement).labels;
          const name = el.getAttribute("aria-label") || el.getAttribute("aria-labelledby") || el.textContent?.trim() || labels?.[0]?.textContent?.trim();
          if (!name) out.push(`unnamed ${el.outerHTML.slice(0, 100)}`);
        }
        for (const img of document.querySelectorAll("img")) {
          if (img.checkVisibility() && img.complete && img.naturalWidth === 0) out.push(`broken image ${img.src}`);
        }
        return out;
      });
      expect(problems, route).toEqual([]);
    }
  });

  test("tap targets are at least 32px on phones", async ({ page, isMobile }) => {
    test.skip(!isMobile, "touch only");
    test.setTimeout(90_000);
    await seedState(page);
    for (const route of ["/", "/menu", "/menu/couscous-royal-constantinois", "/connexion", "/favoris"]) {
      await page.goto(route);
      await page.waitForLoadState("networkidle");
      const small = await page.evaluate(() => {
        // Effective size includes an invisible ::before hit-area if present, and is measured inside <main>.
        const main = [...document.querySelectorAll("main")].find((m) => m.checkVisibility());
        if (!main) return [];
        return [...main.querySelectorAll<HTMLElement>("a, button, [role=tab]")]
          .filter((el) => el.checkVisibility() && !el.closest("[aria-hidden=true]"))
          .map((el) => {
            const r = el.getBoundingClientRect();
            const before = getComputedStyle(el, "::before");
            const after = getComputedStyle(el, "::after");
            const grow = before.content !== "none" && before.position === "absolute" ? -2 * (parseFloat(before.top) || 0) : 0;
            // "Stretched" links cover their whole card with an ::after overlay: the card is the target.
            if (after.content !== "none" && after.position === "absolute") return { label: "", w: 999, h: 999 };
            return { label: (el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 40), w: r.width + grow, h: r.height + grow };
          })
          .filter(({ w, h }) => w > 0 && (w < 32 || h < 32))
          .map(({ label, w, h }) => `${Math.round(w)}×${Math.round(h)} "${label}"`);
      });
      expect(small, route).toEqual([]);
    }
  });

  test("signing in from a page returns to that page", async ({ page }) => {
    await seedState(page, { cart: [{ slug: "rechta-imperiale", quantity: 1 }] });
    await page.goto("/panier");
    await page.getByRole("link", { name: "Se connecter" }).first().click();
    await expect(page).toHaveURL(/\/connexion\?next=%2Fpanier/);
    await page.getByRole("button", { name: /email/i }).first().click();
    // Role query skips the hidden (Activity-cached) shop footer newsletter field, also labelled "Adresse email".
    await page.getByRole("textbox", { name: "Adresse email" }).fill(SEED_USER.email);
    await page.getByLabel("Mot de passe", { exact: true }).fill(SEED_USER.password);
    await page.getByRole("button", { name: "Connexion Email" }).click();
    await expect(page).toHaveURL(/\/panier$/);
  });

  test("filters sheet opens without popping the keyboard and closes with Escape", async ({ page, isMobile }) => {
    test.skip(!isMobile, "bottom sheet is the mobile filter UI");
    await page.goto("/menu");
    await page.getByRole("button", { name: "Filtres et tri" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    const focusedTag = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedTag, "no text field focused on open (would raise the keyboard)").not.toMatch(/INPUT|TEXTAREA/);
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
  });

  test("empty and unknown states always offer a way forward", async ({ page }) => {
    await seedState(page);
    const cases: [string, RegExp][] = [
      ["/panier", /Découvrir la carte/],
      ["/commande", /Voir la carte/],
      ["/commande/confirmation?id=NOPE", /Retour à la carte/],
      ["/suivi?id=NOPE", /Se connecter/],
      ["/favoris", /Explorer la carte/],
      ["/menu/plat-inexistant", /carte|accueil/i],
    ];
    for (const [route, cta] of cases) {
      await page.goto(route);
      const main = page.locator("main").locator("visible=true");
      await expect(main.getByRole("link", { name: cta }).first(), route).toBeVisible();
    }
  });
});
