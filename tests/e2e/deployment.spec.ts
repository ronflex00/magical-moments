import { expect, test } from '@playwright/test';
import { appPath } from './paths';

const routes = ['/', '/demo/anniversaire/', '/demo/mariage/', '/demo/evenement/', '/creation/anniversaire-louise/'];
const publicOrigin = process.env.SITE_URL || 'https://ronflex00.github.io';

test('Les cinq routes chargent leurs ressources et leurs polices sous le chemin de base', async ({ page }) => {
  const failures: string[] = [];
  const localResources: string[] = [];
  page.on('pageerror', error => failures.push(error.message));
  page.on('response', response => {
    if (response.status() >= 400) failures.push(`${response.status()} ${response.url()}`);
  });
  page.on('requestfailed', request => {
    if (request.failure()?.errorText !== 'net::ERR_ABORTED') failures.push(`${request.url()} : ${request.failure()?.errorText}`);
  });
  page.on('request', request => {
    const url = new URL(request.url());
    if (url.origin === new URL(page.url()).origin) localResources.push(url.pathname);
  });
  for (const route of routes) {
    expect((await page.goto(appPath(route)))?.status()).toBe(200);
    if (route !== '/') await expect(page.locator('astro-island').first()).not.toHaveAttribute('ssr');
    await page.evaluate(async () => { await document.fonts.ready; });
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    expect(await page.evaluate(() => document.fonts.check('16px "DM Sans Variable"') && document.fonts.check('16px "Fraunces Variable"'))).toBe(true);
    const links = await page.locator('a[href]').evaluateAll(anchors => anchors.map(anchor => (anchor as HTMLAnchorElement).href));
    const currentOrigin = new URL(page.url()).origin;
    for (const href of links) if (new URL(href).origin === currentOrigin) expect(new URL(href).pathname).toMatch(new RegExp(`^${appPath('/')}`));
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', new URL(appPath(route), publicOrigin).href);
  }
  expect(failures).toEqual([]);
  expect(localResources.some(path => path.endsWith('.woff2'))).toBe(true);
  expect(localResources.some(path => path.endsWith('.js'))).toBe(true);
  for (const path of localResources) expect(path.startsWith(appPath('/'))).toBe(true);
});

test('Le sitemap, le partage et le favicon utilisent les URL publiques complètes', async ({ page, request }) => {
  await page.goto(appPath('/'));
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', new URL(appPath('/images/share.png'), publicOrigin).href);
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', appPath('/favicon.svg'));
  for (const [path, type] of [['/images/share.png', 'image/png'], ['/favicon.svg', 'image/svg+xml']]) {
    const response = await request.get(appPath(path));
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain(type);
    expect((await response.body()).byteLength).toBeGreaterThan(100);
  }
  const sitemap = await request.get(appPath('/sitemap.xml'));
  expect(sitemap.status()).toBe(200);
  const xml = await sitemap.text();
  expect(xml).toContain(`<loc>${new URL(appPath('/'), publicOrigin).href}</loc>`);
  expect(xml).not.toContain('/creation/anniversaire-louise');
  expect(xml).not.toContain('/demo/');
  const robots = await request.get(appPath('/robots.txt'));
  expect(robots.status()).toBe(200);
  expect(await robots.text()).toContain(`Sitemap: ${new URL(appPath('/sitemap.xml'), publicOrigin).href}`);
  await page.goto(appPath('/creation/anniversaire-louise/'));
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
});

test('Le retour à la vitrine conserve son ancre dans le sous-dossier', async ({ page }) => {
  await page.goto(appPath('/demo/anniversaire/'));
  await expect(page.locator('astro-island').first()).not.toHaveAttribute('ssr');
  await page.getByRole('link', { name: 'Toutes les expériences', exact: false }).click();
  await expect(page).toHaveURL(new RegExp(`${appPath('/')}#experiences$`));
  await expect(page.locator('#experiences')).toBeInViewport();
  await page.reload();
  await expect(page.getByRole('link', { name: 'Essayer cette expérience', exact: true })).toHaveCount(3);
});
