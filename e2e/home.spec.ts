import { expect, test } from "@playwright/test";
import { expectNoHorizontalOverflow, isMobile } from "./helpers";

test.describe("Landing page", () => {
  test("renders the layout for the current viewport without overflow", async ({ page }) => {
    await page.goto("/");
    if (isMobile(page)) {
      await expect(page.getByTestId("mobile-title")).toHaveText("Accueil");
      await expect(page.getByRole("heading", { name: "Nos Signatures du Terroir" })).toBeVisible();
      await expect(page.getByRole("navigation", { name: "Navigation mobile" })).toBeVisible();
      await expect(page.getByTestId("home-desktop")).toBeHidden();
    } else {
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      for (const name of ["Sandwiches Gastronomiques & Pain Matlouh Artisanal", "Pâtisseries & Douceurs de la Casbah", "Grands Plats de Terroir & Spécialités d'Honneur"]) {
        await expect(page.getByRole("heading", { name })).toBeVisible();
      }
      await expect(page.getByTestId("home-desktop").getByTestId("product-card")).toHaveCount(12);
    }
    await expectNoHorizontalOverflow(page);
  });

  test("hero carousel navigates between slides", async ({ page }) => {
    test.skip(isMobile(page), "desktop-only carousel");
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Sandwiches");
    await page.getByRole("button", { name: "Slide suivant" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Haute Pâtisserie");
    await page.getByRole("button", { name: "Aller au slide 3" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Livraison Express");
  });

  test("delivery estimator validates the commune", async ({ page }) => {
    test.skip(isMobile(page), "desktop-only section");
    await page.goto("/");
    const input = page.getByLabel("Votre quartier ou adresse");
    await input.fill("El Biar");
    await page.getByRole("button", { name: "Vérifier" }).click();
    await expect(page.getByTestId("estimate-result")).toContainText("35–40 min");
    await input.fill("Oran");
    await page.getByRole("button", { name: "Vérifier" }).click();
    await expect(page.getByTestId("estimate-result")).toContainText("pas encore desservie");
  });

  test("navigates to catalogue and product details", async ({ page }) => {
    await page.goto("/");
    if (isMobile(page)) {
      await page.getByRole("navigation", { name: "Navigation mobile" }).getByRole("link", { name: "Carte & Offres" }).click();
    } else {
      await page.getByRole("navigation", { name: "Navigation principale" }).getByRole("link", { name: "Menu & Commandes" }).click();
    }
    await expect(page).toHaveURL(/\/menu$/);
    await page.getByTestId("product-card").locator("visible=true").first().getByRole("link").first().click();
    await expect(page).toHaveURL(/\/menu\/[a-z-]+$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});

test("tablet navigation is reachable through the menu sheet", async ({ page, isMobile }) => {
  test.skip(!!isMobile, "tablet viewport set explicitly");
  await page.setViewportSize({ width: 820, height: 1100 });
  await page.goto("/");
  await page.getByRole("button", { name: "Ouvrir le menu" }).click();
  await page.getByRole("navigation", { name: "Navigation tablette" }).getByRole("link", { name: "Suivi en Direct" }).click();
  await expect(page).toHaveURL(/\/suivi$/);
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
