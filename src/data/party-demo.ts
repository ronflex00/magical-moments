import type { PartyConfig } from './types';

/** Exemple fictif : remplacer les informations et renseigner un contact RSVP. */
export const partyDemo: PartyConfig = {
  id: 'demo-secret-party',
  slug: 'secret-party',
  type: 'party',
  metadata: {
    title: 'La soirée secrète — une invitation à déchiffrer',
    description: 'Un décor disco, trois indices et une soirée à découvrir. Testez cette invitation interactive.',
    noindex: false,
  },
  name: 'La nuit des étoiles',
  organizer: 'Le collectif Minuit',
  date: '2027-06-19',
  time: '20:30',
  address: 'Le Studio Disco · 24 rue des Étoiles, Paris (adresse fictive)',
  dressCode: 'Une touche de paillettes. Beaucoup de vous.',
  message: 'Le meilleur programme ? Vous, nous, quelques vinyles et aucune envie de rentrer tôt. La piste vous attend.',
  rsvp: {},
  colors: { background: '#251347', accent: '#ff7947', secondary: '#f9df69' },
};
