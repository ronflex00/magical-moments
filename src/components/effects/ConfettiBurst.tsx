import type { CSSProperties } from 'react';
import { useReducedMotion } from 'motion/react';

/** Une explosion locale et finie ; changer eventKey permet de la rejouer. */
export function ConfettiBurst({ eventKey, tone = 'paper' }: { eventKey: number; tone?: 'paper' | 'gold' | 'disco' }) {
  const reduced = useReducedMotion();
  if (!eventKey || reduced) return null;
  return <span key={eventKey} className={`moment-burst burst-${tone}`} aria-hidden="true">{Array.from({ length: 12 }, (_, i) => <i key={i} style={{ '--angle': `${i * 30}deg`, '--distance': `${54 + i % 3 * 21}px`, '--delay': `${i % 3 * .025}s` } as CSSProperties}>{i % 3 === 0 ? '✧' : ''}</i>)}</span>;
}
