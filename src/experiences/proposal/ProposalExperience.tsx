import { useEffect, useId, useReducer, useRef, type CSSProperties, type ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import type { ProposalConfig } from '../../data/types';
import { ExperienceShell, SceneTransition, ConfettiEffect } from '../../components/shared/ExperienceShell';
import { useSound } from '../../lib/audio/useSound';
import { initialProposalState, proposalReducer } from './scenes/proposal-state';
import './proposal.css';

const steps = ['Le début', 'Nos souvenirs', 'La lettre', 'La question', 'Notre moment'];
const stars = Array.from({ length: 38 }, (_, i) => ({
  x: (i * 37 + 9) % 100, y: (i * 23 + 7) % 91,
  size: i % 5 === 0 ? 3 : 1.5, delay: `${(i % 7) * -.8}s`,
}));

function Star({ className = '' }: { className?: string }) {
  return <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden="true"><path d="m24 2 5.3 16.7L46 24l-16.7 5.3L24 46l-5.3-16.7L2 24l16.7-5.3L24 2Z" fill="currentColor"/><path d="M24 12v24M12 24h24" stroke="white" strokeOpacity=".6" strokeWidth=".6"/></svg>;
}

function Arrow() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 12h15m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}

function SceneTitle({ children, eyebrow }: { children: ReactNode; eyebrow: string }) {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => { ref.current?.focus({ preventScroll: true }); }, []);
  return <><p className="proposal-eyebrow">{eyebrow}</p><h1 ref={ref} tabIndex={-1} className="proposal-title" aria-live="polite">{children}</h1></>;
}

function CelestialArt() {
  const id = useId();
  return <svg className="proposal-celestial" viewBox="0 0 520 460" fill="none" aria-hidden="true">
    <defs><radialGradient id={id}><stop stopColor="#e9ce9c" stopOpacity=".2"/><stop offset="1" stopColor="#e9ce9c" stopOpacity="0"/></radialGradient></defs>
    <circle cx="260" cy="224" r="211" fill={`url(#${id})`}/>
    <ellipse cx="260" cy="230" rx="193" ry="137" stroke="currentColor" strokeOpacity=".16" transform="rotate(-29 260 230)"/>
    <ellipse cx="260" cy="230" rx="173" ry="116" stroke="currentColor" strokeOpacity=".13" transform="rotate(34 260 230)"/>
    <circle cx="260" cy="220" r="133" stroke="currentColor" strokeOpacity=".25" strokeDasharray="1 9"/>
    <path d="M294 89c-48 9-85 52-85 103 0 58 47 105 105 105 20 0 39-6 55-15-25 43-77 64-126 49-63-19-99-85-80-148 18-60 76-97 131-94Z" fill="currentColor" fillOpacity=".09" stroke="currentColor" strokeOpacity=".7"/>
    <path d="m117 275 91 39 69-125 101 52 42-95" stroke="currentColor" strokeOpacity=".4" strokeWidth=".8"/>
    {[[117,275],[208,314],[277,189],[378,241],[420,146]].map(([x,y],i) => <g key={i} transform={`translate(${x} ${y})`}><circle r="8" fill="currentColor" fillOpacity=".08"/><circle r="2.5" fill="currentColor"/></g>)}
    <path d="m324 119 3.5 12.5L340 135l-12.5 3.5L324 151l-3.5-12.5L308 135l12.5-3.5 3.5-12.5Zm-160 69 2.3 8.7 8.7 2.3-8.7 2.3-2.3 8.7-2.3-8.7-8.7-2.3 8.7-2.3 2.3-8.7Z" fill="currentColor"/>
    <circle cx="103" cy="182" r="3" stroke="currentColor" strokeOpacity=".8"/><circle cx="349" cy="355" r="2" fill="currentColor"/>
    <text x="260" y="409" textAnchor="middle" fill="currentColor" fontSize="9" letterSpacing="5" fontFamily="sans-serif" opacity=".6">NOTRE CONSTELLATION</text>
  </svg>;
}

function RingBox({ open, reduced }: { open: boolean; reduced: boolean | null }) {
  const id = useId();
  return <svg className="proposal-ring-art" viewBox="0 0 420 340" fill="none" aria-hidden="true">
    <defs>
      <linearGradient id={`${id}-gold`} x1="180" y1="100" x2="250" y2="185" gradientUnits="userSpaceOnUse"><stop stopColor="#fff1d6"/><stop offset=".48" stopColor="#c99e5c"/><stop offset="1" stopColor="#fae1b3"/></linearGradient>
      <linearGradient id={`${id}-box`} x1="120" y1="170" x2="300" y2="310" gradientUnits="userSpaceOnUse"><stop stopColor="#576576"/><stop offset="1" stopColor="#1d293b"/></linearGradient>
      <radialGradient id={`${id}-glow`}><stop stopColor="#e9ce9c" stopOpacity=".3"/><stop offset="1" stopColor="#e9ce9c" stopOpacity="0"/></radialGradient>
    </defs>
    <motion.circle cx="210" cy="150" r="145" fill={`url(#${id}-glow)`} animate={{ opacity: open ? 1 : .2, scale: open ? 1.05 : .8 }} transition={{ duration: reduced ? 0 : 1 }}/>
    <ellipse cx="210" cy="301" rx="122" ry="13" fill="#050b14" fillOpacity=".3"/>
    <path d="m104 213 106-34 106 34v62c-60 30-152 30-212 0v-62Z" fill={`url(#${id}-box)`} stroke="#a6a5a4" strokeOpacity=".5"/>
    <ellipse cx="210" cy="215" rx="105" ry="38" fill="#273748" stroke="#99a0a4" strokeOpacity=".5"/>
    <ellipse cx="210" cy="215" rx="89" ry="28" fill="#172333"/>
    <path d="M159 218c32-7 70-7 102 0" stroke="#0d1725" strokeWidth="7" strokeLinecap="round"/>
    <motion.g animate={{ opacity: open ? 1 : 0, y: open ? 0 : 54 }} transition={{ duration: reduced ? 0 : .85, delay: reduced ? 0 : .18 }}>
      <ellipse cx="210" cy="177" rx="26" ry="35" stroke={`url(#${id}-gold)`} strokeWidth="6"/>
      <path d="m193 134 8-12h18l8 12-17 17-17-17Z" fill="#ebf3ee" stroke="#fff3d8" strokeWidth="1.3"/>
      <path d="m193 134 17 1 17-1m-26-12 9 13 9-13m-9 13v16" stroke="#95a8b4" strokeWidth="1"/>
      <path d="m179 105 2.3 8.7 8.7 2.3-8.7 2.3-2.3 8.7-2.3-8.7-8.7-2.3 8.7-2.3 2.3-8.7Zm64 28 1.6 6.4 6.4 1.6-6.4 1.6-1.6 6.4-1.6-6.4-6.4-1.6 6.4-1.6 1.6-6.4Z" fill="#fff0ce"/>
    </motion.g>
    <motion.g style={{ transformOrigin: '210px 193px' }} animate={{ y: open ? -79 : 0, rotateX: open ? 35 : 0, scaleY: open ? .79 : 1 }} transition={{ duration: reduced ? 0 : .95, ease: [.22, 1, .36, 1] }}>
      <path d="m104 174 106-35 106 35v39c-61 28-151 28-212 0v-39Z" fill={`url(#${id}-box)`} stroke="#a6a5a4" strokeOpacity=".7"/>
      <ellipse cx="210" cy="174" rx="106" ry="38" fill="#3c4c60" stroke="#a6a5a4" strokeOpacity=".6"/>
      <ellipse cx="210" cy="174" rx="92" ry="28" stroke="#d1b689" strokeOpacity=".7"/>
      <path d="m210 158 3 11 11 3-11 3-3 11-3-11-11-3 11-3 3-11Z" fill="#dfc292"/>
    </motion.g>
    <path d="M203 262h14v9h-14z" fill="#d4b782"/>
  </svg>;
}

export default function ProposalExperience({ config }: { config: ProposalConfig }) {
  const [state, dispatch] = useReducer(proposalReducer, initialProposalState);
  const reduced = useReducedMotion();
  const { enabled, toggle, play } = useSound(config.audio);
  const selected = state.selectedMemory === null ? null : config.memories[state.selectedMemory];
  const replay = () => dispatch({ type: 'replay' });
  const next = () => { play('chime'); dispatch({ type: 'next' }); };
  const style = {
    '--proposal-bg': config.colors.background,
    '--proposal-gold': config.colors.accent,
    '--proposal-rose': config.colors.secondary,
  } as CSSProperties;

  return <div className="proposal-experience" style={style}>
    <div className="proposal-sky" aria-hidden="true">{stars.map((star, i) => <i key={i} style={{ left: `${star.x}%`, top: `${star.y}%`, width: star.size, height: star.size, animationDelay: star.delay }}/>)}</div>
    <ExperienceShell theme="proposal" label="La grande question" step={state.step} steps={steps} onReplay={replay} sound={enabled} onToggleSound={toggle}>
      <SceneTransition sceneKey={state.step}>
        {state.step === 0 && <section className="proposal-scene proposal-intro" aria-label="Le début de notre histoire">
          <div className="proposal-intro-copy">
            <SceneTitle eyebrow="Une surprise, juste pour toi">Il était<br/><em>nous.</em></SceneTitle>
            <p className="proposal-dedication">Pour toi, {config.firstName}.</p>
            <p className="proposal-description">{config.welcome}</p>
            <button type="button" className="proposal-button" onClick={next}>Commencer notre histoire <Arrow/></button>
            <p className="proposal-small-note">Quelques étoiles. Quelques souvenirs. Et nous.</p>
          </div>
          <div className="proposal-art-wrap"><CelestialArt/><span className="proposal-art-caption">{config.firstName} <span>&</span> {config.partnerName}</span></div>
        </section>}

        {state.step === 1 && <section className="proposal-scene proposal-memories" aria-label="Nos souvenirs">
          <div className="proposal-scene-heading"><SceneTitle eyebrow="Chapitre I · Les petits infinis">Chaque étoile,<br/><em>un peu de nous.</em></SceneTitle><p className="proposal-description">Touche les trois étoiles pour retrouver nos souvenirs.</p></div>
          <div className="proposal-memory-layout">
            <div className="proposal-constellation">
              <svg viewBox="0 0 420 300" preserveAspectRatio="none" className="proposal-constellation-lines" aria-hidden="true"><path d="m88 88 235 63-143 106L88 88Z" stroke="currentColor" strokeWidth="1" strokeDasharray="3 8" fill="none" opacity=".3"/><circle cx="210" cy="155" r="125" stroke="currentColor" strokeWidth=".7" strokeDasharray="1 10" fill="none" opacity=".25"/></svg>
              {config.memories.map((memory, index) => <button type="button" key={memory.title} className={`proposal-memory-star proposal-memory-star-${index} ${state.memories.includes(index) ? 'is-discovered' : ''} ${state.selectedMemory === index ? 'is-selected' : ''}`} aria-label={`Découvrir le souvenir ${index + 1} : ${memory.title}`} aria-pressed={state.selectedMemory === index} onClick={() => { if (!state.memories.includes(index)) play('chime'); dispatch({ type: 'memory', index }); }}><Star/><span>0{index + 1}</span>{state.memories.includes(index) && <span className="proposal-star-check" aria-label="Souvenir découvert">✓</span>}</button>)}
              <p className="proposal-memory-count" role="status">{state.memories.length} / 3 souvenirs retrouvés</p>
            </div>
            <div className="proposal-memory-panel" aria-live="polite" aria-atomic="true">
              <AnimatePresence mode="wait" initial={false}>
                {selected ? <motion.div key={state.selectedMemory} initial={{ opacity: 0, y: reduced ? 0 : 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : .25 }}>
                  <span className="proposal-memory-number">SOUVENIR 0{(state.selectedMemory ?? 0) + 1}</span>
                  {selected.photo && <img className="proposal-memory-photo" src={selected.photo.src} alt={selected.photo.alt} width="480" height="300" loading="lazy"/>}
                  <h2>{selected.title}</h2><p>{selected.message}</p>
                </motion.div> : <div className="proposal-memory-empty"><Star/><p>Les plus belles histoires sont faites de petits moments.</p><span>Choisis une étoile dans notre ciel.</span></div>}
              </AnimatePresence>
            </div>
          </div>
          <button type="button" className="proposal-button" onClick={next} disabled={state.memories.length < 3}>{state.memories.length < 3 ? 'Retrouve nos trois souvenirs' : 'La suite de notre histoire'} <Arrow/></button>
        </section>}

        {state.step === 2 && <section className="proposal-scene proposal-letter-scene" aria-label="La lettre secrète">
          <SceneTitle eyebrow="Chapitre II · Les mots du cœur">Il fallait que<br/><em>je te le dise.</em></SceneTitle>
          {!state.letterOpen ? <>
            <button type="button" className="proposal-envelope-button" onClick={() => { play('pop'); dispatch({ type: 'letter' }); }} aria-label="Ouvrir la lettre de votre histoire">
              <svg viewBox="0 0 420 290" fill="none" aria-hidden="true"><path d="m48 83 162-53 162 53v159H48V83Z" fill="#dac7a9"/><path d="M61 88h298v145H61z" fill="#fbf0da"/><path d="m48 83 162 109L372 83v159H48V83Z" fill="#e8d7ba"/><path d="m48 242 139-104c14-11 32-11 46 0l139 104H48Z" fill="#f2e4cc"/><path d="m48 83 162 109L372 83" stroke="#b7996b" strokeOpacity=".5"/><circle cx="210" cy="170" r="25" fill="#aa756c"/><circle cx="210" cy="170" r="20" stroke="#d6a59a"/><path d="m210 156 3 11 11 3-11 3-3 11-3-11-11-3 11-3 3-11Z" fill="#efc6b7"/></svg>
              <span>Briser le sceau <Arrow/></span>
            </button>
            <p className="proposal-description">Quelques mots que je gardais pour toi.</p>
          </> : <>
            <motion.article className="proposal-letter" initial={{ opacity: 0, y: reduced ? 0 : 20, rotate: reduced ? 0 : -2 }} animate={{ opacity: 1, y: 0, rotate: 0 }} transition={{ duration: reduced ? 0 : .65 }} aria-label="Votre lettre">
              <Star/>{config.letter.split('\n\n').map((paragraph, i) => <p key={i}>{paragraph}</p>)}<p className="proposal-letter-signature">Avec tout mon amour,<br/><em>{config.partnerName}</em></p>
            </motion.article>
            <button type="button" className="proposal-button" onClick={next}>Il reste une petite chose <Arrow/></button>
          </>}
        </section>}

        {state.step === 3 && <section className="proposal-scene proposal-ring-scene" aria-label="La grande question">
          <SceneTitle eyebrow="Chapitre III · Tous nos demains">{state.ringOpen ? <>{config.firstName},<br/><em>{config.question}</em></> : <>Et si l’on écrivait<br/><em>la suite ensemble ?</em></>}</SceneTitle>
          <button type="button" className={`proposal-ring-button ${state.ringOpen ? 'is-open' : ''}`} onClick={() => { if (!state.ringOpen) { play('chime'); dispatch({ type: 'ring' }); } }} disabled={state.ringOpen} aria-label={state.ringOpen ? 'La bague est dévoilée' : 'Ouvrir la boîte à bague'}><RingBox open={state.ringOpen} reduced={reduced}/></button>
          {state.ringOpen ? <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: reduced ? 0 : .6 }} className="proposal-ring-reveal"><p className="proposal-description">De tous les possibles, mon préféré, c’est nous.</p><button type="button" className="proposal-button" onClick={next}>Vivre ce moment <Arrow/></button></motion.div> : <><button type="button" className="proposal-text-button" onClick={() => { play('chime'); dispatch({ type: 'ring' }); }}>Ouvrir cette petite boîte <Arrow/></button><p className="proposal-small-note">Une grande question se cache à l’intérieur.</p></>}
        </section>}

        {state.step === 4 && <section className="proposal-scene proposal-final" aria-label="Notre moment">
          <ConfettiEffect active={state.answer === 'yes'}/>
          <div className="proposal-final-symbol" aria-hidden="true"><svg viewBox="0 0 140 110" fill="none"><circle cx="49" cy="62" r="30" stroke="currentColor" strokeWidth="2"/><circle cx="91" cy="62" r="30" stroke="currentColor" strokeWidth="2"/><path d="m70 5 2.5 9.5L82 17l-9.5 2.5L70 29l-2.5-9.5L58 17l9.5-2.5L70 5Z" fill="currentColor"/></svg></div>
          <SceneTitle eyebrow={state.answer === 'yes' ? 'Un nouveau chapitre commence' : 'Ce moment nous appartient'}>{state.answer === 'yes' ? <>À nous.<br/><em>À la vie.</em></> : state.answer === 'time' ? <>Tout le temps<br/><em>qu’il te faut.</em></> : state.answer === 'no' ? <>Merci pour<br/><em>ta sincérité.</em></> : <>Une question.<br/><em>Ton cœur.</em></>}</SceneTitle>
          <div className="proposal-final-message" aria-live="polite">
            <p className="proposal-description">{state.answer === 'yes' ? config.finalMessage : state.answer === 'time' ? 'Rien ne presse. Les plus beaux mots sont ceux que l’on choisit librement. Prenons le temps d’en parler, ensemble.' : state.answer === 'no' ? 'Ta réponse est entendue et respectée. Merci d’avoir partagé cette histoire. Laissons la conversation continuer, à notre rythme.' : 'Tu peux répondre ici, prendre un peu de temps, ou simplement me regarder. Ce moment est à toi aussi.'}</p>
          </div>
          {state.answer === null ? <div className="proposal-answer-options"><button type="button" className="proposal-button" onClick={() => { play('celebrate'); dispatch({ type: 'answer', answer: 'yes' }); }}>Oui, mille fois oui <Star/></button><button type="button" className="proposal-secondary-button" onClick={() => dispatch({ type: 'answer', answer: 'time' })}>J’ai besoin de temps</button><button type="button" className="proposal-text-button" onClick={() => dispatch({ type: 'answer', answer: 'no' })}>Non, je ne le souhaite pas</button></div> : <div className="proposal-final-actions"><button type="button" className="proposal-button" onClick={replay}>Revivre notre histoire <Arrow/></button><button type="button" className="proposal-text-button" onClick={() => dispatch({ type: 'answer', answer: null })}>Revenir aux réponses</button></div>}
          <p className="proposal-small-note">Ce choix reste dans l’instant. Aucune réponse n’est enregistrée ni envoyée.</p>
          {state.answer === 'yes' && config.photos.length > 0 && <div className="proposal-photo-strip">{config.photos.map((photo) => <figure key={photo.src}><img src={photo.src} alt={photo.alt} width="320" height="320" loading="lazy"/>{photo.caption && <figcaption>{photo.caption}</figcaption>}</figure>)}</div>}
        </section>}
      </SceneTransition>
      <div className="proposal-bottom-mark" aria-hidden="true"><span/>UNE HISTOIRE À DEUX<span/></div>
    </ExperienceShell>
  </div>;
}
