import { expect, test, type Page } from "@playwright/test";
import { PRODUCTS } from "../lib/data/products";
import { isMobile } from "./helpers";

const grid = (page: Page) => page.getByTestId(isMobile(page) ? "catalogue-grid-mobile" : "catalogue-grid");
const cards = (page: Page) => grid(page).getByTestId("product-card");
const visibleSearch = (page: Page) => page.getByRole("searchbox", { name: "Rechercher un plat" }).locator("visible=true");

test.describe("Catalogue", () => {
  test("lists every product", async ({ page }) => {
    await page.goto("/menu");
    await expect(cards(page)).toHaveCount(PRODUCTS.length);
  });

  test("search filters results, ignores accents and shows an empty state", async ({ page }) => {
    await page.goto("/menu");
    await visibleSearch(page).fill("makrout");
    await expect(cards(page)).toHaveCount(PRODUCTS.filter((p) => /makrout/i.test(p.name + p.description)).length);
    await visibleSearch(page).fill("pates fraiches"); // matches "Pâtes fraîches"
    await expect(cards(page)).toHaveCount(1);
    await expect(page).toHaveURL(/q=pates/);
    await visibleSearch(page).fill("pizza");
    await expect(page.getByText("Aucune création ne correspond").locator("visible=true")).toBeVisible();
    await page.getByRole("button", { name: "Réinitialiser les filtres" }).locator("visible=true").click();
    await expect(cards(page)).toHaveCount(PRODUCTS.length);
  });

  test("category and label filters combine", async ({ page }) => {
    await page.goto("/menu");
    const categories = page.getByRole("group", { name: "Catégories" }).locator("visible=true");
    await categories.getByRole("button", { name: /Douceurs/ }).click();
    await expect(cards(page)).toHaveCount(PRODUCTS.filter((p) => p.category === "douceurs").length);
    await expect(page).toHaveURL(/categorie=douceurs/);

    if (isMobile(page)) {
      await page.getByRole("button", { name: "Options Sans Gluten" }).click();
    } else {
      await page.getByRole("group", { name: "Labels" }).getByRole("button", { name: "Sans Gluten" }).click();
    }
    await expect(cards(page)).toHaveCount(PRODUCTS.filter((p) => p.category === "douceurs" && p.labels.includes("sans-gluten")).length);
  });

  test("sorting by price works", async ({ page }) => {
    await page.goto("/menu?categorie=plats");
    if (isMobile(page)) {
      await page.getByRole("button", { name: "Filtres et tri" }).click();
      await page.getByRole("dialog").getByRole("button", { name: "Prix croissant" }).click();
      await page.getByRole("dialog").getByRole("button", { name: /Voir \d+ résultat/ }).click();
    } else {
      await page.getByLabel("Trier :").selectOption("prix-asc");
    }
    const expected = PRODUCTS.filter((p) => p.category === "plats").map((p) => p.price).sort((a, b) => a - b);
    await expect
      .poll(async () => (await cards(page).getByTestId("product-price").allInnerTexts()).map((t) => Number(t.replace(/\D/g, ""))))
      .toEqual(expected);
  });

  test("filters are restored from the URL", async ({ page }) => {
    await page.goto("/menu?categorie=sandwiches&tri=prix-desc");
    await expect(cards(page)).toHaveCount(4);
    await expect(cards(page).first()).toContainText(isMobile(page) ? "Matlouh Agneau" : "Matlouh Épaule d'Agneau");
  });
});
