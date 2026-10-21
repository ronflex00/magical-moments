import { GestureSurface } from '../../../components/gestures/GestureSurface';
import { GestureHint } from '../../../components/gestures/GestureHint';
import { ScratchVeil } from '../../../components/gestures/ScratchVeil';
import { useEffect, useState } from 'react';
import { motionSettings } from '../../../lib/animation/settings';
import { ConfettiBurst } from '../../../components/effects/ConfettiBurst';

export const gardenCaches = [
  { label: 'la fleur', x: 16, y: 27, star: 0, kind: 'flower' },
  { label: 'le petit cadeau', x: 70, y: 58, star: 1, kind: 'gift' },
  { label: 'le nuage', x: 72, y: 15, star: 2, kind: 'cloud' },
  { label: 'le champignon', x: 34, y: 68, star: -1, kind: 'mushroom' },
  { label: 'le livre', x: 44, y: 22, star: -1, kind: 'book' },
] as const;

function CacheArt({ kind }: { kind: string }) {
  return <svg data-ambient className={`bq-cache-art cache-${kind}`} viewBox="0 0 90 90" fill="none" aria-hidden="true">
    {kind === 'flower' ? <><path d="M45 48v38m0-11Q11 49 18 73q14 13 27 2" stroke="#78865f" strokeWidth="4" fill="#aebd8e"/><g fill="#efafc0" stroke="#b8788e" strokeWidth="1.5"><circle cx="45" cy="21" r="15"/><circle cx="63" cy="35" r="15"/><circle cx="54" cy="55" r="15"/><circle cx="31" cy="55" r="15"/><circle cx="25" cy="33" r="15"/></g><circle cx="44" cy="37" r="13" fill="#f6d783"/></> : kind === 'gift' ? <><rect x="14" y="35" width="62" height="46" rx="4" fill="#efb5c1" stroke="#9d6777" strokeWidth="2"/><path d="M10 31h70v13H10z" fill="#f9ccd2" stroke="#9d6777" strokeWidth="2"/><path d="M40 31h12v50H40Z" fill="#f1d58e"/><path d="M45 31c-40-3-31-33-13-20 7 5 10 12 13 20Zm0 0c40-3 31-33 13-20-7 5-10 12-13 20Z" fill="#f6df9f" stroke="#b48b5b" strokeWidth="2"/></> : kind === 'cloud' ? <><path d="M17 66C-3 46 14 28 29 34c2-29 41-30 45-2 24 0 28 35 5 37H23Z" fill="#fffaf0" stroke="#c8bad5" strokeWidth="2"/><path d="M39 52v3m20-3v3m-15 8q5 4 10 0" stroke="#9b83a3" strokeWidth="2" strokeLinecap="round"/></> : kind === 'mushroom' ? <><path d="m36 41-8 40h36l-8-40" fill="#fff6dd" stroke="#b19a7b" strokeWidth="2"/><path d="M9 46C12 0 77-1 82 46c-19 12-52 12-73 0Z" fill="#d99ca6" stroke="#9f6b7c" strokeWidth="2"/><circle cx="29" cy="32" r="7" fill="#fff0d7"/><circle cx="56" cy="22" r="6" fill="#fff0d7"/><circle cx="67" cy="40" r="5" fill="#fff0d7"/></> : <><path d="m8 25 36 5 36-5v48l-36 6-36-6Z" fill="#fff6dd" stroke="#9a897b" strokeWidth="2"/><path d="M44 30v49m-27-39 18 3m-18 7 18 3m20-10 16-3m-16 14 16-3" stroke="#baa58d" strokeWidth="2"/><path d="M59 25V9l11 6-11 10Z" fill="#d8a8bb"/></>}
  </svg>;
}

export function StarHunt({ found, messages, onFind, onExplore }: { found: number[]; messages: readonly string[]; onFind: (id: number) => void; onExplore?:()=>void }) {
  const [opened, setOpened] = useState<number[]>([]);
  const [feedback, setFeedback] = useState('Trois étoiles à nous. ✧');
  const [hint, setHint] = useState(false);
  const [burst, setBurst] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => setHint(true), motionSettings.hintDelay);
    return () => clearTimeout(timer);
  }, []);
  const open=(index:number)=>{const cache=gardenCaches[index];setOpened(values=>values.includes(index)?values:[...values,index]);onExplore?.();setFeedback(cache.star>=0?'Une étoile ! ✧':cache.kind==='book'?'Une histoire, pas une étoile. ♡':'Un clin d’œil. Cherche encore.');};
  return <div className="bq-star-hunt">
    <div className="bq-garden" aria-label="Le jardin des étoiles à explorer">
      <svg className="bq-garden-scenery" viewBox="0 0 700 380" preserveAspectRatio="none" aria-hidden="true"><path d="M0 0h700v380H0Z" fill="#f2ede0"/><path d="M0 258Q150 202 310 256T700 233v147H0Z" fill="#dce5cb"/><path d="M0 330q200-86 377-10t323-1v61H0Z" fill="#c7d5b7"/><path d="M300 380c-30-55 160-55 70-92s-119-38-75-72" stroke="#f7ecd4" strokeWidth="31" strokeLinecap="round" fill="none"/><circle data-ambient cx="93" cy="64" r="27" fill="#f0d797"/><path d="m47 280 6-18 6 18m526 36 6-18 6 18m55-60 6-18 6 18" stroke="#9aaa85" strokeWidth="3" fill="none"/><path d="M485 116h52m-401 48h41" stroke="#ded9ca" strokeWidth="2" strokeDasharray="3 5"/><path d="m559 64 3 8 8 3-8 3-3 8-3-8-8-3 8-3Z" fill="#d8bb7b"/></svg>
      {gardenCaches.map((cache, index) => {
        const isFound = found.includes(cache.star);
        const isOpen = opened.includes(index) || isFound;
        return <div key={cache.kind} className={`bq-garden-cache ${isOpen ? 'is-open' : ''} ${isFound ? 'is-found' : ''} ${hint && cache.star >= 0 && !isFound ? 'is-hinted' : ''}`} style={{ left: `${cache.x}%`, top: `${cache.y}%` }}>
          <GestureSurface axis={isOpen?"both":"y"} direction={isOpen?0:-1} threshold={isOpen?40:28} disabled={isFound} onCommit={()=>{if(!isOpen)open(index);else if(cache.star>=0&&!isFound){onFind(cache.star);setBurst(value=>value+1);setFeedback(messages[cache.star]);}}}>{!isOpen ? <button type="button" className="bq-cache-cover gesture-object" aria-label={`Explorer ${cache.label}`} onClick={() => open(index)}><CacheArt kind={cache.kind}/>{cache.kind==='cloud'&&<ScratchVeil onReveal={()=>open(index)}/>}</button>
            : cache.star >= 0 ? <button type="button" className="bq-found-star gesture-object" disabled={isFound} aria-label={`Cueillir l’étoile ${cache.star + 1}`} onClick={() => { onFind(cache.star); setBurst(value => value + 1); setFeedback(messages[cache.star]); }}><span aria-hidden="true">{isFound ? '✓' : '✧'}</span></button>
              : <button type="button" className="bq-cache-empty" aria-label={`Refermer ${cache.label}`} onClick={() => setOpened(values => values.filter(id => id !== index))}><span aria-hidden="true">♡</span></button>}</GestureSurface>
        </div>;
      })}
      <ConfettiBurst eventKey={burst}/>
    </div>
    <GestureHint kind="rub" done={found.length===3} label="Soulève les objets · frotte le nuage"/><p className="bq-garden-feedback" role="status">{feedback}</p>
    <div className="bq-wish-collection" aria-label="Les étoiles de ton carnet">{messages.map((message, index) => <div key={index} className={found.includes(index) ? 'is-collected' : ''}><span aria-hidden="true">{found.includes(index) ? '✧' : '·'}</span><p>{found.includes(index) ? message : `Petit bonheur ${index + 1}`}</p></div>)}</div>
    <button type="button" className="bq-hint-button" onClick={() => { setHint(true); setFeedback('Fleur · nuage · cadeau ✧'); }}>{hint ? 'Voir les cachettes des étoiles' : 'Un petit indice ?'}</button>
  </div>;
}
