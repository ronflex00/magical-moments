import type { BirthdayConfig } from './types';

/** Démonstration fictive. Les photos restent facultatives. */
export const birthdayDemo: BirthdayConfig = {
  id: 'demo-birthday',
  slug: 'anniversaire-lou',
  type: 'birthday',
  metadata: {
    title: 'Une surprise pour Yaye Arame Diop · Birthday Quest',
    description: 'Des ballons, un vœu et une jolie surprise : une petite aventure d’anniversaire.',
    noindex: true,
  },
  firstName: 'Yaye Arame Diop',
  age: 23,
  message: 'À tes idées un peu folles, à tes éclats de rire et à toutes les belles choses qui t’attendent. Que cette nouvelle année te ressemble : lumineuse, douce et pleine de surprises. Joyeux anniversaire, Yaye Arame Diop !',
  gift: {
    title: 'Une journée rien que pour toi',
    description: 'Un petit-déjeuner au lit, une escapade surprise et ton gâteau préféré. Aujourd’hui, on s’occupe de tout. Toi, profite.',
  },
  audio: { src: '/audio/birthday-garden.mp3', volume: 0.55 },
  colors: { background: '#fff8ed', accent: '#f4778b', secondary: '#bca7df' },
  photos: [],
  candleCount: 5,
  interactions: { balloonsToPop: 3, giftTaps: 3 },
};
