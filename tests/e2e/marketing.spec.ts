import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { siteConfig } from '../../src/site-config';

test('Le menu mobile s’ouvre, se ferme au choix d’un lien et avec Échap', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const toggle = page.getByRole('button', { name: 'Ouvrir le menu', exact: true });
  const navigation = page.getByRole('navigation', { name: 'Navigation mobile' });
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(navigation).toBeHidden();
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(navigation).toBeVisible();
  await navigation.getByRole('link', { name: 'Les expériences', exact: true }).click();
  await expect(page).toHaveURL(/\/#experiences$/);
  await expect(navigation).toBeHidden();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await toggle.click();
  await page.keyboard.press('Escape');
  await expect(navigation).toBeHidden();
  await expect(toggle).toBeFocused();
});

test('Le cadeau de la vitrine révèle et referme sa surprise au clavier', async ({ page }) => {
  await page.goto('/');
  const gift = page.getByRole('button', { name: 'Ouvrir le cadeau et découvrir un petit message' });
  const surprise = page.locator('#hero-surprise');
  await expect(gift).toHaveAttribute('aria-expanded', 'false');
  await expect(surprise).toBeHidden();
  await gift.focus();
  await page.keyboard.press('Enter');
  await expect(gift).toHaveAttribute('aria-expanded', 'true');
  await expect(surprise).toBeVisible();
  await expect(surprise).toContainText('Vous venez d’offrir un sourire.');
  await page.keyboard.press('Space');
  await expect(gift).toHaveAttribute('aria-expanded', 'false');
  await expect(surprise).toBeHidden();
});

test('Les trois créations possèdent un lien de démonstration fonctionnel', async ({ page }) => {
  const destinations = ['/demo/anniversaire', '/demo/mariage', '/demo/evenement'];
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Essayer cette expérience', exact: true })).toHaveCount(3);
  for (let index = 0; index < destinations.length; index += 1) {
    const link = page.getByRole('link', { name: 'Essayer cette expérience', exact: true }).nth(index);
    await expect(link).toHaveAttribute('href', destinations[index]);
    await link.click();
    await expect(page).toHaveURL(new RegExp(`${destinations[index]}$`));
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: `Retour à ${siteConfig.name}` })).toHaveAttribute('href', '/');
    await page.goto('/');
  }
});

test('Le contact et les métadonnées ne publient aucune fausse coordonnée', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(new RegExp(siteConfig.name));
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', siteConfig.description);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /\/images\/share\.png$/);
  await expect(page.locator('a[href="#"],a[href=""],a[href^="javascript:"]')).toHaveCount(0);
  const contact = page.locator('#contact');
  if (!siteConfig.email && !Object.values(siteConfig.social).some(Boolean)) {
    await expect(contact.getByText('Les demandes de création ouvriront bientôt.')).toBeVisible();
    await expect(page.locator('a[href^="mailto:"],a[href^="https://instagram.com"],a[href^="https://www.instagram.com"],a[href^="https://www.tiktok.com"],a[href^="https://wa.me"]')).toHaveCount(0);
    await expect(contact.getByRole('link', { name: 'En attendant, place à la magie' })).toHaveAttribute('href', '#experiences');
  } else {
    if (siteConfig.email) await expect(contact.locator(`a[href^="mailto:${siteConfig.email}"]`)).toHaveCount(1);
    for (const url of Object.values(siteConfig.social).filter(Boolean)) {
      expect(await contact.locator('a').evaluateAll(links => links.map(link => link.getAttribute('href')))).toContain(url);
    }
  }
});

for (const route of ['/', '/demo/anniversaire', '/demo/mariage', '/demo/evenement']) {
  test(`Accessibilité WCAG A/AA de ${route}`, async ({ page }, testInfo) => {
    test.setTimeout(60_000);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(route);
    if (route !== '/') {
      await expect(page.locator('astro-island').first()).not.toHaveAttribute('ssr');
    }
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.evaluate(async () => { await document.fonts.ready; });
    const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    if (result.violations.length) {
      await testInfo.attach('axe-violations', { body: JSON.stringify(result.violations, null, 2), contentType: 'application/json' });
    }
    expect(result.violations.map(violation => ({
      id: violation.id,
      impact: violation.impact,
      elements: violation.nodes.map(node => ({ target: node.target, reason: node.failureSummary })),
    }))).toEqual([]);
  });
}
