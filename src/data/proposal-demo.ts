import type { ProposalConfig } from './types';

/** Données fictives : remplacer les textes et ajouter des photos locales pour un client. */
export const proposalDemo: ProposalConfig = {
  id: 'demo-proposal',
  slug: 'notre-constellation',
  type: 'proposal',
  metadata: {
    title: 'Notre constellation · The Big Question',
    description: 'Une histoire à retrouver dans les étoiles, une lettre à ouvrir et une grande question. Démonstration fictive.',
    noindex: false,
  },
  firstName: 'Camille',
  partnerName: 'Alex',
  welcome: 'Il y a des rencontres qui changent le ciel. La nôtre a changé le mien.',
  letter: 'Camille,\n\nDepuis ce premier café, les jours ordinaires ont quelque chose d’extraordinaire. J’aime nos grandes aventures, nos tout petits rituels et cette façon que tu as de rendre chaque endroit un peu plus doux.\n\nJe ne sais pas tout ce que demain nous réserve. Mais je sais avec qui j’aimerais le découvrir. Avec toi, encore et encore.\n\nAlors ce soir, sous notre petit ciel, j’ai une question pour toi.',
  question: 'Veux-tu m’épouser ?',
  finalMessage: 'À tous les matins qui nous attendent. Aux aventures encore inconnues. À nous, et à la suite de notre histoire.',
  memories: [
    { title: 'Ce premier café', message: 'On devait rester une heure. On a parlé jusqu’à la fermeture. Je crois que mon histoire préférée a commencé ce jour-là.' },
    { title: 'Les pieds dans l’océan', message: 'Il pleuvait un peu et on avait oublié les serviettes. Pourtant, je n’échangerais ce coucher de soleil contre aucun autre.' },
    { title: 'Notre petit quotidien', message: 'Les dimanches sans programme, les pâtes improvisées, nos chansons dans la cuisine. Avec toi, les petits riens deviennent tout.' },
  ],
  photos: [],
  colors: { background: '#101c2b', accent: '#e9ce9c', secondary: '#d9b7ac' },
};
