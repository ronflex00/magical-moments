import type { PartyConfig } from '../../data/types';

export const clueIds = ['disco', 'record', 'photo'] as const;
export type ClueId = (typeof clueIds)[number];
export type RoomObjectId = ClueId | 'plant' | 'drink' | 'speaker';

export function isClue(id: RoomObjectId): id is ClueId {
  return (clueIds as readonly string[]).includes(id);
}

export function discoverClue(found: readonly ClueId[], object: RoomObjectId): ClueId[] {
  return isClue(object) && !found.includes(object) ? [...found, object] : [...found];
}

export function canUnlockParty(found: readonly ClueId[]): boolean {
  return clueIds.every((id) => found.includes(id));
}

export function nextClueHint(found: readonly ClueId[]): { id: ClueId; text: string } | null {
  const next = clueIds.find((id) => !found.includes(id));
  if (!next) return null;
  const hints: Record<ClueId, string> = {
    disco: 'Tout en haut, un objet transforme la lumière en confettis.',
    record: 'À gauche, les bonnes nouvelles tournent à 33 tours.',
    photo: 'Sur le canapé, un souvenir attend de livrer son adresse.',
  };
  return { id: next, text: hints[next] };
}

export function formatPartyDate(date: string): string {
  // Midi local évite un décalage de date lors d’une conversion de fuseau horaire.
  const parsed = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(parsed);
}

export function getRsvpLinks(config: Pick<PartyConfig, 'name' | 'rsvp'>): { email?: string; whatsapp?: string } {
  const message = `Bonjour ! Je confirme ma présence à « ${config.name} ». À très vite !`;
  const links: { email?: string; whatsapp?: string } = {};
  const email = config.rsvp.email?.trim();
  if (email && /^[^\s@?&<>]+@[^\s@?&<>]+\.[^\s@?&<>]+$/.test(email)) {
    links.email = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(`RSVP — ${config.name}`)}&body=${encodeURIComponent(message)}`;
  }
  const whatsapp = config.rsvp.whatsapp?.replace(/[\s()+.\-]/g, '');
  if (whatsapp && /^\d{8,15}$/.test(whatsapp)) {
    links.whatsapp = `https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`;
  }
  return links;
}
