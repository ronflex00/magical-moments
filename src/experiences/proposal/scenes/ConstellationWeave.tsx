import { useRef, useState, type PointerEvent } from 'react';
import { ConfettiBurst } from '../../../components/effects/ConfettiBurst';

const points = [[16, 51], [33, 19], [52, 53], [72, 25], [85, 66]] as const;

/** Un même parcours se dessine au doigt, à la souris ou avec cinq boutons clavier. */
export function ConstellationWeave({ connected, connect }: { connected: number[]; connect: (index: number) => void }) {
  const [feedback, setFeedback] = useState('Commence par l’étoile 1. Un glissement, ou une touche après l’autre.');
  const dragging = useRef(false);
  const board = useRef<HTMLDivElement>(null);
  const latest = useRef(connected.length);
  latest.current = connected.length;

  function choose(index: number) {
    if (index < latest.current) return;
    if (index !== latest.current) { setFeedback(`Notre fil cherche encore l’étoile ${latest.current + 1}.`); return; }
    latest.current += 1;
    connect(index);
    setFeedback(index === 4 ? 'Nos petits instants viennent de dessiner un infini.' : `Le fil brille. Retrouve maintenant l’étoile ${index + 2}.`);
  }
  function trace(event: PointerEvent<HTMLDivElement>) {
    if (!dragging.current || !board.current) return;
    const rect = board.current.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width * 100;
    const y = (event.clientY - rect.top) / rect.height * 100;
    const point = points.findIndex(([px, py]) => Math.abs(x - px) < 9 && Math.abs(y - py) < 13);
    if (point >= 0) choose(point);
  }
  return <div className="proposal-weave">
    <div ref={board} className="proposal-weave-board" aria-label="Relier les cinq étoiles dans l’ordre" onPointerDown={event => { if (event.pointerType === 'mouse' && event.button !== 0) return; dragging.current = true; board.current?.setPointerCapture(event.pointerId); trace(event); }} onPointerMove={trace} onPointerUp={event => { dragging.current = false; if(board.current?.hasPointerCapture(event.pointerId)) board.current.releasePointerCapture(event.pointerId); }} onPointerCancel={() => { dragging.current = false; }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="M16 51 33 19 52 53 72 25 85 66" fill="none" stroke="currentColor" strokeOpacity=".2" strokeWidth=".3" strokeDasharray="1 2"/><polyline points={points.slice(0, connected.length).map(([x, y]) => `${x},${y}`).join(' ')} fill="none" stroke="currentColor" strokeWidth=".7" vectorEffect="non-scaling-stroke"/><ellipse cx="51" cy="48" rx="42" ry="36" fill="none" stroke="currentColor" strokeOpacity=".12" strokeWidth=".3"/></svg>
      {points.map(([x, y], index) => <button type="button" className={`proposal-weave-node ${connected.includes(index) ? 'is-connected' : ''}`} key={index} style={{ left: `${x}%`, top: `${y}%` }} aria-label={`Relier l’étoile ${index + 1}`} aria-pressed={connected.includes(index)} onClick={() => choose(index)}><span aria-hidden="true">✧</span><small>{index + 1}</small></button>)}
      <ConfettiBurst eventKey={connected.length} tone="gold"/>
    </div>
    <p className="proposal-weave-feedback" role="status">{feedback}</p>
    <div className="proposal-weave-count" role="status">{connected.length} / 5 étoiles réunies</div>
    <p className="proposal-small-note">Le geste est facultatif : touche les numéros, ou utilise Tab puis Entrée.</p>
  </div>;
}
