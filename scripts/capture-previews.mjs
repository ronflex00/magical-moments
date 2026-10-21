import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined });
const previewUrl = process.env.PREVIEW_URL || 'http://127.0.0.1:4321/magical-moments/';
await mkdir('artifacts/previews', { recursive: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  for (const [name, route] of [['accueil', '/'], ['anniversaire', '/demo/anniversaire'], ['mariage', '/demo/mariage'], ['evenement', '/demo/evenement']]) {
    await page.goto(new URL(route.replace(/^\/+/, ''), previewUrl.endsWith('/') ? previewUrl : previewUrl + '/').href);
    await page.evaluate(async () => { await document.fonts.ready; });
    await page.screenshot({ path: `artifacts/previews/${name}-desktop.png`, fullPage: true });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  for (const [name, route] of [['accueil', '/'], ['anniversaire', '/demo/anniversaire'], ['mariage', '/demo/mariage'], ['evenement', '/demo/evenement']]) {
    await page.goto(new URL(route.replace(/^\/+/, ''), previewUrl.endsWith('/') ? previewUrl : previewUrl + '/').href);
    await page.evaluate(async () => { await document.fonts.ready; });
    await page.screenshot({ path: `artifacts/previews/${name}-mobile.png`, fullPage: true });
  }
  await page.close();
} finally { await browser.close(); }
console.log('8 aperçus créés dans artifacts/previews.');
