import { SwipeAdvance } from '../../components/gestures/SwipeAdvance';
import { GestureSurface } from '../../components/gestures/GestureSurface';
import { GestureHint } from '../../components/gestures/GestureHint';
import { useMemo, useState, type CSSProperties } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import type { PartyConfig } from '../../data/types';
import { ExperienceShell, SceneTransition, ConfettiEffect } from '../../components/shared/ExperienceShell';
import { useSound } from '../../lib/audio/useSound';
import { canUnlockParty, discoverClue, formatPartyDate, getRsvpLinks, isClue, nextClueHint, type ClueId, type RoomObjectId } from './party-game';
import './party.css';
import './party-immersion.css';
import { ClueWorkbench } from './scenes/ClueWorkbench';
import { PartyLock } from './scenes/PartyLock';
import { cluesAssembled, getPartyCode, type ClueSlots } from './scenes/party-puzzles';
import { tactileFeedback } from '../../lib/animation/settings';

const steps = ['La mission', 'Les indices', 'Le ticket', 'Le code', 'L’invitation', 'La soirée'];
const objectLabels: Record<RoomObjectId, string> = {
  disco: 'Examiner la boule disco', record: 'Examiner le vinyle', photo: 'Examiner la photo sur le canapé',
  plant: 'Examiner la plante', drink: 'Examiner le cocktail', speaker: 'Examiner l’enceinte',
};

function Star({ className = '', ...props }: { className?: string }) {
  return <svg className={className} viewBox="0 0 80 80" fill="currentColor" aria-hidden="true" {...props}><path d="m40 0 8.5 25.3L72 12 58.7 35.5 80 40l-21.3 7.5L72 72 47.5 58.7 40 80l-7.5-21.3L8 72l13.3-24.5L0 40l21.3-7.5L8 8l24.5 13.3Z" /></svg>;
}

function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d={diagonal ? 'M5 19 19 5M5 5h14v14' : 'M4 12h15m-6-6 6 6-6 6'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function DiscoBall({ className = '' }: { className?: string }) {
  return <svg className={className} viewBox="0 0 160 170" fill="none" aria-hidden="true">
    <path d="M80 0v24" stroke="#F9DF69" strokeWidth="3" />
    <circle cx="80" cy="86" r="60" fill="#F9DF69" stroke="#251347" strokeWidth="4" />
    <path d="M29 55h102M21 83h118M27 111h106M43 134h74M50 35c-20 30-20 72 0 100M80 26v120M110 35c20 30 20 72 0 100" stroke="#251347" strokeWidth="3" />
    <path d="M80 26v29h-31l9-25ZM22 84h28v27H27ZM80 84h32v27H80ZM111 55h20l8 28h-27ZM50 112h30v32l-25-7ZM113 112h19l-15 22h-10Z" fill="#FFF2C3" />
    <path d="m143 29 3 10 10 3-10 3-3 10-3-10-10-3 10-3ZM14 123l3 8 8 3-8 3-3 8-3-8-8-3 8-3Z" fill="#FF7947" />
  </svg>;
}

function SecretTicket({ organizer }: { organizer: string }) {
  return <div className="party-ticket-wrap" aria-hidden="true" data-ambient>
    <Star className="party-ticket-star" />
    <div className="party-ticket">
      <div className="party-ticket-top"><span>ENTRÉE TRÈS PRIVÉE</span><span>№ 001</span></div>
      <div className="party-ticket-center"><DiscoBall /><span>VOUS ÊTES<br />SUR LA LISTE.</span></div>
      <div className="party-ticket-bottom"><div><small>EXPÉDITEUR</small><strong>{organizer}</strong></div><span className="party-barcode">|||| ||| || ||||| ||</span></div>
      <span className="party-ticket-stamp">TOP<br />SECRET</span>
    </div>
    <span className="party-ticket-note">à ouvrir avec curiosité ↗</span>
    <svg className="party-ticket-squiggle" viewBox="0 0 170 80" fill="none"><path d="M5 40C45-5 48 80 85 40s44-28 54-4m-12 3 15 4-1-16" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>
  </div>;
}

function RoomScenery() {
  return <svg className="party-room-scenery" viewBox="0 0 780 460" preserveAspectRatio="none" aria-hidden="true">
    <path fill="#583883" d="M0 0h780v460H0z" />
    <path fill="#3C2461" d="M0 0h780v46H0zM0 335h780v125H0z" />
    <path d="M0 46h780M0 335h780" stroke="#A178B9" strokeWidth="2" />
    <path fill="#C184AD" opacity=".16" d="m365 20-175 315h460L445 20Z" />
    <path d="m0 460 320-125m-160 125 205-125m25 125v-125m230 125L435 335m345 125L475 335M0 363h780M0 405h780" stroke="#8B61AA" strokeWidth="2" />
    <path d="M32 90h155v97H32z" fill="#F9DF69" stroke="#251347" strokeWidth="7" />
    <path d="m47 169 30-58 25 39 19-30 49 49Z" fill="#F19F75" />
    <circle cx="145" cy="116" r="11" fill="#FF7947" />
    <path d="M565 75h149v88H565z" fill="#FF7947" stroke="#251347" strokeWidth="7" />
    <text x="640" y="111" textAnchor="middle" fill="#251347" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="21">BELLES</text>
    <text x="640" y="140" textAnchor="middle" fill="#251347" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="25">NUITS</text>
    <path d="M223 261c0-21 16-34 36-34h313c23 0 36 13 36 34v84H223Z" fill="#EC968E" stroke="#251347" strokeWidth="5" />
    <path d="M252 245v61m171-74v78m155-65v61" stroke="#BD646E" strokeWidth="3" />
    <path d="M230 290h372v51H230z" fill="#F6B0A0" stroke="#251347" strokeWidth="5" />
    <path d="M207 280c0-13 10-20 23-20s23 7 23 20v66h-46ZM578 280c0-13 10-20 23-20s23 7 23 20v66h-46Z" fill="#FF7947" stroke="#251347" strokeWidth="5" />
    <path d="m231 346-6 22m371-22 6 22" stroke="#F9DF69" strokeWidth="9" />
    <path d="M37 313h170v60H37z" fill="#C77A55" stroke="#251347" strokeWidth="5" />
    <path d="M45 333h153M54 373v16m134-16v16" stroke="#251347" strokeWidth="4" />
    <circle cx="172" cy="347" r="4" fill="#F9DF69" />
    <ellipse cx="385" cy="391" rx="101" ry="12" fill="#251347" opacity=".4" />
    <path d="M315 358h140v10H315z" fill="#FF7947" stroke="#251347" strokeWidth="4" />
    <path d="m334 369-10 32m111-32 10 32" stroke="#F9DF69" strokeWidth="5" />
    <path d="m256 88 6 15 15 6-15 6-6 15-6-15-15-6 15-6Zm263 98 4 11 11 4-11 4-4 11-4-11-11-4 11-4Z" fill="#F9DF69" />
    <path d="m653 208 8 6m-17 16 9-1M305 159l10-6" stroke="#EC968E" strokeWidth="3" strokeLinecap="round" />
  </svg>;
}

function ObjectArt({ id }: { id: RoomObjectId }) {
  if (id === 'disco') return <DiscoBall />;
  if (id === 'record') return <svg viewBox="0 0 130 100" aria-hidden="true"><path d="M5 18h119v73H5z" fill="#F9DF69" stroke="#251347" strokeWidth="4" /><ellipse cx="55" cy="52" rx="39" ry="30" fill="#251347" /><ellipse cx="55" cy="52" rx="29" ry="22" fill="none" stroke="#76528E" strokeWidth="2" /><ellipse cx="55" cy="52" rx="17" ry="13" fill="#FF7947" /><circle cx="55" cy="52" r="3" fill="#F9DF69" /><path className="vinyl-disc" d="M34 35q18-14 37 4" stroke="#fff2c3" strokeOpacity=".4" fill="none" strokeWidth="2"/><path d="M111 31v27l-23 15" stroke="#251347" strokeWidth="5" fill="none" strokeLinecap="round" /><circle cx="111" cy="31" r="6" fill="#FF7947" /></svg>;
  if (id === 'photo') return <svg viewBox="0 0 95 105" aria-hidden="true"><g transform="rotate(12 48 55)"><path d="M14 6h71v88H14z" fill="#FFF2C3" stroke="#251347" strokeWidth="4" /><path d="M23 15h53v49H23z" fill="#A98AC4" /><path d="m23 60 17-26 13 17 9-9 14 18" fill="#F9DF69" /><circle cx="63" cy="28" r="7" fill="#FF7947" /><path d="M29 79h38" stroke="#FF7947" strokeWidth="5" /></g></svg>;
  if (id === 'plant') return <svg viewBox="0 0 100 175" aria-hidden="true"><path d="M50 120V36m0 51L21 65m29 39 29-30" stroke="#B1C584" strokeWidth="5" fill="none" /><path d="M51 59C13 52 15 16 18 12c33 5 42 23 33 47ZM50 81c-5-41 20-58 35-58 10 30-11 51-35 58ZM40 97C10 97 4 75 10 60c24-1 39 16 30 37ZM53 114c-3-28 19-44 41-41-1 28-16 41-41 41Z" fill="#B1C584" stroke="#251347" strokeWidth="3" /><path d="m22 120 9 46h39l10-46Z" fill="#FF7947" stroke="#251347" strokeWidth="4" /><path d="M21 120h60" stroke="#F9DF69" strokeWidth="7" /></svg>;
  if (id === 'drink') return <svg viewBox="0 0 65 100" aria-hidden="true"><path d="m9 17 24 36 24-36Zm24 36v32m-16 2h32" fill="#F19F75" stroke="#251347" strokeWidth="4" strokeLinejoin="round" /><path d="M18 29h30" stroke="#FF7947" strokeWidth="10" /><path d="m40 30 9-25" stroke="#F9DF69" strokeWidth="4" /><circle cx="17" cy="15" r="11" fill="#F9DF69" stroke="#251347" strokeWidth="3" /></svg>;
  return <svg viewBox="0 0 85 155" aria-hidden="true"><rect x="5" y="5" width="75" height="145" rx="5" fill="#251347" stroke="#F9DF69" strokeWidth="4" /><circle cx="42" cy="49" r="22" fill="#76528E" /><circle cx="42" cy="49" r="10" fill="#F9DF69" /><circle cx="42" cy="108" r="28" fill="#76528E" /><circle cx="42" cy="108" r="14" fill="#FF7947" /></svg>;
}

function PartyRoom({ found, hinted, inspect }: { found: ClueId[]; hinted: ClueId | null; inspect: (id: RoomObjectId) => void }) {
  const objects: RoomObjectId[] = ['disco', 'speaker', 'record', 'photo', 'plant', 'drink'];
  return <div className="party-room" role="group" aria-label="Le salon disco : explorez les objets pour trouver les trois indices" aria-describedby="party-room-instructions">
    <RoomScenery />
    <span className="party-room-label" aria-hidden="true">LE SALON DES SECRETS</span>
    {objects.map((id) => {
      const discovered = isClue(id) && found.includes(id);
      return <GestureSurface key={id} axis="both" threshold={45} onCommit={()=>inspect(id)} className={`party-room-object party-object-${id}${discovered ? ' is-found' : ''}${hinted === id ? ' is-hinted' : ''}`}><button type="button" className="party-room-control gesture-object" onClick={() => inspect(id)} aria-label={`${objectLabels[id]}${discovered ? ' — indice trouvé' : ''}`} aria-pressed={discovered}>
        <div className="room-moving-art" data-ambient><ObjectArt id={id} /></div>
        {discovered && <span className="party-object-check" aria-hidden="true">✓</span>}
      </button></GestureSurface>;
    })}
  </div>;
}

function InvitationDetails({ config }: { config: PartyConfig }) {
  return <dl className="party-invitation-details">
    <div><dt>QUAND ?</dt><dd><time dateTime={`${config.date}T${config.time}`}>{formatPartyDate(config.date)}<br /><strong>{config.time.replace(':', ' h ')}</strong></time></dd></div>
    <div><dt>OÙ ?</dt><dd>{config.address}</dd></div>
    {config.dressCode && <div><dt>LA TOUCHE EN PLUS</dt><dd>{config.dressCode}</dd></div>}
  </dl>;
}

export default function PartyExperience({ config }: { config: PartyConfig }) {
  const reduced=useReducedMotion();
  const [scene, setScene] = useState(0);
  const [ticketBack,setTicketBack]=useState(false);
  const [found, setFound] = useState<ClueId[]>([]);
  const [feedback, setFeedback] = useState('Trois indices. À vous de jouer.');
  const [hinted, setHinted] = useState<ClueId | null>(null);
  const [slots, setSlots] = useState<ClueSlots>([null, null, null]);
  const [enteredCode, setEnteredCode] = useState('');
  const [codeUnlocked, setCodeUnlocked] = useState(false);
  const code = getPartyCode(config);
  const sound = useSound(config.audio, 'party', scene);
  const rsvpLinks = useMemo(() => getRsvpLinks(config), [config]);
  const unlocked = canUnlockParty(found);
  const dateLabel = formatPartyDate(config.date);
  const style = { '--party-bg': config.colors.background, '--party-orange': config.colors.accent, '--party-yellow': config.colors.secondary } as CSSProperties;

  function replay() {
    setScene(0);setTicketBack(false);
    setSlots([null, null, null]); setEnteredCode(''); setCodeUnlocked(false);
    setFound([]);
    setHinted(null);
    setFeedback('Trois indices. À vous de jouer.');
  }

  function advance() {
    if ((scene === 1 && !unlocked) || (scene === 2 && !cluesAssembled(slots)) || (scene === 3 && !codeUnlocked)) return;
    tactileFeedback();
    if(scene===0)sound.start();sound.play(scene===0?'vinyl_start':scene>=3?'disco_reveal':'paper_slide');
    setScene(Math.min(5, scene + 1));
  }

  function inspect(id: RoomObjectId) {
    tactileFeedback();
    if (isClue(id)) {
      if (found.includes(id)) {
        setFeedback('Cet indice est déjà dans votre poche.');
        return;
      }
      const nextFound = discoverClue(found, id);
      setFound(nextFound);
      setHinted(null);
      sound.play(id==='record'?'vinyl_start':'clue_pickup');
      const messages: Record<ClueId, string> = {
        disco: `Ça brille ! La boule disco cache une date : ${dateLabel}.`,
        record: `Un vinyle, un rendez-vous : la musique démarre à ${config.time.replace(':', ' h ')}.`,
        photo: 'Bien vu ! Au dos de la photo, vous trouvez le lieu de la soirée.',
      };
      setFeedback(canUnlockParty(nextFound) ? 'Trois indices. Recomposez le ticket !' : messages[id]);
    } else {
      sound.play(id==='speaker'?'keypad_press':'object_drag');
      const messages = {
        plant: 'La plante garde le silence. 🌿',
        drink: 'Un citron. Aucun indice. ✦',
        speaker: 'De bonnes basses… cherchez encore. ♫',
      };
      setFeedback(messages[id]);
    }
  }

  function showHint() {
    const hint = nextClueHint(found);
    if (hint) { setHinted(hint.id); setFeedback(hint.text); }
  }

  return <div className="party-experience" style={style}>
    <ExperienceShell theme="party" label="LA SOIRÉE SECRÈTE" step={scene} steps={steps} onReplay={replay} onBack={() => setScene(value => Math.max(0, value - 1))} audioControl={sound} sound={sound.enabled} onToggleSound={sound.toggle}>
      <ConfettiEffect active={scene === 5} />
      <SceneTransition theme="party" sceneKey={scene}>
        {scene === 0 && <section className="party-intro party-scene" aria-labelledby="party-intro-title">
          <div className="party-intro-copy">
            <span className="party-eyebrow"><span className="party-dot" /> UN MESSAGE CONFIDENTIEL</span>
            <h1 id="party-intro-title">Il se prépare<br />quelque chose<br /><em>de grand.</em><Star /></h1>
            <p>Une invitation. Trois secrets.</p>
            <button className="party-button" type="button" onClick={advance}>Accepter la mission <Arrow /></button>
            <span className="party-small-note">♫ Musique au départ · à votre rythme</span>
          </div>
          <SecretTicket organizer={config.organizer} />
          <div className="party-scene-footer" aria-hidden="true"><Star/><span>À VOUS DE JOUER ✦</span></div>
        </section>}

        {scene === 1 && <section className="party-investigation party-scene" aria-labelledby="party-game-title">
          <div className="party-game-heading"><div><span className="party-eyebrow">LA MISSION EST LANCÉE</span><h1 id="party-game-title">Fouillez. Trouvez. <em>Dansez.</em></h1></div><span className="party-counter" aria-label={`${found.length} indices trouvés sur 3`}><strong>{found.length}</strong> / 3 <small>INDICES</small></span></div>
          <p className="party-game-intro" id="party-room-instructions">Déplacez les objets. ✦ <span className="sr-only">Au clavier : Tab puis Entrée.</span></p>
          <div className="party-game-layout"><PartyRoom found={found} hinted={hinted} inspect={inspect} />
            <aside className="party-casefile" aria-label="Votre carnet d’enquête"><span className="party-casefile-label">CARNET D’ENQUÊTE</span>
              {(['disco', 'record', 'photo'] as ClueId[]).map((id, index) => <div key={id} className={`party-clue${found.includes(id) ? ' is-found' : ''}`}><span className="party-clue-number">{found.includes(id) ? '✓' : `0${index + 1}`}</span><div><small>{['UNE DATE', 'UNE HEURE', 'UN LIEU'][index]}</small><p>{found.includes(id) ? [dateLabel, config.time.replace(':', ' h '), config.address][index] : 'À découvrir…'}</p></div></div>)}
              <div className="party-casefile-bottom" aria-hidden="true"><Star /><span>CURIOSITÉ<br />RECOMMANDÉE</span></div>
            </aside>
          </div>
          <div className={`party-feedback${unlocked ? ' is-complete' : ''}`} role="status" aria-live="polite" aria-atomic="true"><span aria-hidden="true">{unlocked ? '✓' : '↳'}</span>{feedback}</div>
          <div className="party-game-actions"><button className="party-text-button" type="button" onClick={showHint} disabled={unlocked}>Un petit indice ? <span aria-hidden="true">✳</span></button><button className="party-button" type="button" onClick={() => { if (unlocked) advance(); }} disabled={!unlocked}>{unlocked ? 'Assembler les indices' : 'Trouvez les 3 indices'} <Arrow /></button></div>
        </section>}

        {scene === 2 && <section className="party-scene party-puzzle-scene" aria-labelledby="party-workbench-title">
          <span className="party-eyebrow">LE BUREAU DES BELLES SOIRÉES</span>
          <h1 id="party-workbench-title">Les bonnes pièces.<br/><em>Le bon ordre.</em></h1>
          <p className="party-puzzle-description">Recomposez le ticket. ✦</p>
          <ClueWorkbench onSound={sound.play} config={config} slots={slots} code={code} onPlace={nextSlots => { setSlots(nextSlots); tactileFeedback(); }}/>
          <SwipeAdvance ready={cluesAssembled(slots)} onNext={advance}><button type="button" className="party-button party-puzzle-next" disabled={!cluesAssembled(slots)} onClick={advance}>Essayer le code secret <Arrow/></button></SwipeAdvance>
        </section>}

        {scene === 3 && <section className="party-scene party-puzzle-scene" aria-labelledby="party-lock-title">
          <span className="party-eyebrow">PLUS QU’UN PETIT CLIC</span>
          <h1 id="party-lock-title">Entrez le code.<br/><em>Sortez les paillettes.</em></h1>
          <p className="party-puzzle-description">Trois chiffres. Une porte.</p>
          <PartyLock onSound={sound.play} code={code} value={enteredCode} onChange={setEnteredCode} unlocked={codeUnlocked} onUnlock={() => { setCodeUnlocked(true); sound.play('unlock'); tactileFeedback(); }}/>
          {codeUnlocked && <button type="button" className="party-button" onClick={advance}>Ouvrir l’invitation <Arrow/></button>}
        </section>}

        {scene === 4 && <section className="party-reveal party-scene" aria-labelledby="party-reveal-title">
          <div className="party-reveal-aside"><span className="party-eyebrow">MISSION ACCOMPLIE</span><h1 id="party-reveal-title">Vous avez<br />le sens<br /><em>de la fête.</em></h1><p>La piste est à vous.</p><Star className="party-reveal-star" /></div>
<GestureSurface className={`party-ticket-gesture ${ticketBack?'is-back':''}`} axis="x" onCommit={()=>{setTicketBack(v=>!v);sound.play('paper_slide');}}><motion.div key={String(ticketBack)} className="party-ticket-face gesture-object" initial={{rotateY:reduced?0:-85,opacity:reduced?1:.5}} animate={{rotateY:0,opacity:1}} transition={{duration:reduced?0:.4}}><div className="party-invitation-back" aria-hidden={!ticketBack} inert={!ticketBack}><DiscoBall/><span>VOTRE SOIRÉE SECRÈTE</span><strong>{config.name}</strong><span>{dateLabel} · {config.time}</span></div><article className="party-invitation" aria-hidden={ticketBack} inert={ticketBack}><div className="party-invitation-top"><span>UNE INVITATION DE {config.organizer}</span><DiscoBall /></div><span className="party-invitation-overline">GARDEZ VOTRE SOIRÉE POUR</span><h2 id="party-invitation-title">{config.name}</h2><InvitationDetails config={config} /><div className="party-invitation-foot"><span>VOUS + NOUS = LE BON PROGRAMME</span><Star /></div></article></motion.div><button data-gesture-ignore className="party-flip-control" onClick={()=>{setTicketBack(v=>!v);sound.play('paper_slide');}}>{ticketBack?'Voir les informations':'Retourner l’invitation'} ↔</button><GestureHint label="Faites glisser votre invitation"/></GestureSurface>
          <div className="party-reveal-action"><button className="party-button" type="button" onClick={advance}>Passer en mode fête <Arrow /></button></div>
        </section>}

        {scene === 5 && <section className="party-finale party-scene is-party-lit" aria-labelledby="party-finale-title">
          <div className="party-finale-orbit" aria-hidden="true" data-ambient><span>LA PISTE EST À VOUS</span><DiscoBall /><Star /></div>
          <span className="party-eyebrow">FIN DE L’ENQUÊTE. DÉBUT DE LA SOIRÉE.</span><h1 id="party-finale-title">On vous garde<br /><em>une place ?</em></h1><p className="party-finale-message">{config.message}</p>
          <div className="party-finale-summary"><strong>{config.name}</strong><span>{dateLabel} · {config.time.replace(':', ' h ')}</span></div>
          <div className="party-finale-actions">
            {rsvpLinks.email && <a className="party-button" href={rsvpLinks.email}>Confirmer par email <Arrow diagonal /></a>}
            {rsvpLinks.whatsapp && <a className="party-button" href={rsvpLinks.whatsapp} target="_blank" rel="noopener noreferrer">Confirmer sur WhatsApp <Arrow diagonal /></a>}
            {!rsvpLinks.email && !rsvpLinks.whatsapp && <div className="party-rsvp-unavailable"><span className="party-rsvp-label">RSVP · DÉMONSTRATION</span><p>RSVP disponible dans une invitation personnalisée.</p></div>}
            <a className="party-button party-button-outline" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(config.address)}`} target="_blank" rel="noopener noreferrer">Voir l’adresse sur la carte <Arrow diagonal /></a>
          </div>
          <p className="party-rsvp-note">{rsvpLinks.email || rsvpLinks.whatsapp ? 'Votre messagerie s’ouvre : envoyez le message pour répondre. ' : ''}Aucune présence n’est enregistrée sur ce site.</p>
          <button className="party-text-button party-replay" type="button" onClick={replay}><span aria-hidden="true">↺</span> Rejouer la mission</button>
          <div className="party-finale-bottom" aria-hidden="true">LES BONNES PERSONNES. LE BON SON. LA BELLE SOIRÉE.</div>
        </section>}
      </SceneTransition>
    </ExperienceShell>
  </div>;
}
