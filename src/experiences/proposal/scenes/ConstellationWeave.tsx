import { useEffect, useRef, useState } from 'react';
import { ConfettiBurst } from '../../../components/effects/ConfettiBurst';
import { observeContact, type Contact } from '../../../components/gestures/contact';
import { reportGesture } from '../../../components/gestures/GestureDebug';

const points = [[16, 51], [33, 19], [52, 53], [72, 25], [85, 66]] as const;

/** Un même parcours se dessine au doigt, à la souris ou avec cinq boutons clavier. */
export function ConstellationWeave({ connected, connect }: { connected: number[]; connect: (index: number) => void }) {
  const [feedback, setFeedback] = useState('Commence par l’étoile 1. ✦');
  const trail=useRef<SVGPathElement>(null);
  const trailPoints=useRef<string[]>([]);
  const board = useRef<HTMLDivElement>(null);
  const latest = useRef(connected.length);
  latest.current = connected.length;

  function choose(index: number) {
    if (index < latest.current) return;
    if (index !== latest.current) { setFeedback(`L’étoile ${latest.current + 1} t’attend. ✦`); return; }
    latest.current += 1;
    connect(index);
    setFeedback(index === 4 ? 'Notre infini. ✦' : `Étoile ${index + 2} ✦`);
  }
  const select=useRef(choose);select.current=choose;
  useEffect(()=>{
    const element=board.current;if(!element)return;
    let previous:{x:number;y:number}|null=null,frame=0;
    const trace=(contact:Contact)=>{
      const rect=element.getBoundingClientRect(), x=(contact.x-rect.left)/rect.width*100, y=(contact.y-rect.top)/rect.height*100;
      const from=previous||{x,y};
      // Test the whole travelled segment, including stars between coalesced events.
      for(let index=latest.current;index<points.length;index++){
        const [px,py]=points[index],dx=(x-from.x)/9,dy=(y-from.y)/13;
        const length=dx*dx+dy*dy;
        const t=length?Math.max(0,Math.min(1,(((px-from.x)/9)*dx+((py-from.y)/13)*dy)/length)):0;
        if(Math.hypot((from.x+(x-from.x)*t-px)/9,(from.y+(y-from.y)*t-py)/13)>1)break;
        select.current(index);
      }
      previous={x,y};trailPoints.current.push(`${x.toFixed(1)} ${y.toFixed(1)}`);trailPoints.current=trailPoints.current.slice(-32);
      cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{trail.current?.setAttribute('d',trailPoints.current.map((point,index)=>(index?'L':'M')+point).join(' '));});
      reportGesture(element,'tracé',`tracé accepté · ${latest.current}/5 étoiles`,contact.dx,contact.dy);
    };
    const stop=()=>{cancelAnimationFrame(frame);previous=null;trail.current?.setAttribute('opacity','0');element.dataset.drawing='false';};
    const off=observeContact(element,()=>({axis:'both',slop:1,start(contact){previous=null;trailPoints.current=[];trail.current?.setAttribute('opacity','1');element.dataset.drawing='true';trace(contact);},move:trace,end:stop,cancel:stop}));
    return()=>{off();stop();};
  },[]);
  return <div className="proposal-weave">
    <div ref={board} className="proposal-weave-board" data-gesture-input="draw" aria-label="Relier les cinq étoiles dans l’ordre">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="M16 51 33 19 52 53 72 25 85 66" fill="none" stroke="currentColor" strokeOpacity=".2" strokeWidth=".3" strokeDasharray="1 2"/><polyline points={points.slice(0, connected.length).map(([x, y]) => `${x},${y}`).join(' ')} fill="none" stroke="currentColor" strokeWidth=".7" vectorEffect="non-scaling-stroke"/><path ref={trail} className="proposal-weave-trail" fill="none" strokeWidth=".7" vectorEffect="non-scaling-stroke"/><ellipse cx="51" cy="48" rx="42" ry="36" fill="none" stroke="currentColor" strokeOpacity=".12" strokeWidth=".3"/></svg>
      {points.map(([x, y], index) => <button type="button" className={`proposal-weave-node ${connected.includes(index) ? 'is-connected' : ''}`} key={index} style={{ left: `${x}%`, top: `${y}%` }} aria-label={`Relier l’étoile ${index + 1}`} aria-pressed={connected.includes(index)} onClick={() => choose(index)}><span aria-hidden="true">✧</span><small>{index + 1}</small></button>)}
      <ConfettiBurst eventKey={connected.length} tone="gold"/>
    </div>
    <p className="proposal-weave-feedback" role="status">{feedback}</p>
    <div className="proposal-weave-count" role="status">{connected.length} / 5 étoiles réunies</div>
    <p className="proposal-small-note">Trace, ou touche les étoiles dans l’ordre.</p>
  </div>;
}
