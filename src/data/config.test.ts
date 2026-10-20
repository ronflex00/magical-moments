import { describe, expect, it } from 'vitest';
import { birthdayDemo } from './birthday-demo';
import { proposalDemo } from './proposal-demo';
import { partyDemo } from './party-demo';
import type { CreationConfig } from './types';
import { validateCreation } from './validate-config';

describe('Les configurations de création', () => {
  it.each([birthdayDemo, proposalDemo, partyDemo])('accepte la démonstration $type sans la modifier', (config) => {
    const before = structuredClone(config);
    expect(() => validateCreation(config)).not.toThrow();
    expect(config).toEqual(before);
  });

  it.each(['../secret', 'un/slash', 'Une-Surprise', 'deux--tirets', 'avec espace', 'x'.repeat(81)])('rejette le slug dangereux ou invalide %s', (slug) => {
    expect(() => validateCreation({ ...birthdayDemo, slug })).toThrow(/slug/);
  });

  it('signale clairement les identifiants, métadonnées et types manquants', () => {
    expect(() => validateCreation({ ...birthdayDemo, id: '' })).toThrow(/id/);
    expect(() => validateCreation({ ...birthdayDemo, id: 'bad/id' })).toThrow(/id/);
    expect(() => validateCreation({ ...birthdayDemo, metadata: { ...birthdayDemo.metadata, title: '  ' } })).toThrow(/metadata.title/);
    expect(() => validateCreation({ ...birthdayDemo, metadata: { ...birthdayDemo.metadata, description: '' } })).toThrow(/metadata.description/);
    expect(() => validateCreation({ ...birthdayDemo, metadata: { ...birthdayDemo.metadata, noindex: 'true' } } as unknown as CreationConfig)).toThrow(/metadata.noindex/);
    expect(() => validateCreation({ ...birthdayDemo, type: 'unknown' } as unknown as CreationConfig)).toThrow(/type/);
    expect(() => validateCreation(null as unknown as CreationConfig)).toThrow(/objet/);
  });

  it.each(['red', 'var(--color)', 'url(https://exemple.fr/image.svg)', '#12', '#gggggg', '#ffffff; color: red'])('refuse la couleur non hexadécimale %s', (accent) => {
    expect(() => validateCreation({ ...birthdayDemo, colors: { ...birthdayDemo.colors, accent } })).toThrow(/colors.accent/);
  });

  it.each(['#abc', '#abcd', '#aAbBcC', '#aAbBcCdd'])('accepte la couleur CSS hexadécimale %s', (accent) => {
    expect(() => validateCreation({ ...birthdayDemo, colors: { ...birthdayDemo.colors, accent } })).not.toThrow();
  });

  it('borne les interactions aux valeurs réellement prévues par le mini-jeu', () => {
    expect(() => validateCreation({ ...birthdayDemo, candleCount: 8, age: 130, interactions: { balloonsToPop: 8, giftTaps: 8 } })).not.toThrow();
    for (const age of [0, 131, 25.5, NaN]) expect(() => validateCreation({ ...birthdayDemo, age })).toThrow(/age/);
    for (const candleCount of [0, 9, 1.5, Infinity]) expect(() => validateCreation({ ...birthdayDemo, candleCount })).toThrow(/candleCount/);
    for (const balloonsToPop of [2, 9, NaN]) expect(() => validateCreation({ ...birthdayDemo, interactions: { ...birthdayDemo.interactions, balloonsToPop } })).toThrow(/balloonsToPop/);
    for (const giftTaps of [1, 9, 2.5]) expect(() => validateCreation({ ...birthdayDemo, interactions: { ...birthdayDemo.interactions, giftTaps } })).toThrow(/giftTaps/);
  });

  it('requiert trois souvenirs non vides et les messages personnalisables', () => {
    const missing = structuredClone(proposalDemo);
    missing.memories.pop();
    expect(() => validateCreation(missing)).toThrow(/trois souvenirs/);
    const empty = structuredClone(proposalDemo);
    empty.memories[1].message = ' ';
    expect(() => validateCreation(empty)).toThrow(/memories\[1\].message/);
    expect(() => validateCreation({ ...proposalDemo, question: '' })).toThrow(/question/);
    expect(() => validateCreation({ ...proposalDemo, partnerName: '' })).toThrow(/partnerName/);
    expect(() => validateCreation({ ...partyDemo, address: '' })).toThrow(/address/);
    expect(() => validateCreation({ ...birthdayDemo, gift: { title: '', description: 'Un cadeau' } })).toThrow(/gift.title/);
  });

  it('ne confond pas une liste de trois emplacements vides avec trois souvenirs', () => {
    const config = { ...proposalDemo, memories: new Array(3) } as unknown as CreationConfig;
    expect(() => validateCreation(config)).toThrow(/memories\[0\]/);
  });

  it.each(['2027-02-29', '2027-04-31', '2027-13-01', '2027-6-19', 'demain'])('refuse une date impossible ou non ISO %s', (date) => {
    expect(() => validateCreation({ ...partyDemo, date })).toThrow(/date/);
  });

  it('accepte un vrai 29 février et les limites horaires', () => {
    expect(() => validateCreation({ ...partyDemo, date: '2028-02-29', time: '00:00' })).not.toThrow();
    expect(() => validateCreation({ ...partyDemo, time: '23:59' })).not.toThrow();
  });

  it.each(['24:00', '20:60', '8:30', '20:30:00', 'midi'])('rejette une heure invalide %s', (time) => {
    expect(() => validateCreation({ ...partyDemo, time })).toThrow(/time/);
  });

  it('accepte les RSVP absents, vides ou valides et leurs formats usuels', () => {
    expect(() => validateCreation({ ...partyDemo, rsvp: {} })).not.toThrow();
    expect(() => validateCreation({ ...partyDemo, rsvp: { email: '', whatsapp: ' ' } })).not.toThrow();
    expect(() => validateCreation({ ...partyDemo, rsvp: { email: 'bonjour+fete@example.com', whatsapp: '+33 6 12 34 56 78' } })).not.toThrow();
    expect(() => validateCreation({ ...partyDemo, rsvp: { whatsapp: '1 (212) 555-0123' } })).not.toThrow();
  });

  it.each(['sans-arobase', 'a@', 'a@exemple.fr?body=surprise', 'a\n@exemple.fr'])('rejette une adresse RSVP invalide %s', (email) => {
    expect(() => validateCreation({ ...partyDemo, rsvp: { email } })).toThrow(/rsvp.email/);
  });

  it.each(['0612345678', '123', '+331234567890123456', '+33abc123456', '++33123456789'])('rejette un numéro WhatsApp invalide %s', (whatsapp) => {
    expect(() => validateCreation({ ...partyDemo, rsvp: { whatsapp } })).toThrow(/rsvp.whatsapp/);
  });

  it.each(['/images/souvenir.webp', './photos/nous.avif', 'photos/un joli jour.jpg', 'https://example.com/photo.webp', 'http://localhost:4321/photo.svg'])('accepte la photo locale ou HTTP(S) %s', (src) => {
    expect(() => validateCreation({ ...birthdayDemo, photos: [{ src, alt: 'Un souvenir fictif' }] })).not.toThrow();
  });

  it.each(['javascript:alert(1)', 'data:image/svg+xml,test', 'file:///etc/passwd', '//example.com/photo.webp', ' https://example.com/photo.webp', '/\\example.com/photo.webp', 'https://user:pass@example.com/photo.webp', '#ancre', 'https://exemple.com/\nphoto.jpg', 'https://'])('rejette une source de photo interdite %s', (src) => {
    expect(() => validateCreation({ ...proposalDemo, photos: [{ src, alt: 'Un souvenir fictif' }] })).toThrow(/photos\[0\].src/);
  });

  it('valide aussi les photos facultatives des souvenirs et leurs descriptions accessibles', () => {
    const config = structuredClone(proposalDemo);
    config.memories[0].photo = { src: '/images/souvenir.webp', alt: '' };
    expect(() => validateCreation(config)).toThrow(/memories\[0\].photo.alt/);
    config.memories[0].photo = { src: 'javascript:alert(1)', alt: 'Un souvenir' };
    expect(() => validateCreation(config)).toThrow(/memories\[0\].photo.src/);
  });

  it.each([birthdayDemo, proposalDemo, partyDemo])('accepte une musique facultative dans la création $type', (config) => {
    expect(() => validateCreation({ ...config, audio: undefined })).not.toThrow();
    expect(() => validateCreation({ ...config, audio: { src: '/audio/musique.mp3', volume: .25 } })).not.toThrow();
    expect(() => validateCreation({ ...config, audio: { src: 'https://example.com/musique.ogg' } })).not.toThrow();
    expect(() => validateCreation({ ...config, audio: { src: '/audio/musique.mp3', volume: 0 } })).not.toThrow();
    expect(() => validateCreation({ ...config, audio: { src: '/audio/musique.mp3', volume: 1 } })).not.toThrow();
  });

  it.each(['', ' ', 'javascript:alert(1)', 'data:audio/mp3,test', 'file:///musique.mp3', '//example.com/musique.mp3'])('rejette la source musicale vide ou interdite %s', (src) => {
    expect(() => validateCreation({ ...proposalDemo, audio: { src } })).toThrow(/audio.src/);
  });

  it.each([-.1, 1.1, NaN, Infinity, '0.25', null])('rejette le volume musical invalide %s', (volume) => {
    const invalid = { ...proposalDemo, audio: { src: '/audio/musique.mp3', volume } } as unknown as CreationConfig;
    expect(() => validateCreation(invalid)).toThrow(/audio.volume/);
  });

  it('requiert une source lorsque la configuration audio est présente', () => {
    expect(() => validateCreation({ ...partyDemo, audio: {} } as unknown as CreationConfig)).toThrow(/audio.src/);
    expect(() => validateCreation({ ...partyDemo, audio: null } as unknown as CreationConfig)).toThrow(/audio.*objet/);
  });
});
