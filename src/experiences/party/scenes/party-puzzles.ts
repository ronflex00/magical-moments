import type { PartyConfig } from '../../../data/types';
import type { ClueId } from '../party-game';

export const clueOrder: readonly ClueId[] = ['disco', 'record', 'photo'];
export type ClueSlots = [ClueId | null, ClueId | null, ClueId | null];
export function placeClue(slots: ClueSlots, clue: ClueId, position: number): ClueSlots {
  if (!Number.isInteger(position) || position < 0 || position > 2 || clueOrder[position] !== clue || slots.includes(clue)) return slots;
  const next = [...slots] as ClueSlots;
  next[position] = clue;
  return next;
}
export function cluesAssembled(slots: ClueSlots): boolean { return clueOrder.every((clue, index) => slots[index] === clue); }
export function getPartyCode(config: Pick<PartyConfig, 'puzzleCode'>): string { return config.puzzleCode ?? '274'; }
export function codeMatches(value: string, expected: string): boolean { return /^\d{3}$/.test(value) && value === expected; }
