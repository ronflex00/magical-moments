import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { birthdayDemo } from '../../src/data/birthday-demo';
import { proposalDemo } from '../../src/data/proposal-demo';
import { partyDemo } from '../../src/data/party-demo';
import { getBalloonGoal, getCandleCount, getGiftGoal } from '../../src/experiences/birthday/scenes/rules';

const browserErrors = new WeakMap<Page, string[]>();

test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  browserErrors.set(page, errors);
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text());
  });
});

test.afterEach(async ({ page }) => {
  expect(browserErrors.get(page), 'Le parcours ne doit produire aucune erreur navigateur').toEqual([]);
});

async function hydrate(page: Page) {
  const island = page.locator('astro-island').first();
  await expect(island).toBeAttached();
  await expect(island).not.toHaveAttribute('ssr');
}

async function openExperience(page: Page, path: string) {
  const response = await page.goto(path);
  expect(response?.status(), `La route ${path} doit être accessible directement`).toBe(200);
  await hydrate(page);
}

async function noHorizontalOverflow(page: Page) {
  await page.evaluate(async () => { await document.fonts.ready; });
  const dimensions = await page.evaluate(() => ({
    content: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
    viewport: window.innerWidth,
  }));
  expect(dimensions.content, `Débordement horizontal sur ${new URL(page.url()).pathname} à ${dimensions.viewport} px`).toBeLessThanOrEqual(dimensions.viewport + 1);
}

async function auditCurrentScene(page: Page) {
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(result.violations.map(violation => ({
    id: violation.id,
    elements: violation.nodes.map(node => ({ target: node.target, reason: node.failureSummary })),
  }))).toEqual([]);
}

async function playBirthday(page: Page, audit = false) {
  await page.getByRole('button', { name: 'Commencer ma surprise' }).click();
  const toCake = page.getByRole('button', { name: 'Place au gâteau' });
  await expect(toCake).toBeDisabled();
  if (audit) await auditCurrentScene(page);
  const goal = getBalloonGoal(birthdayDemo.interactions.balloonsToPop);
  for (let index = 0; index < goal; index += 1) {
    const balloon = page.getByRole('button', { name: `Éclater le ballon ${index + 1}`, exact: true });
    // Les mêmes mécaniques sont jouables au clavier, à la souris et au doigt.
    await balloon.focus();
    await page.keyboard.press('Enter');
    if (index < goal - 1) await expect(toCake).toBeDisabled();
  }
  await expect(toCake).toBeEnabled();
  if (audit) await auditCurrentScene(page);
  await noHorizontalOverflow(page);
  await toCake.click();

  const blow = page.getByRole('button', { name: 'Souffler mes bougies' });
  await expect(blow).toBeDisabled();
  if (audit) await auditCurrentScene(page);
  const candles = getCandleCount(birthdayDemo.candleCount);
  for (let index = 0; index < candles; index += 1) {
    await page.getByRole('button', { name: `Allumer la bougie ${index + 1}`, exact: true }).click();
    if (index < candles - 1) await expect(blow).toBeDisabled();
  }
  await expect(blow).toBeEnabled();
  if (audit) await auditCurrentScene(page);
  await noHorizontalOverflow(page);
  await blow.click();
  await expect(page.getByText('Toutes les bougies sont soufflées. Ton vœu est bien gardé.')).toBeVisible();
  if (audit) await auditCurrentScene(page);
  await page.getByRole('button', { name: 'Et maintenant, ton cadeau' }).click();

  const taps = getGiftGoal(birthdayDemo.interactions.giftTaps);
  if (audit) await auditCurrentScene(page);
  for (let index = 0; index < taps; index += 1) {
    await page.getByRole('button', { name: `Ouvrir le cadeau, ${index} sur ${taps} tapotements`, exact: true }).click();
    if (index < taps - 1) await expect(page.getByRole('heading', { name: birthdayDemo.gift.title })).toHaveCount(0);
  }
  await expect(page.getByRole('heading', { name: birthdayDemo.gift.title })).toBeVisible();
  await expect(page.getByText(birthdayDemo.gift.description)).toBeVisible();
  if (audit) await auditCurrentScene(page);
  await noHorizontalOverflow(page);
  await page.getByRole('button', { name: 'Il reste un petit mot' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('anniversaire');
  await expect(page.getByText(birthdayDemo.message)).toBeVisible();
  if (audit) await auditCurrentScene(page);
  await noHorizontalOverflow(page);
}

async function playProposal(page: Page, audit = false) {
  await page.getByRole('button', { name: 'Commencer notre histoire' }).click();
  await expect(page.getByRole('button', { name: 'Retrouve nos trois souvenirs' })).toBeDisabled();
  if (audit) await auditCurrentScene(page);
  for (let index = 0; index < 3; index += 1) {
    await page.getByRole('button', { name: `Découvrir le souvenir ${index + 1} : ${proposalDemo.memories[index].title}`, exact: true }).click();
    await expect(page.getByRole('heading', { name: proposalDemo.memories[index].title, exact: true })).toBeVisible();
    if (index < 2) await expect(page.getByRole('button', { name: 'Retrouve nos trois souvenirs' })).toBeDisabled();
  }
  if (audit) await auditCurrentScene(page);
  await noHorizontalOverflow(page);
  await page.getByRole('button', { name: 'La suite de notre histoire' }).click();
  await expect(page.getByRole('button', { name: 'Il reste une petite chose' })).toHaveCount(0);
  if (audit) await auditCurrentScene(page);
  await page.getByRole('button', { name: 'Ouvrir la lettre de votre histoire' }).click();
  await expect(page.getByRole('article', { name: 'Votre lettre' })).toContainText(proposalDemo.letter.split('\n\n')[1]);
  if (audit) await auditCurrentScene(page);
  await noHorizontalOverflow(page);
  await page.getByRole('button', { name: 'Il reste une petite chose' }).click();
  await expect(page.getByRole('button', { name: 'Vivre ce moment' })).toHaveCount(0);
  if (audit) await auditCurrentScene(page);
  await page.getByRole('button', { name: 'Ouvrir la boîte à bague', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText(proposalDemo.question);
  if (audit) await auditCurrentScene(page);
  await noHorizontalOverflow(page);
  await page.getByRole('button', { name: 'Vivre ce moment' }).click();
  await expect(page.getByRole('button', { name: 'Oui, mille fois oui' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'J’ai besoin de temps' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Non, je ne le souhaite pas' })).toBeVisible();
  if (audit) await auditCurrentScene(page);
  await noHorizontalOverflow(page);
}

async function playParty(page: Page, audit = false) {
  await page.getByRole('button', { name: 'Accepter la mission' }).click();
  await expect(page.getByRole('button', { name: 'Trouvez les 3 indices' })).toBeDisabled();
  if (audit) await auditCurrentScene(page);
  // Un faux indice doit donner un retour sans faire progresser le compteur.
  await page.getByRole('button', { name: 'Examiner la plante', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'garde le silence' })).toBeVisible();
  await expect(page.getByLabel('0 indices trouvés sur 3', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Un petit indice ?' }).click();
  await expect(page.locator('.party-room-object.is-hinted')).toHaveCount(1);

  await page.getByRole('button', { name: 'Examiner la boule disco', exact: true }).click();
  await expect(page.getByLabel('1 indices trouvés sur 3', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: /^Examiner la boule disco/ }).click();
  await expect(page.getByLabel('1 indices trouvés sur 3', { exact: true })).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: 'déjà dans votre poche' })).toBeVisible();

  await page.getByRole('button', { name: 'Examiner le vinyle', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Trouvez les 3 indices' })).toBeDisabled();
  const photo = page.getByRole('button', { name: 'Examiner la photo sur le canapé', exact: true });
  await photo.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByLabel('3 indices trouvés sur 3', { exact: true })).toBeVisible();
  if (audit) await auditCurrentScene(page);
  await noHorizontalOverflow(page);
  await page.getByRole('button', { name: 'Ouvrir l’invitation' }).click();
  await expect(page.getByRole('heading', { name: partyDemo.name, exact: true })).toBeVisible();
  await expect(page.getByText(partyDemo.address, { exact: true })).toBeVisible();
  await expect(page.getByText(partyDemo.dressCode!, { exact: true })).toBeVisible();
  if (audit) await auditCurrentScene(page);
  await noHorizontalOverflow(page);
  await page.getByRole('button', { name: 'Passer en mode fête' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('une place');
  await expect(page.getByText(partyDemo.message)).toBeVisible();
  await expect(page.getByRole('link', { name: 'Voir l’adresse sur la carte' })).toHaveAttribute('href', `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(partyDemo.address)}`);
  await expect(page.getByText('Aucune présence n’est enregistrée sur ce site.', { exact: false })).toBeVisible();
  // La démo ne possède aucun faux contact. Le lien RSVP apparaît avec une configuration réelle.
  await expect(page.getByRole('link', { name: /Confirmer par email|Confirmer sur WhatsApp/ })).toHaveCount(0);
  if (audit) await auditCurrentScene(page);
  await noHorizontalOverflow(page);
}

test('Birthday Quest : ballons, bougies, cadeau, message et replay', async ({ page }) => {
  await openExperience(page, '/demo/anniversaire');
  const sound = page.getByRole('button', { name: 'Activer le son', exact: true });
  await expect(sound).toHaveAttribute('aria-pressed', 'false');
  await sound.click();
  await expect(page.getByRole('button', { name: 'Désactiver le son' })).toHaveAttribute('aria-pressed', 'true');
  await playBirthday(page);
  await page.getByRole('button', { name: 'Revivre la surprise' }).click();
  await expect(page.getByRole('button', { name: 'Commencer ma surprise' })).toBeVisible();
  await page.getByRole('button', { name: 'Commencer ma surprise' }).click();
  await expect(page.getByRole('button', { name: 'Éclater le ballon 1', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Place au gâteau' })).toBeDisabled();
});

test('The Big Question : souvenirs, lettre, bague et réponses libres', async ({ page }) => {
  await openExperience(page, '/demo/mariage');
  await playProposal(page);
  await page.getByRole('button', { name: 'Oui, mille fois oui' }).click();
  await expect(page.getByText(proposalDemo.finalMessage)).toBeVisible();
  await page.getByRole('button', { name: 'Revenir aux réponses' }).click();
  await page.getByRole('button', { name: 'J’ai besoin de temps' }).click();
  await expect(page.getByText('Rien ne presse.', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Revenir aux réponses' }).click();
  await page.getByRole('button', { name: 'Non, je ne le souhaite pas' }).click();
  await expect(page.getByText('Ta réponse est entendue et respectée.', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Revivre notre histoire' }).click();
  await expect(page.getByRole('button', { name: 'Commencer notre histoire' })).toBeVisible();
});

test('Secret Party : enquête réelle, révélation, adresse et replay', async ({ page }) => {
  await openExperience(page, '/demo/evenement');
  await playParty(page);
  await page.getByRole('button', { name: 'Rejouer la mission' }).click();
  await page.getByRole('button', { name: 'Accepter la mission' }).click();
  await expect(page.getByLabel('0 indices trouvés sur 3', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Trouvez les 3 indices' })).toBeDisabled();
});

test('Recharger chaque lien direct réinitialise la surprise sans erreur', async ({ page }) => {
  const routes = [
    ['/demo/anniversaire', 'Commencer ma surprise'],
    ['/demo/mariage', 'Commencer notre histoire'],
    ['/demo/evenement', 'Accepter la mission'],
  ] as const;
  for (const [route, start] of routes) {
    await openExperience(page, route);
    await page.getByRole('button', { name: start, exact: true }).click();
    await expect(page.getByRole('button', { name: start, exact: true })).toHaveCount(0);
    await page.reload();
    await hydrate(page);
    await expect(page.getByRole('button', { name: start, exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Activer le son', exact: true })).toHaveAttribute('aria-pressed', 'false');
  }
});

test('La création personnalisée est accessible et exclue de l’indexation', async ({ page }) => {
  await openExperience(page, '/creation/anniversaire-louise');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Louise');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  await page.getByRole('button', { name: 'Commencer ma surprise' }).click();
  await expect(page.getByRole('button', { name: 'Éclater le ballon 1', exact: true })).toBeVisible();
  await page.reload();
  await hydrate(page);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Louise');
  await noHorizontalOverflow(page);
});

test('Les trois expériences se terminent avec les animations réduites', async ({ page }) => {
  test.setTimeout(90_000);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openExperience(page, '/demo/anniversaire');
  await playBirthday(page, true);
  await expect(page.locator('.confetti-effect')).toHaveCount(0);
  await openExperience(page, '/demo/mariage');
  await playProposal(page, true);
  await page.getByRole('button', { name: 'Oui, mille fois oui' }).click();
  await expect(page.getByText(proposalDemo.finalMessage)).toBeVisible();
  await auditCurrentScene(page);
  await expect(page.locator('.confetti-effect')).toHaveCount(0);
  await openExperience(page, '/demo/evenement');
  await playParty(page, true);
  await expect(page.locator('.confetti-effect')).toHaveCount(0);
});

for (const width of [320, 375, 390, 430, 768, 1024, 1440]) {
  test(`Vitrine et expériences sans débordement à ${width} px`, async ({ page }) => {
    test.setTimeout(60_000);
    await page.setViewportSize({ width, height: 900 });
    for (const route of ['/', '/demo/anniversaire', '/demo/mariage', '/demo/evenement']) {
      const response = await page.goto(route);
      expect(response?.status()).toBe(200);
      if (route !== '/') await hydrate(page);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await noHorizontalOverflow(page);
    }
  });
}
