import type { APIRoute } from 'astro';
import sharp from 'sharp';
import { siteConfig } from '../../site-config';

/** Image générée au build : le nom de marque vient du même fichier que la vitrine. */
export const GET: APIRoute = async () => {
  const name = siteConfig.name.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <rect width="1200" height="630" fill="#fbf8f1"/><circle cx="1000" cy="290" r="250" fill="#f1d3d7"/>
    <g fill="#dc674e" transform="translate(990 300)"><ellipse rx="30" ry="110"/><ellipse rx="30" ry="110" transform="rotate(60)"/><ellipse rx="30" ry="110" transform="rotate(120)"/></g><circle cx="990" cy="300" r="35" fill="#f3cd73"/>
    <text x="80" y="120" fill="#35372f" font-family="serif" font-size="34">${name}</text>
    <text x="80" y="280" fill="#35372f" font-family="serif" font-size="82">Petits clics.</text>
    <text x="80" y="385" fill="#b9513b" font-family="serif" font-style="italic" font-size="82">Grandes émotions.</text>
    <text x="80" y="520" fill="#35372f" font-family="sans-serif" font-size="26">Des surprises numériques à offrir et à vivre.</text>
  </svg>`;
  const image = await sharp(Buffer.from(svg)).png().toBuffer();
  return new Response(new Uint8Array(image), { headers: { 'Content-Type': 'image/png' } });
};
