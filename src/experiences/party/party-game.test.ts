import { describe, expect, it } from 'vitest';
import { canUnlockParty, discoverClue, formatPartyDate, getRsvpLinks, nextClueHint } from './party-game';

describe('l’enquête Secret Party', () => {
  it('ne progresse pas avec une fausse piste ou un objet déjà trouvé', () => {
    expect(discoverClue([], 'plant')).toEqual([]);
    expect(discoverClue(['disco'], 'disco')).toEqual(['disco']);
  });

  it('nécessite les trois indices distincts pour débloquer l’invitation', () => {
    expect(canUnlockParty([])).toBe(false);
    expect(canUnlockParty(['disco', 'record'])).toBe(false);
    expect(canUnlockParty(['disco', 'disco', 'record'])).toBe(false);
    expect(canUnlockParty(discoverClue(['record', 'photo'], 'disco'))).toBe(true);
  });

  it('donne une aide uniquement vers un indice restant', () => {
    expect(nextClueHint([])?.id).toBe('disco');
    expect(nextClueHint(['disco'])?.id).toBe('record');
    expect(nextClueHint(['disco', 'record'])?.id).toBe('photo');
    expect(nextClueHint(['disco', 'record', 'photo'])).toBeNull();
  });

  it('présente la date en français et conserve un libellé de date non standard', () => {
    expect(formatPartyDate('2027-06-19')).toBe('samedi 19 juin 2027');
    expect(formatPartyDate('date à venir')).toBe('date à venir');
  });
});

describe('réponses à l’invitation', () => {
  it('ne fabrique aucun contact quand la configuration est vide', () => {
    expect(getRsvpLinks({ name: 'La fête', rsvp: {} })).toEqual({});
  });

  it('prépare des liens de messagerie avec le nom de la soirée et un message', () => {
    const links = getRsvpLinks({ name: 'Fête & lumière', rsvp: { email: 'test@example.com', whatsapp: '+33 (6) 12 34 56 78' } });
    expect(links.email).toContain('mailto:test%40example.com?subject=');
    expect(decodeURIComponent(links.email!)).toContain('RSVP — Fête & lumière');
    expect(links.whatsapp).toContain('https://wa.me/33612345678?text=');
    expect(decodeURIComponent(links.whatsapp!)).toContain('Je confirme ma présence');
  });

  it('écarte les contacts mal formés et l’injection de paramètres', () => {
    expect(getRsvpLinks({ name: 'La fête', rsvp: { email: 'hello@example.com?bcc=other@example.com', whatsapp: 'javascript:12345678' } })).toEqual({});
  });
});
