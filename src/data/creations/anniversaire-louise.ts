import type { BirthdayConfig } from '../types';
import { birthdayDemo } from '../birthday-demo';

/** Exemple intégralement fictif. Un fichier = une création statique. */
export default {
  ...birthdayDemo,
  id: 'example-louise',
  slug: 'anniversaire-louise',
  metadata: {
    title: 'Une journée pour Louise',
    description: 'Une surprise d’anniversaire fictive pour illustrer la personnalisation.',
    noindex: true,
  },
  firstName: 'Louise',
  age: 30,
  candleCount: 3,
  message: 'Louise, que tes trente ans soient le début de mille jolies aventures. Voici une petite attention pour une grande journée. Avec toute notre affection !',
  gift: { title: 'Une parenthèse au grand air', description: 'Une escapade imaginaire pour cet exemple : une cabane, des livres et le temps de profiter.' },
  colors: { background: '#faf6ec', accent: '#d57465', secondary: '#adc0a1' },
} satisfies BirthdayConfig;
