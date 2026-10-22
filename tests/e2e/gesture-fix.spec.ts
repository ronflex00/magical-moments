import { expect, test, type Locator, type Page } from "@playwright/test";
import { appPath } from "./paths";
import { contact, stroke, type Point } from "./input";

async function begin(
  page: Page,
  route = "anniversaire",
  label = "Commencer ma surprise",
  debug = false,
) {
  await page.goto(
    appPath(`/demo/${route}/`) + (debug ? "?debugGestures=1" : ""),
  );
  await expect(page.locator("astro-island").first()).not.toHaveAttribute("ssr");
  if (debug) {
    await page
      .getByRole("button", { name: "Placer le diagnostic en haut" })
      .click();
    await page.locator(".gesture-debug summary").click();
  }
  await page.getByRole("button", { name: label, exact: true }).click();
}
async function center(locator: Locator): Promise<Point> {
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();
  if (!box) throw Error("Objet absent");
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}
async function translate(locator: Locator) {
  return locator.evaluate((node) =>
    getComputedStyle(node)
      .translate.split(" ")
      .map((value) => parseFloat(value) || 0),
  );
}
async function garden(page: Page) {
  for (let i = 1; i <= 3; i++)
    await page
      .getByRole("button", { name: `Éclater le ballon ${i}`, exact: true })
      .click();
  await page
    .getByRole("button", { name: "Chercher les étoiles", exact: true })
    .click();
}
async function cake(page: Page) {
  await garden(page);
  for (const [i, label] of [
    "la fleur",
    "le petit cadeau",
    "le nuage",
  ].entries()) {
    await page
      .getByRole("button", { name: `Explorer ${label}`, exact: true })
      .click();
    await page
      .getByRole("button", {
        name: `Cueillir l’étoile ${i === 1 ? 2 : i === 2 ? 3 : 1}`,
        exact: true,
      })
      .click();
  }
  await page
    .getByRole("button", { name: "Place au gâteau", exact: true })
    .click();
}
test.beforeEach(async ({}, testInfo) => {
  if (testInfo.project.name === "webkit")
    testInfo.annotations.push({
      type: "limite",
      description:
        "WebKit Windows : gestes continus par souris native ; taps tactiles natifs. Pas Safari physique.",
    });
});

test("Le ballon suit le contact avant relâchement et un geste court ne devient pas un clic", async ({
  page,
  isMobile,
}) => {
  await begin(page);
  const balloon = page.getByRole("button", {
    name: "Éclater le ballon 1",
    exact: true,
  });
  const start = await center(balloon),
    input = await contact(page, start, isMobile);
  await input.move({ x: start.x + 24, y: start.y + 12 });
  const offset = await translate(balloon);
  expect(offset[0]).toBeCloseTo(24, 0);
  expect(offset[1]).toBeCloseTo(12, 0);
  await expect(balloon).toBeVisible();
  await input.move({ x: start.x + 65, y: start.y + 15 });
  await input.end();
  await expect(balloon).toHaveCount(0);
  const second = page.getByRole("button", {
    name: "Éclater le ballon 2",
    exact: true,
  });
  const point = await center(second),
    short = await contact(page, point, isMobile);
  await short.move({ x: point.x + 10, y: point.y + 1 });
  await short.end();
  await expect(second).toBeVisible();
  await second.focus();
  await page.keyboard.press("Enter");
  await expect(second).toHaveCount(0);
});

test("Le maintien progresse, s’annule sans allumer puis le balayage souffle sans tap", async ({
  page,
  isMobile,
}) => {
  test.setTimeout(60000);
  await begin(page);
  await cake(page);
  const surface = page.locator(".bq-cake-gesture"),
    point = await center(surface);
  const interrupted = await contact(page, point, isMobile);
  await page.waitForTimeout(280);
  const progress = Number(
    await surface.evaluate((node) =>
      node.style.getPropertyValue("--hold-progress"),
    ),
  );
  expect(progress).toBeGreaterThan(0.2);
  expect(progress).toBeLessThan(0.9);
  await interrupted.end(true);
  await expect(
    page.getByRole("button", { name: "Souffler mes bougies", exact: true }),
  ).toBeDisabled();
  const hold = await contact(page, await center(surface), isMobile);
  await page.waitForTimeout(850);
  await hold.end();
  await expect(
    page.getByRole("button", { name: "Souffler mes bougies", exact: true }),
  ).toBeEnabled();
  const p = await center(surface);
  await stroke(
    page,
    [p, { x: p.x + 45, y: p.y }, { x: p.x + 100, y: p.y }],
    isMobile,
  );
  await expect(page.getByText("Ton vœu est bien gardé. ✧")).toBeVisible();
});

test("Une carte horizontale conserve le scroll et une interruption ne révèle aucun souvenir", async ({
  page,
  isMobile,
  browserName,
}) => {
  await begin(page, "mariage", "Commencer notre histoire");
  const surface = page.locator(".proposal-memory-swipe"),
    point = await center(surface),
    scrollBefore = await page.evaluate(() => scrollY);
  const input = await contact(page, point, isMobile);
  await input.move({ x: point.x + 2, y: point.y - 50 });
  await input.move({ x: point.x + 2, y: point.y - 110 });
  await input.end();
  await expect(page.locator(".proposal-memory-count")).toHaveText(
    "0 / 3 souvenirs retrouvés",
  );
  if (isMobile && browserName === "chromium")
    expect(await page.evaluate(() => scrollY)).toBeGreaterThan(
      scrollBefore + 20,
    );
  await expect(surface).toHaveCSS("touch-action", "pan-y");
  const p = await center(surface),
    card = page.locator(".proposal-memory-panel"),
    next = await contact(page, p, isMobile);
  await next.move({ x: p.x - 85, y: p.y });
  expect((await translate(card))[0]).toBeCloseTo(-85, 0);
  await page.setViewportSize({ width: 844, height: 390 });
  await page.waitForTimeout(80);
  await next.end();
  await expect(page.locator(".proposal-memory-count")).toHaveText(
    "0 / 3 souvenirs retrouvés",
  );
  await page.setViewportSize({ width: 390, height: 700 });
  await page.waitForTimeout(80);
  const again = await center(surface);
  await stroke(page, [again, { x: again.x - 90, y: again.y }], isMobile);
  await expect(page.locator(".proposal-memory-count")).toHaveText(
    "1 / 3 souvenirs retrouvés",
  );
  await page
    .getByRole("button", { name: "Recommencer l’expérience", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Commencer notre histoire", exact: true })
    .click();
  await expect(page.locator(".proposal-memory-count")).toHaveText(
    "0 / 3 souvenirs retrouvés",
  );
});

test("La pièce suit le doigt, revient après une mauvaise case puis se place une seule fois", async ({
  page,
  isMobile,
}) => {
  await begin(page, "evenement", "Accepter la mission");
  for (const name of [
    "Examiner la boule disco",
    "Examiner le vinyle",
    "Examiner la photo sur le canapé",
  ])
    await page.getByRole("button", { name, exact: true }).click();
  await page
    .getByRole("button", { name: "Assembler les indices", exact: true })
    .click();
  const piece = page.getByRole("button", {
    name: "Choisir l’indice : la date",
    exact: true,
  });
  await page.locator(".party-workbench").scrollIntoViewIfNeeded();
  const start = await center(piece),
    wrong = await page.locator('[data-clue-slot="2"]').boundingBox();
  if (!wrong) throw Error("Case absente");
  const input = await contact(page, start, isMobile);
  await input.move({ x: start.x + 35, y: start.y + 70 });
  const offset = await translate(piece);
  expect(offset[0]).toBeCloseTo(35, 0);
  expect(offset[1]).toBeCloseTo(70, 0);
  await input.move({
    x: wrong.x + wrong.width / 2,
    y: wrong.y + wrong.height / 2,
  });
  await input.end();
  await expect(page.locator(".party-clue-slots .is-filled")).toHaveCount(0);
  await page.waitForTimeout(380);
  expect((await translate(piece))[1]).toBeCloseTo(-7, 0);
  const p = await center(piece),
    slot = await page.locator('[data-clue-slot="0"]').boundingBox();
  if (!slot) throw Error("Case absente");
  const retry = await contact(page, p, isMobile);
  await retry.move({ x: slot.x + slot.width / 2, y: slot.y + slot.height / 2 });
  await expect(page.locator('[data-clue-slot="0"]')).toHaveClass(
    /is-drop-target/,
  );
  await page.waitForTimeout(300);
  await expect(page.locator('[data-clue-slot="0"]')).toHaveClass(
    /is-drop-target/,
  );
  await retry.end();
  await expect(page.locator(".party-clue-slots .is-filled")).toHaveCount(1);
  await expect(piece).toBeDisabled();
});

test("La constellation se trace depuis le fond et les étoiles traversées sont détectées", async ({
  page,
  isMobile,
}) => {
  await begin(page, "mariage", "Commencer notre histoire");
  for (let i = 1; i <= 3; i++)
    await page
      .getByRole("button", { name: new RegExp(`Découvrir le souvenir ${i}`) })
      .click();
  await page
    .getByRole("button", { name: "La suite de notre histoire", exact: true })
    .click();
  const board = page.locator(".proposal-weave-board");
  await board.scrollIntoViewIfNeeded();
  await expect(board).toHaveCSS("touch-action", "none");
  const box = await board.boundingBox();
  if (!box) throw Error("Plateau absent");
  const points = [{ x: box.x + box.width * 0.05, y: box.y + box.height * 0.7 }];
  for (let i = 1; i <= 5; i++) {
    const star = await page
      .getByRole("button", { name: `Relier l’étoile ${i}`, exact: true })
      .boundingBox();
    if (!star) throw Error("Étoile absente");
    points.push({ x: star.x + star.width / 2, y: star.y + star.height / 2 });
  }
  const input = await contact(page, points[0], isMobile);
  for (const p of points.slice(1)) await input.move(p);
  await expect(page.locator(".proposal-weave-trail")).not.toHaveAttribute(
    "d",
    "",
  );
  await input.end();
  await expect(page.locator(".proposal-weave-count")).toHaveText(
    "5 / 5 étoiles réunies",
  );
});

test("La navigation par swipe reste localisée et verrouillée par les objectifs", async ({
  page,
  isMobile,
}) => {
  await begin(page);
  const zone = page.locator(".chapter-advance");
  const start = await center(zone);
  await stroke(page, [start, { x: start.x - 90, y: start.y }], isMobile);
  await expect(page.locator(".experience-count")).toHaveText("02 / 06");
  for (let i = 1; i <= 3; i++)
    await page
      .getByRole("button", { name: `Éclater le ballon ${i}`, exact: true })
      .click();
  const ready = await center(zone);
  await stroke(page, [ready, { x: ready.x - 90, y: ready.y }], isMobile);
  await expect(page.locator(".experience-count")).toHaveText("03 / 06");
});

test("Le diagnostic est optionnel et montre les événements natifs", async ({
  page,
  isMobile,
}) => {
  await begin(page);
  await expect(page.locator(".gesture-debug")).toHaveCount(0);
  await begin(page, "anniversaire", "Commencer ma surprise", true);
  const point = await center(
    page.getByRole("button", { name: "Éclater le ballon 1", exact: true }),
  );
  if (isMobile) await page.touchscreen.tap(point.x, point.y);
  else await page.mouse.click(point.x, point.y);
  await page.locator(".gesture-debug summary").click();
  await expect(page.locator(".gesture-debug")).toContainText(
    isMobile ? "touchstart" : "pointerdown",
  );
  await expect(page.locator(".gesture-debug")).toContainText(
    isMobile ? "touchend" : "pointerup",
  );
  await expect(page.locator(".gesture-debug")).toContainText("touch-action");
});

test("WebKit sans Web Audio garde un parcours jouable et une commande de reprise honnête", async ({
  page,
  browserName,
}) => {
  test.skip(
    browserName !== "webkit",
    "Vérification spécifique au moteur WebKit disponible.",
  );
  await page.goto(appPath("/demo/anniversaire/"));
  test.skip(
    await page.evaluate(() => typeof AudioContext === "function"),
    "Le moteur dispose de Web Audio : tests audio standards.",
  );
  await page
    .getByRole("button", { name: "Commencer ma surprise", exact: true })
    .tap();
  await expect(page.locator(".experience-shell")).toHaveAttribute(
    "data-audio-status",
    "blocked",
  );
  await expect(
    page.getByRole("button", { name: "Réessayer le son ♫", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Éclater le ballon 1", exact: true })
    .tap();
  await expect(page.locator(".bq-counter")).toContainText("1 /");
});

test("Ruban, lettre et couvercle réagissent avant validation, sans tap final", async ({
  page,
  isMobile,
  browserName,
}) => {
  test.setTimeout(90000);
  await begin(page);
  await cake(page);
  for (let i = 1; i <= 5; i++)
    await page
      .getByRole("button", { name: `Allumer la bougie ${i}`, exact: true })
      .click();
  await page
    .getByRole("button", { name: "Souffler mes bougies", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Et maintenant, ton cadeau", exact: true })
    .click();
  const gift = page.locator(".bq-gift-stage .gesture-surface"),
    p = await center(gift),
    ribbon = await contact(page, p, isMobile);
  await ribbon.move({ x: p.x, y: p.y - 40 });
  expect((await translate(page.locator(".bq-gift-bow")))[1]).toBeCloseTo(
    -40,
    0,
  );
  await expect(page.locator(".bq-gift-message")).toHaveCount(0);
  await ribbon.move({ x: p.x, y: p.y - 95 });
  await ribbon.end();
  await expect(page.locator(".bq-gift-stage")).toHaveClass(
    /bq-gift-ribbon-loose/,
  );
  const q = await center(gift),
    lid = await contact(page, q, isMobile);
  await lid.move({ x: q.x, y: q.y - 40 });
  expect((await translate(page.locator(".bq-gift-lid")))[1]).toBeCloseTo(
    -40,
    0,
  );
  await expect(page.locator(".bq-gift-message")).toHaveCount(0);
  await lid.move({ x: q.x, y: q.y - 95 });
  await lid.end();
  await expect(page.locator(".bq-gift-message")).toBeVisible();
  await page
    .getByRole("button", { name: "Il reste un petit mot", exact: true })
    .click();
  if (isMobile && browserName === "chromium") {
    const gallery = page.locator(".memory-gallery"),
      g = await center(gallery);
    const dimensions = await gallery.evaluate((node) => ({
      width: node.clientWidth,
      content: node.scrollWidth,
      viewport: innerWidth,
    }));
    expect(dimensions.width).toBeLessThanOrEqual(dimensions.viewport);
    expect(dimensions.content).toBeGreaterThan(dimensions.width);
    await stroke(
      page,
      Array.from({ length: 10 }, (_, i) => ({ x: g.x + 90 - i * 20, y: g.y })),
      true,
    );
    await expect
      .poll(() => gallery.evaluate((node) => node.scrollLeft))
      .toBeGreaterThan(40);
  }
  await begin(page, "mariage", "Commencer notre histoire");
  for (let i = 1; i <= 3; i++)
    await page
      .getByRole("button", { name: new RegExp(`Découvrir le souvenir ${i}`) })
      .click();
  await page
    .getByRole("button", { name: "La suite de notre histoire", exact: true })
    .click();
  for (let i = 1; i <= 5; i++)
    await page
      .getByRole("button", { name: `Relier l’étoile ${i}`, exact: true })
      .click();
  await page
    .getByRole("button", { name: "Découvrir la lettre", exact: true })
    .click();
  const letter = page.locator(".proposal-letter-gesture"),
    l = await center(letter),
    pull = await contact(page, l, isMobile);
  await pull.move({ x: l.x, y: l.y - 40 });
  expect(
    (await translate(page.locator(".proposal-envelope-button")))[1],
  ).toBeCloseTo(-40, 0);
  await pull.move({ x: l.x, y: l.y - 90 });
  await pull.end();
  const opened = await center(letter);
  await stroke(page, [opened, { x: opened.x, y: opened.y - 90 }], isMobile);
  await expect(
    page.getByRole("article", { name: "Votre lettre", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Il reste une petite chose", exact: true })
    .click();
  const ring = page.locator(".proposal-ring-gesture"),
    r = await center(ring),
    before = await page
      .locator(".proposal-box-lid")
      .evaluate((node) => getComputedStyle(node).transform),
    open = await contact(page, r, isMobile);
  await open.move({ x: r.x, y: r.y - 40 });
  expect(
    await page
      .locator(".proposal-box-lid")
      .evaluate((node) => getComputedStyle(node).transform),
  ).not.toBe(before);
  await expect(page.locator(".proposal-box-scene")).not.toHaveClass(/is-open/);
  await open.move({ x: r.x, y: r.y - 90 });
  await open.end();
  await expect(page.locator(".proposal-box-scene")).toHaveClass(/is-open/);
});
