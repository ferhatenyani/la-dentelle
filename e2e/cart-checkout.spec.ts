import { expect, test, type Page } from "@playwright/test";
import { getProduct } from "../lib/data/products";
import { SEED_USER } from "../lib/data/seed";
import { isMobile, price, readState, seedState } from "./helpers";

const mhalbi = getProduct("mhalbi-fleur-oranger")!; // 450
const matlouh = getProduct("matlouh-poulet-hmiss")!; // 850
const couscous = getProduct("couscous-royal-constantinois")!; // 3400

const lines = (page: Page) => page.getByTestId("cart-line").locator("visible=true");
const visible = (page: Page, testId: string) => page.getByTestId(testId).locator("visible=true");

test.describe("Cart", () => {
  test("adding from the catalogue fills the cart and persists after reload", async ({ page }) => {
    await page.goto("/menu");
    await page.getByRole("button", { name: `Ajouter ${couscous.name} au panier` }).locator("visible=true").click();
    await page.getByRole("button", { name: `Ajouter ${mhalbi.name} au panier` }).locator("visible=true").click();
    await expect(page.getByRole("status").filter({ hasText: "Article ajouté" }).first()).toBeVisible();
    if (isMobile(page)) await expect(page.getByTestId("mobile-cart-pill")).toContainText(price(3850));
    else await expect(page.getByTestId("header-cart-label")).toHaveText(`2 articles · ${price(3850)}`);

    await page.reload();
    await page.goto("/panier");
    await expect(lines(page)).toHaveCount(2);
    await expect(visible(page, "subtotal")).toHaveText(price(3850));
  });

  test("quantity updates, removal and totals with delivery fee", async ({ page }) => {
    await seedState(page, { cart: [{ slug: mhalbi.slug, quantity: 1 }, { slug: matlouh.slug, quantity: 1 }] });
    await page.goto("/panier");
    await expect(lines(page)).toHaveCount(2);
    // 450 + 850 = 1300 < 3000 → 600 DA delivery
    await expect(visible(page, "subtotal")).toHaveText(price(1300));
    await expect(visible(page, "delivery-fee")).toHaveText(price(600));
    await expect(visible(page, "total")).toHaveText(/1\s900\sDA/);
    await expect(visible(page, "free-delivery")).toContainText(price(1700));

    const matlouhLine = lines(page).filter({ hasText: matlouh.name });
    await matlouhLine.getByRole("button", { name: "Augmenter la quantité" }).click();
    await matlouhLine.getByRole("button", { name: "Augmenter la quantité" }).click();
    await expect(matlouhLine.getByTestId("line-total")).toHaveText(price(850 * 3));
    // 450 + 2550 = 3000 → free delivery
    await expect(visible(page, "subtotal")).toHaveText(price(3000));
    await expect(visible(page, "delivery-fee")).toContainText("GRATUIT");
    await expect(visible(page, "total")).toHaveText(/3\s000\sDA/);

    // Decreasing to 0 removes the line
    const mhalbiLine = lines(page).filter({ hasText: mhalbi.name });
    await mhalbiLine.getByRole("button", { name: "Diminuer la quantité" }).click();
    await expect(lines(page)).toHaveCount(1);
    if (!isMobile(page)) {
      await lines(page).getByRole("button", { name: `Retirer ${matlouh.name} du panier` }).click();
    } else {
      const l = lines(page).first();
      for (let i = 0; i < 3; i++) await l.getByRole("button", { name: "Diminuer la quantité" }).click();
    }
    await expect(page.getByRole("heading", { name: "Votre panier est vide" })).toBeVisible();
    expect((await readState(page)).cart).toEqual([]);
  });
});

test.describe("Checkout", () => {
  test("guest checkout validates required fields", async ({ page }) => {
    await seedState(page, { cart: [{ slug: couscous.slug, quantity: 1 }] });
    await page.goto("/commande");
    await expect(page.getByText(/Connectez-vous pour préremplir/)).toBeVisible();
    await page.getByRole("button", { name: /Confirmer la Commande/ }).locator("visible=true").click();
    for (const msg of ["Indiquez votre nom et prénom.", /Numéro algérien invalide/, "Choisissez votre commune de livraison.", "Indiquez la rue ou le quartier."]) {
      await expect(page.getByText(msg)).toBeVisible();
    }
    expect((await readState(page)).orders.some((o: { userId: string }) => o.userId === "guest")).toBe(false);
  });

  test("prefills the profile, completes the order and lists it in history", async ({ page }) => {
    await seedState(page, { loggedIn: true, cart: [{ slug: couscous.slug, quantity: 2 }, { slug: mhalbi.slug, quantity: 1 }] });
    await page.goto("/commande");
    await expect(page.getByLabel("Nom et Prénom *")).toHaveValue("Amine Benali");
    await expect(page.getByLabel("Numéro de mobile (+213) *")).toHaveValue("550 48 92 11");
    await expect(page.getByLabel("Commune *")).toHaveValue("hydra");
    await expect(page.getByLabel("Rue / Voie / Quartier *")).toHaveValue(SEED_USER.addresses[0].street);
    await expect(page.getByRole("radio", { name: /Billets de 2 000 DA/ })).toBeChecked();

    // Switch to the office address and pay with exact change
    await page.getByRole("radio", { name: "Bureau" }).click();
    await expect(page.getByLabel("Rue / Voie / Quartier *")).toHaveValue("Rue Tripoli, Sidi Yahia");
    await page.getByText("Appoint exact").click();

    await page.getByRole("button", { name: /Confirmer la Commande/ }).locator("visible=true").click();
    await expect(page).toHaveURL(/\/commande\/confirmation\?id=LD-\d{5}/);
    const orderId = (await page.getByTestId("order-id").textContent())!;
    await expect(page.getByRole("heading", { name: /Merci Amine/ })).toBeVisible();
    await expect(page.getByTestId("confirmation-total")).toHaveText(price(3400 * 2 + 450));

    const state = await readState(page);
    expect(state.cart).toEqual([]);
    expect(state.orders[0]).toMatchObject({ id: orderId, userId: SEED_USER.id, changePreference: "exact", total: 7250 });
    expect(state.orders[0].address.street).toBe("Rue Tripoli, Sidi Yahia");

    await page.getByRole("link", { name: "Mes commandes" }).click();
    await expect(page).toHaveURL(/\/compte\/commandes$/);
    await expect(page.getByText(orderId).first()).toBeVisible();
  });

  test("edited checkout details can be saved to the profile", async ({ page }) => {
    await seedState(page, { loggedIn: true, cart: [{ slug: couscous.slug, quantity: 1 }] });
    await page.goto("/commande");
    await page.getByRole("radio", { name: "Nouvelle adresse" }).click();
    await page.getByLabel("Commune *").selectOption("el-biar");
    await page.getByLabel("Rue / Voie / Quartier *").fill("12 Rue Chenoua");
    await page.getByLabel("Bâtiment, Étage & Porte").fill("Villa Chenoua");
    await expect(page.getByRole("checkbox", { name: "Enregistrer ces coordonnées dans mon profil" })).toBeChecked();
    await page.getByRole("button", { name: /Confirmer la Commande/ }).locator("visible=true").click();
    await expect(page).toHaveURL(/confirmation/);
    const user = (await readState(page)).users.find((u: { id: string }) => u.id === SEED_USER.id);
    expect(user.addresses.map((a: { street: string }) => a.street)).toContain("12 Rue Chenoua");
  });
});
