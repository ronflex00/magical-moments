import { useState, type DragEvent } from 'react';
import type { PartyConfig } from '../../../data/types';
import type { ClueId } from '../party-game';
import { clueOrder, placeClue, type ClueSlots } from './party-puzzles';
import { ConfettiBurst } from '../../../components/effects/ConfettiBurst';

export function ClueWorkbench({ config, slots, onPlace, code }: { config: PartyConfig; slots: ClueSlots; onPlace: (slots: ClueSlots) => void; code: string }) {
  const [selected, setSelected] = useState<ClueId | null>(null);
  const [feedback, setFeedback] = useState('Choisissez une pièce, puis touchez sa case : date, heure ou lieu.');
  const [burst, setBurst] = useState(0);
  const labels: Record<ClueId, string> = { disco: 'la date', record: 'l’heure', photo: 'le lieu' };
  const values: Record<ClueId, string> = { disco: new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long' }).format(new Date(`${config.date}T12:00:00`)), record: config.time.replace(':',' h '), photo: config.address };
  function place(position: number, clue = selected) {
    if (!clue) { setFeedback('Choisissez d’abord une pièce du carnet.'); return; }
    const next = placeClue(slots, clue, position);
    if (next === slots) { setFeedback('Pas tout à fait : la date vient avant l’heure, puis le lieu. Essayez une autre case.'); return; }
    onPlace(next); setSelected(null); setBurst(value => value + 1);
    setFeedback(`Bien joué ! Cette pièce révèle le chiffre ${code[position]}.`);
  }
  function drop(event: DragEvent, index: number) {
    event.preventDefault();
    const clue = event.dataTransfer.getData('text/plain');
    if (clueOrder.includes(clue as ClueId)) place(index, clue as ClueId);
  }
  return <div className="party-workbench">
    <div className="party-loose-clues" aria-label="Les trois pièces à assembler">{(['photo','disco','record'] as ClueId[]).map(clue => <button key={clue} type="button" draggable={!slots.includes(clue)} disabled={slots.includes(clue)} className={`party-clue-piece ${selected === clue ? 'is-selected' : ''}`} aria-label={`Choisir l’indice : ${labels[clue]}`} aria-pressed={selected === clue} onClick={() => setSelected(clue)} onDragStart={event => { setSelected(clue); event.dataTransfer.setData('text/plain',clue); event.dataTransfer.effectAllowed='move'; }}><span aria-hidden="true">{clue === 'disco' ? '◷' : clue === 'record' ? '◉' : '⌂'}</span><small>{labels[clue]}</small><strong>{values[clue]}</strong><i>{slots.includes(clue) ? 'Pièce placée ✓' : 'À vous de la placer ↗'}</i></button>)}</div>
    <div className="party-clue-slots" aria-label="Le ticket à reconstituer">{clueOrder.map((clue,index) => <button key={clue} type="button" onDragOver={event => event.preventDefault()} onDrop={event => drop(event,index)} disabled={slots[index] !== null} onClick={() => place(index)} aria-label={`Placer dans la case ${index + 1} : ${labels[clue]}`} className={slots[index] ? 'is-filled' : ''}><small>0{index + 1} · {labels[clue]}</small>{slots[index] ? <strong className="party-code-fragment">{code[index]}</strong> : <span aria-hidden="true">+</span>}<span>{slots[index] ? 'CHIFFRE TROUVÉ' : 'POSEZ VOTRE PIÈCE'}</span></button>)}<ConfettiBurst eventKey={burst} tone="disco"/></div>
    <p className="party-puzzle-feedback" role="status">{feedback}</p>
    <p className="party-puzzle-tip">Au doigt ou au clavier : choisissez, puis placez. Le glisser-déposer est aussi possible à la souris.</p>
  </div>;
}
