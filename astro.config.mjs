import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

const [owner, repository] = (process.env.GITHUB_REPOSITORY || 'ronflex00/magical-moments').split('/');
const site = process.env.SITE_URL || `https://${owner}.github.io`;
const projectSite = new URL(site).hostname === `${owner}.github.io`.toLowerCase()
  && repository.toLowerCase() !== `${owner}.github.io`.toLowerCase();
const base = process.env.BASE_PATH || (projectSite ? `/${repository}` : '/');

export default defineConfig({
  site,
  base,
  output: 'static',
  integrations: [react()],
  vite: { plugins: [tailwindcss()] },
  devToolbar: { enabled: false },
});
