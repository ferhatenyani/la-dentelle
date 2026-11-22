import { expect, test } from "@playwright/test";
import { getProduct } from "../lib/data/products";
import { isMobile, price, readState } from "./helpers";

const rechta = getProduct("rechta-imperiale")!;

test.describe("Product details", () => {
  test("displays product information", async ({ page }) => {
    await page.goto(`/menu/${rechta.slug}`);
    await expect(page.getByRole("heading", { level: 1, name: rechta.name })).toBeVisible();
    await expect(page.getByTestId("product-detail-price")).toHaveText(price(rechta.price));
    await expect(page.getByText(rechta.story)).toBeVisible();
    await expect(page.getByRole("heading", { name: "Ingrédients" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Accords suggérés" })).toBeVisible();
    if (!isMobile(page)) {
      await page.getByRole("button", { name: "Afficher la photo 2" }).click();
      await expect(page.getByRole("img", { name: `${rechta.name} — photo 2` })).toBeVisible();
    }
  });

  test("unknown product returns a not-found page", async ({ page }) => {
    // Streaming render: status may already be 200 when notFound() fires, so assert the UI.
    await page.goto("/menu/plat-inexistant");
    await expect(page.getByRole("heading", { name: "Cette page s'est échappée de la cuisine" })).toBeVisible();
    await page.getByRole("link", { name: "Retour à la carte" }).click();
    await expect(page).toHaveURL(/\/menu$/);
  });

  test("quantity selection updates the total and adds to cart", async ({ page }) => {
    await page.goto(`/menu/${rechta.slug}`);
    const purchase = page.getByRole("group", { name: "Quantité" }).locator("visible=true");
    const total = page.getByTestId("purchase-total").locator("visible=true");
    await expect(total).toHaveText(price(rechta.price));
    await purchase.getByRole("button", { name: "Augmenter la quantité" }).click();
    await purchase.getByRole("button", { name: "Augmenter la quantité" }).click();
    await expect(purchase.getByTestId("quantity-value")).toHaveAttribute("data-value", "3");
    await expect(total).toHaveText(price(rechta.price * 3));
    await purchase.getByRole("button", { name: "Diminuer la quantité" }).click();
    await expect(total).toHaveText(price(rechta.price * 2));

    await page.getByRole("button", { name: /^Ajouter · / }).locator("visible=true").click();
    await expect(page.getByRole("status").filter({ hasText: "ajoutés" })).toBeVisible();
    await expect(page.getByTestId("in-cart").locator("visible=true")).toContainText("Déjà 2 dans votre panier");
    const state = await readState(page);
    expect(state.cart).toEqual([{ slug: rechta.slug, quantity: 2 }]);
    if (!isMobile(page)) await expect(page.getByTestId("header-cart-label")).toHaveText(`2 articles · ${price(rechta.price * 2)}`);
  });

  test("favourite toggle persists", async ({ page }) => {
    await page.goto(`/menu/${rechta.slug}`);
    const fav = page.getByRole("button", { name: `Ajouter ${rechta.name} aux favoris` }).first();
    await fav.click();
    await expect(page.getByRole("button", { name: `Retirer ${rechta.name} des favoris` }).first()).toHaveAttribute("aria-pressed", "true");
    expect((await readState(page)).favorites).toEqual([rechta.slug]);
  });
});
