import { describe, expect, it } from 'vitest';
import { withBase } from './paths';

describe('Chemins de déploiement', () => {
  it('sert routes, ancres de retour et médias sous le projet GitHub Pages', () => {
    expect(withBase('/', '/magical-moments')).toBe('/magical-moments/');
    expect(withBase('/demo/anniversaire/', '/magical-moments/')).toBe('/magical-moments/demo/anniversaire/');
    expect(withBase('/#experiences', '/magical-moments/')).toBe('/magical-moments/#experiences');
    expect(withBase('photos/souvenir.webp', '/magical-moments/')).toBe('/magical-moments/photos/souvenir.webp');
    expect(withBase('/audio/musique.mp3', '/magical-moments/')).toBe('/magical-moments/audio/musique.mp3');
  });
  it('conserve les chemins à la racine et évite le double préfixe', () => {
    expect(withBase('/favicon.svg', '/')).toBe('/favicon.svg');
    expect(withBase('/demo/mariage/', '')).toBe('/demo/mariage/');
    expect(withBase('/magical-moments/images/share.png', '/magical-moments')).toBe('/magical-moments/images/share.png');
  });
  it.each(['#experiences', '?mode=preview', 'https://example.com/photo.webp', '//cdn.example.com/image.png', 'mailto:hello@example.com', 'data:audio/wav;base64,AA=='])('conserve le lien autonome %s', path => {
    expect(withBase(path, '/magical-moments/')).toBe(path);
  });
});
