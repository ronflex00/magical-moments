import { useRef, useState } from 'react';
import type { PartyConfig } from '../../../data/types';
import type { ClueId } from '../party-game';
import type { SoundName } from '../../../lib/audio/sounds';
import { clueOrder, placeClue, type ClueSlots } from './party-puzzles';
import { ConfettiBurst } from '../../../components/effects/ConfettiBurst';
import { GestureSurface } from '../../../components/gestures/GestureSurface';
import { GestureHint } from '../../../components/gestures/GestureHint';
import { reportGesture } from '../../../components/gestures/GestureDebug';
import { findClueDrop, type DropPoint } from './clue-drop';

export function ClueWorkbench({config,slots,onPlace,code,onSound}:{config:PartyConfig;slots:ClueSlots;onPlace:(slots:ClueSlots)=>void;code:string;onSound?:(name:SoundName)=>void}) {
  const [selected,setSelected]=useState<ClueId|null>(null);
  const [feedback,setFeedback]=useState('Date → heure → lieu.');
  const [burst,setBurst]=useState(0);
  const root=useRef<HTMLDivElement>(null);
  const previousTarget=useRef('');
  const labels:Record<ClueId,string>={disco:'la date',record:'l’heure',photo:'le lieu'};
  const values:Record<ClueId,string>={disco:new Intl.DateTimeFormat('fr-FR',{day:'numeric',month:'long'}).format(new Date(`${config.date}T12:00:00`)),record:config.time.replace(':',' h '),photo:config.address};
  function place(position:number,clue=selected){
    if(!clue){setFeedback('Choisissez une pièce.');return false;}
    const next=placeClue(slots,clue,position);
    if(next===slots){setFeedback('Date → heure → lieu. Encore un essai ?');return false;}
    onPlace(next);setSelected(null);setBurst(v=>v+1);onSound?.('clue_snap');setFeedback(`Clic ! Chiffre ${code[position]}.`);return true;
  }
  function drop(x:number,y:number,clue:ClueId){
    const target=resolve({x,y},clue);
    const accepted=target&&!target.occupied?place(target.position,clue):false;
    if(!target)setFeedback('Glissez la pièce vers son cadre.');
    else if(target.occupied)setFeedback('Cette case est déjà remplie. Choisissez une autre pièce.');
    diagnostic(clue,'dépôt',accepted?'dépôt accepté':'dépôt rejeté',target);
    return accepted;
  }
  function resolve(point:DropPoint,clue:ClueId){
    const workbench=root.current;
    if(!workbench)return null;
    // Fresh viewport rectangles include scroll, the chapter transition and the
    // piece's real translation/rotation. No hit-test depends on DOM paint order.
    const rect=workbench.querySelector(`[data-clue-piece="${clue}"]`)?.getBoundingClientRect();
    const targets=Array.from(workbench.querySelectorAll<HTMLButtonElement>('[data-clue-slot]')).map(node=>({position:Number(node.dataset.clueSlot),occupied:node.disabled,rect:node.getBoundingClientRect()}));
    return findClueDrop(point,rect?{x:rect.left+rect.width/2,y:rect.top+rect.height/2}:null,targets,{left:0,top:0,right:innerWidth,bottom:innerHeight});
  }
  function diagnostic(clue:ClueId,event:string,decision:string,target:ReturnType<typeof resolve>){
    const element=root.current?.querySelector<HTMLElement>(`[data-clue-piece="${clue}"]`)?.parentElement;
    if(!element)return;
    const dropTarget=target?`case ${target.position+1} · ${target.via==='piece'?'centre de pièce':'doigt'}${target.occupied?' · occupée':''}`:'hors des cases';
    reportGesture(element,event,decision,parseFloat(element.style.getPropertyValue('--drag-x'))||0,parseFloat(element.style.getPropertyValue('--drag-y'))||0,{object:`Indice : ${labels[clue]}`,dropTarget});
  }
  function hover(point:DropPoint|null,clue:ClueId){
    const target=point?resolve(point,clue):null;
    // Resolve before updating the highlight so its scale never flickers on/off
    // at the boundary. Keep all queries local to this workbench.
    root.current?.querySelectorAll<HTMLButtonElement>('[data-clue-slot]').forEach(node=>node.classList.toggle('is-drop-target',!!target&&!target.occupied&&Number(node.dataset.clueSlot)===target.position));
    const key=target?`${target.position}:${target.via}:${target.occupied}`:'none';
    if(point&&key!==previousTarget.current)diagnostic(clue,'survol','cible détectée',target);
    previousTarget.current=point?key:'';
    return !!target&&!target.occupied;
  }
  return <div ref={root} className="party-workbench">
    <div className="party-loose-clues" aria-label="Les trois pièces à assembler">{(['photo','disco','record'] as ClueId[]).map(clue=><GestureSurface key={clue} axis="both" className="party-clue-drag" disabled={slots.includes(clue)} onStart={()=>{setSelected(clue);onSound?.('object_drag');}} onDrag={point=>hover(point,clue)} onDrop={(x,y)=>drop(x,y,clue)}><button type="button" data-clue-piece={clue} disabled={slots.includes(clue)} className={`party-clue-piece gesture-object ${selected===clue?'is-selected':''}`} aria-label={`Choisir l’indice : ${labels[clue]}`} aria-pressed={selected===clue} onClick={()=>setSelected(clue)}><span aria-hidden="true">{clue==='disco'?'◷':clue==='record'?'◉':'⌂'}</span><small>{labels[clue]}</small><strong>{values[clue]}</strong><i>{slots.includes(clue)?'✓':'↟'}</i></button></GestureSurface>)}</div>
    <div className="party-clue-slots" aria-label="Le ticket à reconstituer">{clueOrder.map((clue,index)=><button key={clue} data-clue-slot={index} type="button" disabled={slots[index]!==null} onClick={()=>place(index)} aria-label={`Placer dans la case ${index+1} : ${labels[clue]}`} className={slots[index]?'is-filled':''}><small>0{index+1} · {labels[clue]}</small>{slots[index]?<strong className="party-code-fragment">{code[index]}</strong>:<span aria-hidden="true">+</span>}<span>{slots[index]?'✓':'POSEZ ICI'}</span></button>)}<ConfettiBurst eventKey={burst} tone="disco"/></div>
    <GestureHint kind="drag" done={slots.every(Boolean)} label="Glissez les trois pièces"/>
    <p className="party-puzzle-feedback" role="status">{feedback}</p>
    <p className="sr-only">Au doigt ou au clavier : choisissez une pièce, puis sa case. Vous pouvez aussi glisser chaque pièce jusqu’à son cadre.</p>
  </div>;
}
