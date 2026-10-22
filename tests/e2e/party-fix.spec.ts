import { expect, test, type Locator, type Page } from '@playwright/test';
import { appPath } from './paths';
import { contact, stroke, type Point } from './input';

const clues = ['la date', 'l’heure', 'le lieu'];
const objects = ['Examiner la boule disco', 'Examiner le vinyle', 'Examiner la photo sur le canapé'];
const piece = (page: Page, index: number) => page.getByRole('button', { name: `Choisir l’indice : ${clues[index]}`, exact: true });
const slot = (page: Page, index: number) => page.locator(`[data-clue-slot="${index}"]`);
async function box(node: Locator) {
  const rect = await node.boundingBox();
  if (!rect) throw Error('Objet absent');
  return rect;
}
async function settled(page: Page) {
  await expect(page.locator('.scene-transition:not([inert])')).toHaveCSS('opacity', '1');
  await expect(page.locator('.scene-transition:not([inert])')).toHaveCSS('transform', 'none');
}
async function workbench(page: Page, debug = false) {
  await page.goto(appPath('/demo/evenement/') + (debug ? '?debugGestures=1' : ''));
  await expect(page.locator('astro-island').first()).not.toHaveAttribute('ssr');
  if (debug) await page.locator('.gesture-debug summary').click();
  await page.getByRole('button', { name: 'Accepter la mission', exact: true }).click();
  for (const name of objects) await page.getByRole('button', { name, exact: true }).click();
  await page.getByRole('button', { name: 'Assembler les indices', exact: true }).click();
  await settled(page);
  await page.locator('.party-workbench').scrollIntoViewIfNeeded();
}
async function invitation(page: Page) {
  await workbench(page);
  for (let i = 0; i < 3; i++) {
    await piece(page, i).click();
    await slot(page, i).click();
  }
  await page.getByRole('button', { name: 'Essayer le code secret', exact: true }).click();
  await page.getByLabel('Le code secret', { exact: true }).fill('274');
  await page.getByRole('button', { name: 'Valider le code', exact: true }).click();
  await page.getByRole('button', { name: 'Ouvrir l’invitation', exact: true }).click();
  await settled(page);
}
async function path(page: Page, start: Point, end: Point, mobile: boolean, steps = 10) {
  await stroke(page, Array.from({ length: steps + 1 }, (_, i) => ({
    x: start.x + (end.x - start.x) * i / steps,
    y: start.y + (end.y - start.y) * i / steps,
  })), mobile);
}
async function center(node: Locator) {
  const a = await box(node);
  return { x: a.x + a.width / 2, y: a.y + a.height / 2 };
}
async function returned(node: Locator) {
  await expect.poll(() => node.evaluate(element => getComputedStyle(element).translate)).toBe('0px -7px');
}
async function drop(page: Page, index: number, mobile: boolean, steps = 10) {
  await page.locator('.party-workbench').scrollIntoViewIfNeeded();
  await path(page, await center(piece(page, index)), await center(slot(page, index)), mobile, steps);
  await expect(slot(page, index)).toBeDisabled();
}
test.beforeEach(async ({}, info) => {
  if (info.project.name === 'webkit') info.annotations.push({ type: 'limite', description: 'WebKit Windows : déplacements par souris native et taps tactiles ; pas Safari physique.' });
});

test('Une prise par le haut dépose la pièce visible dans sa case', async ({ page, isMobile }) => {
  await page.setViewportSize({ width: 390, height: 740 });
  await workbench(page);
  const a = await box(piece(page, 0)), b = await box(slot(page, 0));
  const start = { x: a.x + a.width / 2, y: a.y + 18 };
  const end = { x: b.x + b.width / 2, y: start.y + b.y + b.height / 2 - a.y - a.height / 2 };
  // The finger ends above the slot; the visible piece's centre is in the slot.
  expect(end.y).toBeLessThan(b.y);
  const input = await contact(page, start, isMobile);
  for (let i = 1; i <= 12; i++) await input.move({ x: start.x + (end.x - start.x) * i / 12, y: start.y + (end.y - start.y) * i / 12 });
  const moved = await box(piece(page, 0));
  expect(moved.y + moved.height / 2).toBeGreaterThan(b.y);
  expect(moved.y + moved.height / 2).toBeLessThan(b.y + b.height);
  await input.end();
  await expect(slot(page, 0)).toBeDisabled();
  await expect(page.locator('.party-clue-slots .is-filled')).toHaveCount(1);
});

test('Le verso conserve une boule disco contenue dans la carte', async ({ page, isMobile }) => {
  await page.setViewportSize({ width: 320, height: 650 });
  await invitation(page);
  const face = page.locator('.party-ticket-face');
  await face.scrollIntoViewIfNeeded();
  const a = await box(face), p = { x: a.x + a.width / 2, y: a.y + Math.min(a.height / 2, 200) };
  await path(page, p, { x: p.x - 85, y: p.y }, isMobile);
  await expect(page.locator('.party-invitation-back')).toBeVisible();
  await expect(face).toHaveCSS('transform', 'none');
  const art = await box(page.locator('.party-invitation-back > svg'));
  expect(art.width).toBeLessThanOrEqual(92);
  expect(art.height).toBeLessThanOrEqual(100);
  expect((await box(face)).height).toBeCloseTo(a.height, 0);
  // The next gesture uses the same physical position, without recentering or scroll.
  const reverse = await contact(page, p, isMobile);
  await reverse.move({ x: p.x + 40, y: p.y });
  await expect(page.locator('.party-ticket-gesture')).toHaveAttribute('data-dragging', 'true');
  expect(await face.evaluate(node => parseFloat(getComputedStyle(node).translate))).toBeCloseTo(40, 0);
  await reverse.move({ x: p.x + 85, y: p.y });
  await reverse.end();
  await expect(page.locator('.party-invitation-details')).toBeVisible();
  await page.getByRole('button', { name: /Retourner l’invitation/ }).click();
  await expect(page.locator('.party-invitation-back')).toBeVisible();
  await page.getByRole('button', { name: /Voir les informations/ }).click();
  await expect(page.locator('.party-invitation-details')).toBeVisible();
});

test('Hors cible, mauvaise case et annulation restent récupérables avant des drags rapides et lents', async ({ page, isMobile }) => {
  test.setTimeout(60000);
  await page.setViewportSize({ width: 390, height: 850 });
  await workbench(page);
  const source = piece(page, 0);
  await path(page, await center(source), await center(slot(page, 2)), isMobile);
  await expect(page.locator('.party-clue-slots .is-filled')).toHaveCount(0);
  await returned(source);
  const start = await center(source);
  await path(page, start, { x: 10, y: start.y - 40 }, isMobile, 2);
  await expect(page.locator('.party-clue-slots .is-filled')).toHaveCount(0);
  await returned(source);
  const cancelled = await contact(page, await center(source), isMobile);
  await cancelled.move(await center(slot(page, 0)));
  await expect(slot(page, 0)).toHaveClass(/is-drop-target/);
  await cancelled.end(true);
  await expect(slot(page, 0)).toBeEnabled();
  await expect(page.locator('.is-drop-target')).toHaveCount(0);
  await returned(source);
  await drop(page, 0, isMobile, 2);
  await drop(page, 1, isMobile, 32);
  await drop(page, 2, isMobile, 8);
  await expect(page.locator('.party-clue-slots .is-filled')).toHaveCount(3);
  await expect(page.getByRole('button', { name: 'Essayer le code secret', exact: true })).toBeEnabled();
});

test('Les six chapitres se terminent par gestes, puis retour et replay préservent les règles', async ({ page, isMobile }) => {
  test.setTimeout(90000);
  await page.setViewportSize({ width: 390, height: 850 });
  await page.goto(appPath('/demo/evenement/'));
  await expect(page.locator('astro-island').first()).not.toHaveAttribute('ssr');
  await page.getByRole('button', { name: 'Accepter la mission', exact: true }).click();
  await settled(page);
  for (const [i, name] of objects.entries()) {
    const control = page.getByRole('button', { name: new RegExp(`^${name}`) });
    await control.scrollIntoViewIfNeeded();
    const p = await center(control);
    await path(page, p, { x: p.x + 38, y: p.y - 35 }, isMobile);
    await expect(page.getByLabel(`${i + 1} indices trouvés sur 3`, { exact: true })).toBeVisible();
    if (i === 0) {
      const again = await center(control);
      await path(page, again, { x: again.x - 38, y: again.y - 35 }, isMobile);
      await expect(page.getByLabel('1 indices trouvés sur 3', { exact: true })).toBeVisible();
    }
  }
  await page.getByRole('button', { name: 'Assembler les indices', exact: true }).click();
  await settled(page);
  for (let i = 0; i < 3; i++) await drop(page, i, isMobile);
  const next = page.locator('.party-puzzle-scene .chapter-advance');
  await next.scrollIntoViewIfNeeded();
  const p = await center(next);
  await path(page, p, { x: p.x - 90, y: p.y }, isMobile);
  await expect(page.locator('.party-lock')).toBeVisible();
  const tap = async (name: string) => {
    const node = page.getByRole('button', { name, exact: true });
    if (isMobile) await node.tap(); else await node.click();
  };
  for (const digit of [0, 0, 0]) await tap(`Chiffre ${digit}`);
  await tap('Valider le code');
  await expect(page.locator('#party-lock-status')).toContainText('Pas encore');
  await expect(page.getByRole('button', { name: 'Ouvrir l’invitation', exact: true })).toHaveCount(0);
  for (let i = 0; i < 3; i++) await tap('Effacer le dernier chiffre');
  for (const [i, digit] of [2, 7, 4].entries()) {
    await tap(`Chiffre ${digit}`);
    await expect(page.locator('#party-code-entry')).toHaveValue('274'.slice(0, i + 1));
  }
  await tap('Valider le code');
  await page.getByRole('button', { name: 'Ouvrir l’invitation', exact: true }).click();
  await settled(page);
  const face = page.locator('.party-ticket-face');
  await face.scrollIntoViewIfNeeded();
  const invitationPoint = await center(face);
  await path(page, invitationPoint, { x: invitationPoint.x - 90, y: invitationPoint.y }, isMobile);
  await expect(page.locator('.party-invitation-back')).toBeVisible();
  await expect(face).toHaveCSS('transform', 'none');
  await path(page, invitationPoint, { x: invitationPoint.x + 90, y: invitationPoint.y }, isMobile);
  await expect(page.locator('.party-invitation-details')).toBeVisible();
  await page.getByRole('button', { name: 'Passer en mode fête', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('une place');
  await expect(page.locator('.confetti-effect')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Voir l’adresse sur la carte' })).toHaveAttribute('href', /^https:\/\/www.google.com\/maps\/search\//);
  await expect(page.getByText('RSVP disponible dans une invitation personnalisée.')).toBeVisible();
  for (const selector of ['.party-invitation-details', '.party-lock.is-unlocked', '.party-workbench']) {
    await page.getByRole('button', { name: 'Étape précédente', exact: true }).click();
    await expect(page.locator(selector)).toBeVisible();
    await settled(page);
  }
  await expect(page.locator('.party-clue-slots .is-filled')).toHaveCount(3);
  await page.getByRole('button', { name: 'Recommencer l’expérience', exact: true }).click();
  await page.getByRole('button', { name: 'Accepter la mission', exact: true }).click();
  await expect(page.getByLabel('0 indices trouvés sur 3', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Trouvez les 3 indices', exact: true })).toBeDisabled();
  for (const name of objects) await page.getByRole('button', { name, exact: true }).click();
  await page.getByRole('button', { name: 'Assembler les indices', exact: true }).click();
  await expect(page.locator('.party-clue-slots .is-filled')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Essayer le code secret', exact: true })).toBeDisabled();
});

test('Les dépôts suivent les rectangles actuels après défilement aux bords et changement de taille', async ({ page, isMobile }) => {
  test.setTimeout(90000);
  for (const viewport of [{ width: 320, height: 568 }, { width: 430, height: 740 }, { width: 844, height: 390 }]) {
    await page.setViewportSize(viewport);
    await workbench(page);
    for (let i = 0; i < 3; i++) {
      await piece(page, i).scrollIntoViewIfNeeded();
      const start = await center(piece(page, i)), target = await box(slot(page, i));
      const before = await page.evaluate(() => scrollY);
      const input = await contact(page, start, isMobile);
      const edge = { x: target.x + target.width / 2, y: Math.min(viewport.height - 16, target.y + target.height / 2) };
      for (let j = 1; j <= 8; j++) await input.move({ x: start.x + (edge.x - start.x) * j / 8, y: start.y + (edge.y - start.y) * j / 8 });
      if (target.y >= viewport.height) await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(before);
      await expect.poll(async () => (await box(slot(page, i))).y).toBeLessThan(viewport.height - 15);
      const current = await box(slot(page, i));
      const release = { x: current.x + current.width / 2, y: Math.min(viewport.height - 16, current.y + current.height / 2) };
      await input.move(release);
      const visual = await center(piece(page, i));
      // Native pointer coordinates are rounded; allow one CSS pixel of error.
      expect(Math.abs(visual.x - release.x)).toBeLessThanOrEqual(1.1);
      expect(Math.abs(visual.y - release.y)).toBeLessThanOrEqual(1.1);
      await input.end();
      await expect(slot(page, i)).toBeDisabled();
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    await expect(page.getByRole('button', { name: 'Essayer le code secret', exact: true })).toBeEnabled();
  }
});

test('Le diagnostic nomme la pièce, la case, le refus et l’annulation sans afficher les données de l’invitation', async ({ page, isMobile }) => {
  await page.setViewportSize({ width: 390, height: 850 });
  await workbench(page, true);
  await path(page, await center(piece(page, 0)), await center(slot(page, 2)), isMobile);
  const panel = page.locator('.gesture-debug');
  await expect(panel).toContainText('case 3 · doigt');
  await expect(panel).toContainText('dépôt rejeté');
  await expect(panel.locator('[data-result="rejected"]')).not.toHaveCount(0);
  await returned(piece(page, 0));
  const input = await contact(page, await center(piece(page, 0)), isMobile);
  await input.move(await center(slot(page, 0)));
  await input.end(true);
  await expect(panel).toContainText('interruption');
  await expect(panel).toContainText(/touchcancel|perte de capture/);
  expect(await panel.textContent()).not.toContain('24 rue');
  expect(await panel.textContent()).not.toContain('2027');
  await expect(slot(page, 0)).toBeEnabled();
});
