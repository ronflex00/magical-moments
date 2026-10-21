import type { CreationConfig } from './types';

function object(value: unknown, field: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${field} doit être un objet de configuration.`);
  }
  return value as Record<string, unknown>;
}

function text(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${field} doit contenir un texte non vide.`);
  return value;
}

function integer(value: unknown, field: string, min: number, max: number): void {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < min || value > max) {
    throw new Error(`${field} doit être un entier compris entre ${min} et ${max}.`);
  }
}

function safeSource(value: unknown, field: string): void {
  const src = text(value, field);
  const invalidSource = () => { throw new Error(`${field} doit être un chemin local ou une URL HTTP(S), sans autre protocole.`); };
  // Les sources data:, javascript:, file:, les URL sans protocole et les caractères
  // de contrôle ne doivent jamais devenir des attributs src issus d'une configuration.
  if (src !== src.trim() || /[\u0000-\u001f\u007f\\]/.test(src) || src.startsWith('//')) invalidSource();
  if (/^[a-z][a-z0-9+.-]*:/i.test(src)) {
    let url: URL;
    try { url = new URL(src); } catch { return invalidSource(); }
    if (!/^https?:$/.test(url.protocol) || !url.hostname || url.username || url.password) invalidSource();
  } else if (src.startsWith('#') || src.startsWith('?') || ['/', '.', '..'].includes(src)) {
    invalidSource();
  }
}

function photo(value: unknown, field: string): void {
  const item = object(value, field);
  safeSource(item.src, `${field}.src`);
  text(item.alt, `${field}.alt`);
  if (item.caption !== undefined && typeof item.caption !== 'string') throw new Error(`${field}.caption doit être un texte.`);
}

function photos(value: unknown, field: string): void {
  if (!Array.isArray(value)) throw new Error(`${field} doit être une liste de photos, éventuellement vide.`);
  for (const [index, item] of value.entries()) photo(item, `${field}[${index}]`);
}

/** Vérifie les fichiers locaux au build et signale le champ à corriger. */
export function validateCreation(config: CreationConfig): void {
  const data = object(config, 'La création');
  const id = text(data.id, 'id');
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/.test(id)) throw new Error('id doit comporter 1 à 80 lettres, chiffres, tirets ou tirets bas, en commençant par une lettre ou un chiffre.');
  const slug = text(data.slug, 'slug');
  if (slug.length > 80 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error('slug doit comporter au maximum 80 lettres minuscules ou chiffres, séparés par des tirets simples (exemple : une-surprise-pour-lou).');
  }
  if (!['birthday', 'proposal', 'party'].includes(data.type as string)) throw new Error('type doit être birthday, proposal ou party.');

  const metadata = object(data.metadata, 'metadata');
  text(metadata.title, 'metadata.title');
  text(metadata.description, 'metadata.description');
  if (typeof metadata.noindex !== 'boolean') throw new Error('metadata.noindex doit être un booléen (true ou false).');

  const colors = object(data.colors, 'colors');
  for (const key of ['background', 'accent', 'secondary']) {
    if (typeof colors[key] !== 'string' || !/^#(?:[a-f\d]{3}|[a-f\d]{4}|[a-f\d]{6}|[a-f\d]{8})$/i.test(colors[key] as string)) {
      throw new Error(`colors.${key} doit être une couleur hexadécimale CSS : #RGB, #RGBA, #RRGGBB ou #RRGGBBAA.`);
    }
  }

  if (data.audio !== undefined) {
    const audio = object(data.audio, 'audio');
    safeSource(audio.src, 'audio.src');
    if (audio.volume !== undefined && (typeof audio.volume !== 'number' || !Number.isFinite(audio.volume) || audio.volume < 0 || audio.volume > 1)) {
      throw new Error('audio.volume doit être un nombre compris entre 0 et 1, ou être omis.');
    }
  }

  if (data.type === 'birthday') {
    text(data.firstName, 'firstName');
    text(data.message, 'message');
    integer(data.age, 'age', 1, 130);
    integer(data.candleCount, 'candleCount', 1, 8);
    const interactions = object(data.interactions, 'interactions');
    integer(interactions.balloonsToPop, 'interactions.balloonsToPop', 3, 8);
    integer(interactions.giftTaps, 'interactions.giftTaps', 2, 8);
    const gift = object(data.gift, 'gift');
    text(gift.title, 'gift.title');
    text(gift.description, 'gift.description');
    photos(data.photos, 'photos');
  }

  if (data.type === 'proposal') {
    for (const key of ['firstName', 'partnerName', 'welcome', 'letter', 'question', 'finalMessage']) text(data[key], key);
    if (!Array.isArray(data.memories) || data.memories.length !== 3) throw new Error('memories doit contenir exactement trois souvenirs.');
    for (const [index, value] of data.memories.entries()) {
      const memory = object(value, `memories[${index}]`);
      text(memory.title, `memories[${index}].title`);
      text(memory.message, `memories[${index}].message`);
      if (memory.photo !== undefined) photo(memory.photo, `memories[${index}].photo`);
    }
    photos(data.photos, 'photos');
  }

  if (data.type === 'party') {
    if (data.puzzleCode !== undefined && (typeof data.puzzleCode !== 'string' || !/^\d{3}$/.test(data.puzzleCode))) throw new Error('puzzleCode doit comporter exactement trois chiffres.');
    for (const key of ['name', 'organizer', 'address', 'message']) text(data[key], key);
    if (data.dressCode !== undefined && typeof data.dressCode !== 'string') throw new Error('dressCode doit être un texte ou être omis.');
    const date = text(data.date, 'date');
    const parsedDate = new Date(`${date}T00:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== date) {
      throw new Error('date doit être une date réelle au format ISO AAAA-MM-JJ (exemple : 2027-06-19).');
    }
    if (typeof data.time !== 'string' || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(data.time)) throw new Error('time doit être une heure au format HH:MM entre 00:00 et 23:59.');

    const rsvp = object(data.rsvp, 'rsvp');
    if (rsvp.email !== undefined) {
      if (typeof rsvp.email !== 'string' || (rsvp.email.trim() && !/^[^\s@?&<>]+@[^\s@?&<>]+\.[^\s@?&<>]+$/.test(rsvp.email.trim()))) {
        throw new Error('rsvp.email doit être une adresse email valide, être vide ou être omis.');
      }
    }
    if (rsvp.whatsapp !== undefined) {
      if (typeof rsvp.whatsapp !== 'string') throw new Error('rsvp.whatsapp doit être un numéro international, être vide ou être omis.');
      const number = rsvp.whatsapp.trim();
      const digits = number.replace(/[\s()+.\-]/g, '');
      if (number && (!/^\+?[1-9][\d\s().-]*$/.test(number) || !/^[1-9]\d{7,14}$/.test(digits))) {
        throw new Error('rsvp.whatsapp doit contenir 8 à 15 chiffres au format international (exemple : +33 6 12 34 56 78).');
      }
    }
  }
}
