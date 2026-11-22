import { expect, test } from "@playwright/test";
import { SEED_USER } from "../lib/data/seed";
import { isMobile, readState, seedState } from "./helpers";

test.describe("Profile", () => {
  test("requires authentication", async ({ page }) => {
    await page.goto("/compte");
    await expect(page).toHaveURL(/\/connexion\?next=%2Fcompte$/);
  });

  test("personal information can be edited and persists after reload", async ({ page }) => {
    await seedState(page, { loggedIn: true });
    await page.goto("/compte");
    const name = page.getByTestId(isMobile(page) ? "profile-name-mobile" : "profile-name");
    await expect(name).toHaveText("Amine Benali");

    await page.getByRole("button", { name: "Modifier mes informations" }).locator("visible=true").click();
    const dialog = page.getByRole("dialog", { name: "Informations personnelles" });
    await dialog.getByLabel("Prénom").fill("Amina");
    await dialog.getByLabel("Mobile (+213)").fill("12");
    await dialog.getByRole("button", { name: "Enregistrer" }).click();
    await expect(dialog.getByText(/Numéro algérien invalide/)).toBeVisible();
    await dialog.getByLabel("Mobile (+213)").fill("661 22 33 44");
    await dialog.getByRole("button", { name: "Enregistrer" }).click();
    await expect(dialog).toBeHidden();
    await expect(name).toHaveText("Amina Benali");

    await page.reload();
    await expect(name).toHaveText("Amina Benali");
    const user = (await readState(page)).users[0];
    expect(user).toMatchObject({ firstName: "Amina", phone: "661223344" });

    // The edited profile prefills the next checkout
    await page.evaluate(() => {
      const s = JSON.parse(localStorage.getItem("ladentelle:v1")!);
      s.cart = [{ slug: "rechta-imperiale", quantity: 1 }];
      localStorage.setItem("ladentelle:v1", JSON.stringify(s));
    });
    await page.goto("/commande");
    await expect(page.getByLabel("Nom et Prénom *")).toHaveValue("Amina Benali");
    await expect(page.getByLabel("Numéro de mobile (+213) *")).toHaveValue("661 22 33 44");
  });

  test("addresses can be added and set as default", async ({ page }) => {
    await seedState(page, { loggedIn: true });
    await page.goto("/compte");
    if (isMobile(page)) {
      await page.getByRole("button", { name: /Mes Adresses à Alger/ }).click();
      await page.getByRole("dialog").getByRole("button", { name: "Ajouter une adresse" }).click();
    } else {
      await page.getByRole("button", { name: "Ajouter", exact: true }).click();
    }
    const dialog = page.getByRole("dialog", { name: "Nouvelle adresse" });
    await dialog.getByRole("button", { name: "Enregistrer l'adresse" }).click();
    await expect(dialog.getByText("Donnez un nom à cette adresse.")).toBeVisible();
    await dialog.getByLabel("Nom de l'adresse").fill("Atelier");
    await dialog.getByLabel("Commune").selectOption("ben-aknoun");
    await dialog.getByLabel("Rue / Quartier").fill("Route de Ben Aknoun");
    await dialog.getByLabel("Utiliser comme adresse par défaut").check();
    await dialog.getByRole("button", { name: "Enregistrer l'adresse" }).click();
    await expect(dialog).toBeHidden();
    const user = (await readState(page)).users[0];
    const added = user.addresses.find((a: { label: string }) => a.label === "Atelier");
    expect(added).toBeTruthy();
    expect(user.defaultAddressId).toBe(added.id);
  });

  test("order history lists orders and opens order details", async ({ page }) => {
    await seedState(page, { loggedIn: true });
    await page.goto("/compte/commandes");
    await expect(page.getByTestId("history-order")).toHaveCount(3);
    await page.getByRole("tab", { name: "Livrées" }).click();
    await expect(page.getByTestId("history-order")).toHaveCount(2);
    await page.getByRole("link", { name: "Détail de la commande LD-79102" }).click();
    await expect(page).toHaveURL(/\/suivi\?id=LD-79102$/);
    await expect(page.getByTestId(isMobile(page) ? "tracking-title-mobile" : "tracking-title")).toHaveText("Commande livrée");
    await page.getByRole("button", { name: "Recommander" }).click();
    expect((await readState(page)).cart.length).toBe(3);
  });

  test("logout clears the session", async ({ page }) => {
    await seedState(page, { loggedIn: true });
    await page.goto("/compte");
    await page.getByRole("button", { name: /Se déconnecter/ }).locator("visible=true").click();
    await expect(page).toHaveURL(/\/$/);
    expect((await readState(page)).sessionUserId).toBeNull();
  });
});

test.describe("Order tracking", () => {
  test("shows the delivery status of an order en route", async ({ page }) => {
    await seedState(page, { loggedIn: true });
    await page.goto("/suivi?id=LD-84920");
    if (isMobile(page)) {
      await expect(page.getByTestId("tracking-title-mobile")).toHaveText("En route vers votre adresse");
      await expect(page.getByTestId("remaining-minutes-mobile")).toHaveText("18");
    } else {
      await expect(page.getByTestId("tracking-title")).toHaveText("En route vers votre adresse");
      await expect(page.getByTestId("step-counter")).toHaveText("Étape 3 sur 4");
      await expect(page.getByTestId("step-confirmee")).toHaveAttribute("data-state", "done");
      await expect(page.getByTestId("step-preparation")).toHaveAttribute("data-state", "done");
      await expect(page.getByTestId("step-en_route")).toHaveAttribute("data-state", "current");
      await expect(page.getByTestId("step-livree")).toHaveAttribute("data-state", "todo");
    }
    await expect(page.getByTestId("courier-marker")).toBeVisible();
    await expect(page.getByTestId("handover-code").locator("visible=true")).toHaveText("749");
  });

  test("a freshly placed order is tracked as confirmed", async ({ page }) => {
    await seedState(page, { loggedIn: true, cart: [{ slug: "rechta-imperiale", quantity: 1 }] });
    await page.goto("/commande");
    await page.getByRole("button", { name: /Confirmer la Commande/ }).locator("visible=true").click();
    await expect(page).toHaveURL(/confirmation/);
    await page.getByRole("link", { name: "Suivre ma commande" }).click();
    await expect(page.getByTestId(isMobile(page) ? "tracking-title-mobile" : "tracking-title")).toHaveText("Commande confirmée");
    if (!isMobile(page)) await expect(page.getByTestId("step-counter")).toHaveText("Étape 1 sur 4");
    await expect(page.getByTestId("courier-marker")).toHaveCount(0);
  });

  test("/suivi without id falls back to the active order", async ({ page }) => {
    await seedState(page, { loggedIn: true });
    await page.goto("/suivi");
    await expect(page.getByTestId("handover-code").locator("visible=true")).toHaveText("749"); // LD-84920
    expect(SEED_USER.id).toBe("u-amine");
  });
});
