import type { APIRoute } from 'astro';
import { siteConfig } from '../site-config';
import { creations } from '../data/creations';
const escapeXml = (value: string) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
export const GET: APIRoute = () => {
  const paths = ['/', ...creations.filter(c => !c.metadata.noindex).map(c => `/creation/${c.slug}`)];
  const entries = siteConfig.url ? paths.map(path => `<url><loc>${escapeXml(new URL(path, siteConfig.url).href)}</loc></url>`).join('') : '';
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries}</urlset>`, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
