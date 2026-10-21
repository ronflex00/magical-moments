import type { APIRoute } from 'astro';
import { siteConfig } from '../site-config';
import { withBase } from '../lib/paths';
export const GET: APIRoute = () => new Response(`User-agent: *\nAllow: ${withBase('/')}\n${siteConfig.url ? `Sitemap: ${new URL(withBase('/sitemap.xml'), siteConfig.url).href}\n` : ''}`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
