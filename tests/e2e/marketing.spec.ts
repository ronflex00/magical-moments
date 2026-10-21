import { appPath } from './paths';
import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { siteConfig } from '../../src/site-config';

test('La pause de l’ambiance conserve les interactions du cadeau',async({page})=>{
  await page.goto(appPath('/'));
  await page.getByRole('button',{name:'Mettre les animations ambiantes en pause',exact:true}).click();
  await expect(page.locator('.art-flower')).toHaveCSS('animation-play-state','paused');
  await page.locator('.surprise-art').click();
  await expect(page.locator('#hero-surprise')).toBeVisible();
  await page.getByRole('button',{name:'Reprendre les animations ambiantes',exact:true}).click();
  await expect(page.locator('.motion-toggle')).toHaveAttribute('aria-pressed','false');
});

test('La personnalisation locale modifie le prénom, le mot et la palette', async ({ page }) => {
  await page.goto(appPath('/'));
  const preview=page.locator('.personal-playground');
  await preview.getByLabel('Son prénom', {exact:true}).fill('Charlie');
  await expect(preview.locator('.preview-name')).toHaveText('Pour Charlie.');
  await preview.getByLabel('Votre petit mot', {exact:true}).selectOption({label:'À nous et aux jours heureux.'});
  await expect(preview.locator('.preview-message')).toHaveText('À nous et aux jours heureux.');
  await preview.getByRole('button',{name:'Sauge',exact:true}).click();
  await expect(preview.getByRole('button',{name:'Sauge',exact:true})).toHaveAttribute('aria-pressed','true');
  await expect(preview.getByRole('button',{name:'Corail',exact:true})).toHaveAttribute('aria-pressed','false');
  await expect(preview.locator('.personal-art')).toHaveCSS('--preview-color','#71855e');
});

test('Les animations du hero sont suspendues hors écran et la navigation revient correctement', async ({ page }) => {
  await page.goto(appPath('/'));
  const hero=page.locator('.hero-art');
  await expect(hero).toHaveAttribute('data-motion-active','true');
  await page.locator('#contact').scrollIntoViewIfNeeded();
  await expect(hero).toHaveAttribute('data-motion-active','false');
  await expect(hero.locator('.art-flower')).toHaveCSS('animation-play-state','paused');
  await page.locator('.card-try').first().click();
  await expect(page).toHaveURL(/\/demo\/anniversaire\/?$/);
  await page.goBack();
  await page.locator('.surprise-art').scrollIntoViewIfNeeded();
  await expect(hero).toHaveAttribute('data-motion-active','true');
  await page.locator('.surprise-art').click();
  await expect(page.locator('#hero-surprise')).toBeVisible();
  await page.getByRole('button',{name:'Refermer la surprise'}).click();
  await expect(page.locator('#hero-surprise')).toBeHidden();
});

test('Le cadeau réagit au pointeur sur ordinateur et au tap sur mobile', async ({page,isMobile})=>{
  await page.goto(appPath('/'));
  const hero=page.locator('.hero-art');
  const gift=page.locator('.surprise-art');
  if(isMobile) await gift.tap();
  else {
    const box=await hero.boundingBox();
    if(!box) throw new Error('Hero introuvable');
    await page.mouse.move(box.x+box.width*.7,box.y+box.height*.3);
    await expect.poll(()=>hero.evaluate(element=>element.style.getPropertyValue('--px'))).not.toBe('');
    await gift.click();
  }
  await expect(hero).toHaveClass(/is-open/);
  await expect(hero.locator('.gift-bow')).toHaveCSS('opacity','0');
  await expect(hero.locator('.gift-light')).toHaveCSS('opacity','0.52');
  await expect(hero.locator('.hero-confetti i')).not.toHaveCount(0);
});

test('Le menu mobile s’ouvre, se ferme au choix d’un lien et avec Échap', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(appPath('/'));
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
  await page.goto(appPath('/'));
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
  const destinations = ['/demo/anniversaire/', '/demo/mariage/', '/demo/evenement/'];
  await page.goto(appPath('/'));
  await expect(page.getByRole('link', { name: 'Essayer cette expérience', exact: true })).toHaveCount(3);
  for (let index = 0; index < destinations.length; index += 1) {
    const link = page.getByRole('link', { name: 'Essayer cette expérience', exact: true }).nth(index);
    await expect(link).toHaveAttribute('href', appPath(destinations[index]));
    await link.click();
    await expect(page).toHaveURL(new RegExp(`${destinations[index]}$`));
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: `Retour à ${siteConfig.name}` })).toHaveAttribute('href', appPath('/'));
    await page.goto(appPath('/'));
  }
});

test('Le contact et les métadonnées ne publient aucune fausse coordonnée', async ({ page }) => {
  await page.goto(appPath('/'));
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
    await page.goto(appPath(route));
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
