// Renseignez vos coordonnées réelles avant publication. Les liens vides sont masqués.
export const siteConfig = {
  name: 'Magical Moments',
  description: 'Des mini-sites interactifs et personnalisés pour transformer vos grandes occasions en souvenirs inoubliables.',
  url: import.meta.env?.SITE
    ? new URL(import.meta.env.BASE_URL, import.meta.env.SITE).href
    : 'https://ronflex00.github.io/magical-moments/',
  email: '',
  social: { instagram: '', tiktok: '', whatsapp: '' },
};
