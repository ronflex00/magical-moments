import { useState } from 'react';
import type { PartyConfig } from '../../../data/types';
import type { ClueId } from '../party-game';
import type { SoundName } from '../../../lib/audio/sounds';
import { clueOrder, placeClue, type ClueSlots } from './party-puzzles';
import { ConfettiBurst } from '../../../components/effects/ConfettiBurst';
import { GestureSurface } from '../../../components/gestures/GestureSurface';
import { GestureHint } from '../../../components/gestures/GestureHint';

export function ClueWorkbench({config,slots,onPlace,code,onSound}:{config:PartyConfig;slots:ClueSlots;onPlace:(slots:ClueSlots)=>void;code:string;onSound?:(name:SoundName)=>void}) {
  const [selected,setSelected]=useState<ClueId|null>(null);
  const [feedback,setFeedback]=useState('Date → heure → lieu.');
  const [burst,setBurst]=useState(0);
  const labels:Record<ClueId,string>={disco:'la date',record:'l’heure',photo:'le lieu'};
  const values:Record<ClueId,string>={disco:new Intl.DateTimeFormat('fr-FR',{day:'numeric',month:'long'}).format(new Date(`${config.date}T12:00:00`)),record:config.time.replace(':',' h '),photo:config.address};
  function place(position:number,clue=selected){
    if(!clue){setFeedback('Choisissez une pièce.');return false;}
    const next=placeClue(slots,clue,position);
    if(next===slots){setFeedback('Date → heure → lieu. Encore un essai ?');return false;}
    onPlace(next);setSelected(null);setBurst(v=>v+1);onSound?.('clue_snap');setFeedback(`Clic ! Chiffre ${code[position]}.`);return true;
  }
  function drop(x:number,y:number,clue:ClueId){
    const target=document.elementsFromPoint(x,y).map(node=>node.closest<HTMLElement>('[data-clue-slot]')).find(Boolean);
    if(target)return place(Number(target.dataset.clueSlot),clue);setFeedback('Glissez la pièce vers son cadre.');return false;
  }
  function hover(point:{x:number;y:number}|null){
    document.querySelectorAll('.is-drop-target').forEach(node=>node.classList.remove('is-drop-target'));
    if(!point)return;
    const target=document.elementsFromPoint(point.x,point.y).map(node=>node.closest<HTMLElement>('[data-clue-slot]:not(:disabled)')).find(Boolean);
    target?.classList.add('is-drop-target');return Boolean(target);
  }
  return <div className="party-workbench">
    <div className="party-loose-clues" aria-label="Les trois pièces à assembler">{(['photo','disco','record'] as ClueId[]).map(clue=><GestureSurface key={clue} axis="both" className="party-clue-drag" disabled={slots.includes(clue)} onStart={()=>{setSelected(clue);onSound?.('object_drag');}} onDrag={hover} onDrop={(x,y)=>drop(x,y,clue)}><button type="button" disabled={slots.includes(clue)} className={`party-clue-piece gesture-object ${selected===clue?'is-selected':''}`} aria-label={`Choisir l’indice : ${labels[clue]}`} aria-pressed={selected===clue} onClick={()=>setSelected(clue)}><span aria-hidden="true">{clue==='disco'?'◷':clue==='record'?'◉':'⌂'}</span><small>{labels[clue]}</small><strong>{values[clue]}</strong><i>{slots.includes(clue)?'✓':'↟'}</i></button></GestureSurface>)}</div>
    <div className="party-clue-slots" aria-label="Le ticket à reconstituer">{clueOrder.map((clue,index)=><button key={clue} data-clue-slot={index} type="button" disabled={slots[index]!==null} onClick={()=>place(index)} aria-label={`Placer dans la case ${index+1} : ${labels[clue]}`} className={slots[index]?'is-filled':''}><small>0{index+1} · {labels[clue]}</small>{slots[index]?<strong className="party-code-fragment">{code[index]}</strong>:<span aria-hidden="true">+</span>}<span>{slots[index]?'✓':'POSEZ ICI'}</span></button>)}<ConfettiBurst eventKey={burst} tone="disco"/></div>
    <GestureHint kind="drag" done={slots.every(Boolean)} label="Glissez les trois pièces"/>
    <p className="party-puzzle-feedback" role="status">{feedback}</p>
    <p className="sr-only">Au doigt ou au clavier : choisissez une pièce, puis sa case. Vous pouvez aussi glisser chaque pièce jusqu’à son cadre.</p>
  </div>;
}
