import { expect, test } from "@playwright/test";
import { DEMO_OTP, SEED_USER } from "../lib/data/seed";
import { readState } from "./helpers";

test.describe("Authentication", () => {
  test("phone login validates input, then signs in with the SMS code", async ({ page }) => {
    await page.goto("/connexion");
    const send = page.getByRole("button", { name: "Recevoir mon code de confirmation" });
    await send.click();
    await expect(page.getByText("Veuillez saisir votre numéro de mobile.")).toBeVisible();

    const phone = page.getByLabel("Numéro de mobile", { exact: true });
    await phone.fill("12345");
    await send.click();
    await expect(page.getByText(/Numéro invalide/)).toBeVisible();
    await expect(phone).toHaveAttribute("aria-invalid", "true");

    await phone.fill("661 00 00 00"); // valid format, unknown account
    await send.click();
    await expect(page.getByText(/Aucun compte n'est associé/)).toBeVisible();

    await phone.fill("0550 48 92 11");
    await send.click();
    const code = page.getByLabel("Code de confirmation");
    await expect(code).toBeVisible();
    await code.fill("000000");
    await page.getByRole("button", { name: "Vérifier et me connecter" }).click();
    await expect(page.getByText("Code incorrect. Vérifiez le SMS reçu.")).toBeVisible();

    await code.fill(DEMO_OTP);
    await page.getByRole("button", { name: "Vérifier et me connecter" }).click();
    await expect(page).toHaveURL(/\/compte$/);
    expect((await readState(page)).sessionUserId).toBe(SEED_USER.id);
  });

  test("email login rejects wrong credentials and honours ?next=", async ({ page }) => {
    await page.goto("/connexion?next=/panier");
    await page.getByRole("button", { name: /Email & Mot de passe|Connexion par email/ }).click();
    await page.getByLabel("Adresse email").fill("pas-un-email");
    await page.getByRole("button", { name: "Connexion Email" }).click();
    await expect(page.getByText("Adresse email invalide.")).toBeVisible();

    await page.getByLabel("Adresse email").fill(SEED_USER.email);
    await page.getByLabel("Mot de passe", { exact: true }).fill("mauvais-mdp1");
    await page.getByRole("button", { name: "Connexion Email" }).click();
    await expect(page.getByText("Email ou mot de passe incorrect.")).toBeVisible();

    await page.getByLabel("Mot de passe", { exact: true }).fill(SEED_USER.password);
    await page.getByRole("button", { name: "Connexion Email" }).click();
    await expect(page).toHaveURL(/\/panier$/);
  });

  test("signup validates every field and creates an account", async ({ page }) => {
    await page.goto("/connexion");
    await page.getByRole("tab", { name: "Créer un compte" }).click();
    await expect(page).toHaveURL(/mode=inscription/);
    await page.getByRole("button", { name: "Créer mon compte" }).click();
    for (const msg of ["Prénom requis.", "Nom requis.", /Numéro algérien invalide/, "Adresse email invalide.", /8 caractères minimum, dont au moins/, /accepter les conditions/]) {
      await expect(page.getByText(msg, { exact: typeof msg === "string" })).toBeVisible();
    }

    await page.getByLabel("Prénom").fill("Lina");
    await page.getByLabel("Nom", { exact: true }).fill("Haddad");
    await page.getByLabel("Numéro de mobile", { exact: true }).fill(SEED_USER.phone); // already used
    await page.getByLabel("Adresse email").fill("lina.haddad@example.dz");
    await page.getByLabel("Mot de passe", { exact: true }).fill("couscous2026");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Créer mon compte" }).click();
    await expect(page.getByText("Ce numéro est déjà associé à un compte.")).toBeVisible();

    await page.getByLabel("Numéro de mobile", { exact: true }).fill("770 11 22 33");
    await page.getByRole("button", { name: "Créer mon compte" }).click();
    await expect(page).toHaveURL(/\/compte$/);
    const state = await readState(page);
    const user = state.users.find((u: { email: string }) => u.email === "lina.haddad@example.dz");
    expect(user).toMatchObject({ firstName: "Lina", lastName: "Haddad", phone: "770112233" });
    expect(state.sessionUserId).toBe(user.id);
  });

  test("guest access goes straight to the menu", async ({ page }) => {
    await page.goto("/connexion");
    await page.getByRole("link", { name: /invité/ }).click();
    await expect(page).toHaveURL(/\/menu$/);
  });
});
