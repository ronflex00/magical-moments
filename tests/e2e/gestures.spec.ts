import { expect, test, type Page, type Locator } from "@playwright/test";
import { appPath } from "./paths";
import { stroke } from "./input";

async function drag(
  page: Page,
  source: Locator,
  mobile: boolean,
  dx: number,
  dy: number,
  cancel = false,
) {
  await source.scrollIntoViewIfNeeded();
  const box = await source.boundingBox();
  if (!box) throw new Error("Objet absent");
  const start = { x: box.x + box.width * 0.5, y: box.y + box.height * 0.5 };
  await stroke(
    page,
    Array.from({ length: 9 }, (_, i) => ({
      x: start.x + (dx * i) / 8,
      y: start.y + (dy * i) / 8,
    })),
    mobile,
    0,
    cancel,
  );
}
async function begin(page: Page, theme: string, label: string) {
  await page.goto(appPath(`/demo/${theme}/`));
  await expect(page.locator("astro-island").first()).not.toHaveAttribute("ssr");
  await page.getByRole("button", { name: label, exact: true }).click();
}

test("Anniversaire : pousser, soulever, gratter, maintenir, souffler et tirer le ruban", async ({
  page,
  isMobile,
}) => {
  test.setTimeout(60000);
  await begin(page, "anniversaire", "Commencer ma surprise");
  for (let i = 1; i <= 3; i++) {
    await drag(
      page,
      page.getByRole("button", { name: `Éclater le ballon ${i}`, exact: true }),
      isMobile,
      55,
      -8,
    );
    await expect(
      page.getByRole("button", { name: `Éclater le ballon ${i}`, exact: true }),
    ).toHaveCount(0);
  }
  await page.getByRole("button", { name: "Chercher les étoiles" }).click();
  for (const [index, name] of ["la fleur", "le petit cadeau"].entries()) {
    await drag(
      page,
      page.getByRole("button", { name: `Explorer ${name}`, exact: true }),
      isMobile,
      0,
      -45,
    );
    await drag(
      page,
      page.getByRole("button", {
        name: `Cueillir l’étoile ${index + 1}`,
        exact: true,
      }),
      isMobile,
      45,
      8,
    );
    await expect(
      page.getByRole("button", {
        name: `Cueillir l’étoile ${index + 1}`,
        exact: true,
      }),
    ).toBeDisabled();
  }
  const veil = page.locator(".scratch-veil");
  await veil.scrollIntoViewIfNeeded();
  const box = await veil.boundingBox();
  if (!box) throw new Error("Nuage absent");
  const points = Array.from({ length: 36 }, (_, i) => ({
    x:
      box.x +
      box.width * (0.1 + (Math.floor(i / 9) % 2 ? 8 - (i % 9) : i % 9) / 10),
    y: box.y + box.height * (0.15 + Math.floor(i / 9) * 0.2),
  }));
  await stroke(page, points, isMobile);
  await expect(veil).toHaveCount(0);
  await drag(
    page,
    page.getByRole("button", { name: "Cueillir l’étoile 3", exact: true }),
    isMobile,
    -45,
    8,
  );
  await page.getByRole("button", { name: "Place au gâteau" }).click();
  const cake = page.locator(".bq-cake-gesture");
  await cake.scrollIntoViewIfNeeded();
  const cakeBox = await cake.boundingBox();
  if (!cakeBox) throw new Error("Gâteau absent");
  await stroke(
    page,
    [
      {
        x: cakeBox.x + cakeBox.width * 0.5,
        y: cakeBox.y + cakeBox.height * 0.55,
      },
    ],
    isMobile,
    850,
  );
  await expect(
    page.getByRole("button", { name: "Souffler mes bougies" }),
  ).toBeEnabled();
  await drag(page, cake, isMobile, 100, 0);
  await expect(page.getByText("Ton vœu est bien gardé. ✧")).toBeVisible();
  await page.getByRole("button", { name: "Et maintenant, ton cadeau" }).click();
  const gift = page.locator(".bq-gift-stage .gesture-surface");
  await drag(page, gift, isMobile, 0, -100, true);
  await expect(page.locator(".bq-gift-stage")).not.toHaveClass(/bq-gift-ribbon-loose/);
  await expect(page.locator(".bq-gift-message")).toHaveCount(0);
  await drag(page, gift, isMobile, 0, -92);
  await expect(page.locator(".bq-gift-stage")).toHaveClass(
    /bq-gift-ribbon-loose/,
  );
  await drag(page, gift, isMobile, 0, -92);
  await expect(page.locator(".bq-gift-message")).toBeVisible();
  await page.getByRole("button", { name: "Il reste un petit mot" }).click();
  await expect(page.locator(".memory-gallery figure")).toHaveCount(3);
});

test("Mariage : feuilleter sans contourner le jeu, tirer la lettre et ouvrir la boîte", async ({
  page,
  isMobile,
}) => {
  // This complete journey includes paced native input and scene transitions.
  test.setTimeout(60000);
  await begin(page, "mariage", "Commencer notre histoire");
  const cards = page.locator(".proposal-memory-swipe");
  await drag(page, cards, isMobile, 0, 55, true);
  await expect(
    page.getByRole("button", { name: "Retrouve nos trois souvenirs" }),
  ).toBeDisabled();
  for (const name of [
    "Ce premier café",
    "Les pieds dans l’océan",
    "Notre petit quotidien",
  ]) {
    await drag(page, cards, isMobile, -92, 0);
    await expect(
      page.getByRole("heading", { name, exact: true }),
    ).toBeVisible();
  }
  await page
    .getByRole("button", { name: "La suite de notre histoire" })
    .click();
  for (let i = 1; i <= 5; i++)
    await page
      .getByRole("button", { name: `Relier l’étoile ${i}`, exact: true })
      .click();
  await page
    .getByRole("button", { name: "Découvrir la lettre", exact: true })
    .click();
  const letter = page.locator(".proposal-letter-gesture");
  await drag(page, letter, isMobile, 0, -84);
  await expect(
    page.getByRole("button", { name: "Déplier la lettre", exact: true }),
  ).toBeVisible();
  await drag(page, letter, isMobile, 0, -84);
  await expect(
    page.getByRole("article", { name: "Votre lettre" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Il reste une petite chose" }).click();
  await drag(page, page.locator(".proposal-ring-gesture"), isMobile, 0, -84);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Veux-tu m’épouser",
  );
  await page.getByRole("button", { name: "Vivre ce moment" }).click();
  await expect(
    page.getByRole("button", { name: "J’ai besoin de temps" }),
  ).toBeVisible();
});

test("Soirée : déplacer les objets, déposer les indices et retourner le ticket", async ({
  page,
  isMobile,
}) => {
  await begin(page, "evenement", "Accepter la mission");
  for (const name of [
    "Examiner la boule disco",
    "Examiner le vinyle",
    "Examiner la photo sur le canapé",
  ])
    await drag(
      page,
      page.getByRole("button", { name, exact: true }),
      isMobile,
      35,
      -35,
    );
  await page.getByRole("button", { name: "Assembler les indices" }).click();
  for (const [index, label] of ["la date", "l’heure", "le lieu"].entries()) {
    await page.locator(".party-workbench").scrollIntoViewIfNeeded();
    const source = page.getByRole("button", {
        name: `Choisir l’indice : ${label}`,
        exact: true,
      }),
      target = page.locator(`[data-clue-slot="${index}"]`);
    const a = await source.boundingBox(),
      b = await target.boundingBox();
    if (!a || !b) throw new Error("Pièce absente");
    await drag(
      page,
      source,
      isMobile,
      b.x + b.width / 2 - a.x - a.width / 2,
      b.y + b.height / 2 - a.y - a.height / 2,
    );
    await expect(target).toBeDisabled();
  }
  await page.getByRole("button", { name: "Essayer le code secret" }).click();
  for (const digit of [2, 7, 4])
    await page
      .getByRole("button", { name: `Chiffre ${digit}`, exact: true })
      .click();
  await page
    .getByRole("button", { name: "Valider le code", exact: true })
    .click();
  await page.getByRole("button", { name: "Ouvrir l’invitation" }).click();
  const ticket = page.locator(".party-ticket-gesture");
  await drag(page, ticket, isMobile, -90, 0);
  await expect(page.locator(".party-invitation-back")).toBeVisible();
  await page
    .getByRole("button", { name: "Voir les informations", exact: false })
    .click();
  await expect(page.locator(".party-invitation-details")).toBeVisible();
});
