import { withBase } from '../../lib/paths';
import { useCallback, useRef, useState, type CSSProperties } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import type { BirthdayConfig } from '../../data/types';
import { ExperienceShell, SceneTransition, ConfettiEffect } from '../../components/shared/ExperienceShell';
import { useSound } from '../../lib/audio/useSound';
import { balloonsUnlocked, candlesReady, getBalloonGoal, getCandleCount, getGiftGoal, giftUnlocked, isLuckyBalloon, collectStar, starsUnlocked } from './scenes/rules';
import './birthday.css';
import './birthday-immersion.css';
import { StarHunt } from './scenes/StarHunt';
import { ConfettiBurst } from '../../components/effects/ConfettiBurst';
import { tactileFeedback } from '../../lib/animation/settings';

const steps = ['La surprise', 'Les ballons', 'Les étoiles', 'Le vœu', 'Le cadeau', 'Pour toi'];
const balloonColors = ['#f59cb0', '#c6b4e6', '#f6d471', '#b7d6c9', '#ffa78a', '#c1b2dd', '#f3b9cc', '#f7d990', '#b8d2d0', '#f2a78f'];
const littleMessages = ['Une étoile pour toi !', 'Un peu de magie.', 'C’est ton jour !', 'À toi les surprises !', 'Encore un sourire.', 'Bien joué !', 'Un joli souvenir.', 'Un grand bonheur.', 'De la douceur.', 'Un dernier souhait.'];

function Sparkle({ className = '', color = 'currentColor' }: { className?: string; color?: string }) {
  return <svg className={className} viewBox="0 0 40 40" fill="none" aria-hidden="true"><path d="M20 2c2 11 7 16 18 18-11 2-16 7-18 18C18 27 13 22 2 20 13 18 18 13 20 2Z" fill={color} /></svg>;
}

function CakeArt({ candleCount = 5, lit = [], blown = false, decorative = false }: { candleCount?: number; lit?: number[]; blown?: boolean; decorative?: boolean }) {
  return <svg className="bq-cake-art" viewBox="0 0 520 410" fill="none" aria-hidden="true">
    <ellipse cx="260" cy="360" rx="183" ry="25" fill="#e7d5c2" opacity=".35" />
    <path d="M68 333c0-17 85-30 191-30s192 13 192 30-86 38-192 38S68 350 68 333Z" fill="#d0bfe8" stroke="#806887" strokeWidth="2.5" />
    <ellipse cx="260" cy="326" rx="181" ry="29" fill="#f0e6f8" stroke="#806887" strokeWidth="2.5" />
    <path d="M105 224v92c0 26 69 45 155 45s155-19 155-45v-92H105Z" fill="#f49eaf" stroke="#9c6170" strokeWidth="2.5" />
    <path d="M106 278c89 37 218 37 308 0v24c-91 37-218 37-308 0v-24Z" fill="#fff1d8" />
    <path d="M105 223v28c0 13 10 24 22 24 13 0 20-9 20-20v-4c0-10 16-9 16 1v21c0 13 9 21 20 21s20-8 20-21v-9c0-10 15-10 15 0v17c0 12 10 21 21 21s20-9 20-21v-12c0-10 15-10 15 0v7c0 13 10 23 22 23s21-10 21-23v-23c0-10 15-10 15 0v6c0 12 9 21 21 21s21-9 21-21v-9c0-10 15-10 15 0 0 13 9 21 21 21s20-10 20-22v-27H105Z" fill="#fff5df" stroke="#9c6170" strokeWidth="2.5" strokeLinejoin="round" />
    <ellipse cx="260" cy="222" rx="155" ry="42" fill="#fff6e5" stroke="#9c6170" strokeWidth="2.5" />
    <ellipse cx="260" cy="219" rx="130" ry="29" fill="#ffeadb" />
    {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((n) => <g key={n} transform={`translate(${146 + n * 28} ${219 + Math.sin(n * 2) * 14}) rotate(${n * 43})`}><rect width="9" height="3" rx="1.5" fill={balloonColors[n]} /></g>)}
    {Array.from({ length: candleCount }, (_, n) => {
      const x = 260 + (n - (candleCount - 1) / 2) * (candleCount > 5 ? 28 : 39);
      const y = 176 + Math.abs(n - (candleCount - 1) / 2) * 3;
      const isLit = decorative || lit.includes(n);
      return <g key={n}>
        <rect x={x - 6} y={y - 42} width="12" height="67" rx="4" fill={n % 2 ? '#b9a5d8' : '#f5b65e'} stroke="#906e77" strokeWidth="2" />
        <path d={`M${x - 5} ${y - 27}l10-7m-10 27 10-7m-10 27 10-7`} stroke="#fff7eb" strokeWidth="4" />
        <path d={`M${x} ${y - 42}v-8`} stroke="#906e77" strokeWidth="2" />
        {isLit && !blown && <g className="bq-flame" data-ambient><path d={`M${x} ${y - 80}c-17 20-15 31 0 31s17-13 0-31Z`} fill="#ffcd61" /><path d={`M${x} ${y - 68}c-8 10-7 16 0 16s8-6 0-16Z`} fill="#fff7c5" /></g>}
        {blown && <path className="bq-smoke" d={`M${x} ${y - 52}c-16-14 16-19 0-34s9-17 0-25`} stroke="#bbadbf" strokeWidth="3" strokeLinecap="round" />}
      </g>;
    })}
    <path d="M237 314c0 6-3 9-7 9s-7-3-7-9m73 0c0 6-3 9-7 9s-7-3-7-9" stroke="#82535c" strokeWidth="4" strokeLinecap="round" />
    <path d="M248 327c5 6 12 6 17 0" stroke="#82535c" strokeWidth="3" strokeLinecap="round" />
    <ellipse cx="212" cy="327" rx="9" ry="4" fill="#ec788f" /><ellipse cx="305" cy="327" rx="9" ry="4" fill="#ec788f" />
    <path d="M101 349c34 20 90 28 159 28s131-10 164-28" stroke="#fff8ee" strokeWidth="4" strokeLinecap="round" />
  </svg>;
}

function GiftArt({ open = false, progress = 0 }: { open?: boolean; progress?: number }) {
  return <svg className={`bq-gift-art ${open ? 'is-open' : ''}`} viewBox="0 0 400 360" fill="none" aria-hidden="true">
    <ellipse cx="202" cy="321" rx="137" ry="20" fill="#dfc8b8" opacity=".35" />
    {open && <g className="bq-gift-sparkles"><path d="m190 96 15 28 31 6-23 23 3 32-26-14-29 13 5-31-23-23 32-5 15-29Z" fill="#ffdc7e" stroke="#d9ab50" strokeWidth="2" /><path d="M104 127v-24m-12 12h24m170 35v-22m-11 11h22" stroke="#c9addd" strokeWidth="5" strokeLinecap="round" /></g>}
    <path d="M91 168h221v131c0 12-9 21-21 21H112c-12 0-21-9-21-21V168Z" fill="#f1a4b4" stroke="#9e697a" strokeWidth="2.5" />
    <path d="M181 174h42v145h-42V174Z" fill="#ffe4a0" stroke="#c99e61" strokeWidth="2" />
    <path d="M113 200h36m-36 12h21m122 72h34" stroke="#fff0e6" strokeWidth="4" strokeLinecap="round" opacity=".8" />
    {[0, 1, 2].map(n => <path key={n} d={`m${123 + n * 70} ${244 - n * 11} 4 7 8 2-6 6 1 8-7-4-7 4 1-8-6-6 8-2 4-7Z`} fill="#fff3d5" />)}
    <g className="bq-gift-lid" style={{ transform: open ? 'translate(34px, -94px) rotate(12deg)' : `rotate(${progress % 2 ? -3 : progress ? 3 : -2}deg)` }}>
      <path d="M81 148h241v43H81z" fill="#f7b5c2" stroke="#9e697a" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M179 148h46v43h-46z" fill="#ffe4a0" stroke="#c99e61" strokeWidth="2" />
      <path d="M200 148c-80-7-91-48-65-62 28-15 65 35 65 62Z" fill="#ffe4a0" stroke="#c99e61" strokeWidth="3" />
      <path d="M201 148c79-6 88-47 63-62-28-15-62 35-63 62Z" fill="#ffe4a0" stroke="#c99e61" strokeWidth="3" />
      <path d="M198 145c-27-33-49-42-53-35m59 35c28-32 46-40 49-34" stroke="#edc573" strokeWidth="5" strokeLinecap="round" />
      <ellipse cx="201" cy="143" rx="16" ry="12" fill="#ffecbb" stroke="#c99e61" strokeWidth="2" />
    </g>
  </svg>;
}

function BalloonArt({ color, number }: { color: string; number: number }) {
  return <svg className="bq-balloon-art" data-ambient viewBox="0 0 100 155" fill="none" aria-hidden="true"><path d="M50 99c-14 18 13 22 0 38s-4 17-4 17" stroke="#aa8e92" strokeWidth="1.7" /><path d="m45 95-5 10h18l-5-10" fill={color} stroke="#997b86" strokeWidth="1.4" /><ellipse cx="50" cy="49" rx="38" ry="47" fill={color} stroke="#997b86" strokeWidth="1.5" /><path d="M27 24c-6 7-9 14-8 22" stroke="#fff7f0" strokeWidth="6" strokeLinecap="round" opacity=".8" /><path d="M41 58v3m18-3v3" stroke="#82535c" strokeWidth="3" strokeLinecap="round" /><path d={number % 2 ? 'M45 68c3 4 7 4 10 0' : 'M46 68c2 3 6 3 8 0'} stroke="#82535c" strokeWidth="2" strokeLinecap="round" /><ellipse cx="32" cy="65" rx="5" ry="2.5" fill="#ec788f" opacity=".6" /><ellipse cx="68" cy="65" rx="5" ry="2.5" fill="#ec788f" opacity=".6" /></svg>;
}

export default function BirthdayExperience({ config }: { config: BirthdayConfig }) {
  const [scene, setScene] = useState(0);
  const [popped, setPopped] = useState<number[]>([]);
  const [lit, setLit] = useState<number[]>([]);
  const [blown, setBlown] = useState(false);
  const [giftTaps, setGiftTaps] = useState(0);
  const [foundStars, setFoundStars] = useState<number[]>([]);
  const [wrongBalloon, setWrongBalloon] = useState<number | null>(null);
  const [balloonFeedback, setBalloonFeedback] = useState('Les petits soleils en forme d’étoile te montrent les bons ballons.');
  const wishes = ['Des rires à n’en plus finir.', 'Des aventures à inventer.', 'Des jours doux, tout simplement.'];
  const hasInteracted = useRef(false);
  const focusHeading = useCallback((heading: HTMLHeadingElement | null) => {
    // Le titre reçoit le focus au montage de la nouvelle scène, après sa transition.
    if (heading && hasInteracted.current) heading.focus({ preventScroll: true });
  }, []);
  const reduced = useReducedMotion();
  const sound = useSound(config.audio);
  const goal = getBalloonGoal(config.interactions.balloonsToPop);
  const candleCount = getCandleCount(config.candleCount);
  const giftGoal = getGiftGoal(config.interactions.giftTaps);
  const balloonsDone = balloonsUnlocked(popped, goal);
  const candlesDone = candlesReady(lit, candleCount);
  const giftDone = giftUnlocked(giftTaps, giftGoal);
  const balloonCount = Math.max(6, goal + 2);

  const next = () => { hasInteracted.current = true; sound.play('chime'); setScene(Math.min(5, scene + 1)); };
  const replay = () => { hasInteracted.current = true; setPopped([]); setLit([]); setBlown(false); setGiftTaps(0); setFoundStars([]); setWrongBalloon(null); setBalloonFeedback('Les étoiles te montrent les bons ballons.'); setScene(0); };
  const pop = (id: number) => {
    if (!isLuckyBalloon(id, goal)) { setWrongBalloon(id); setBalloonFeedback('Celui-ci préfère danser ! Cherche un ballon marqué d’une étoile.'); sound.play('pop'); return; }
    if (popped.includes(id)) return;
    setPopped(previous => previous.includes(id) ? previous : [...previous, id]);
    setBalloonFeedback(littleMessages[id]);
    tactileFeedback();
    sound.play('pop');
  };
  const light = (id: number) => {
    if (lit.includes(id) || blown) return;
    setLit(previous => previous.includes(id) ? previous : [...previous, id]);
    sound.play('chime');
  };
  const unwrap = () => {
    if (giftDone) return;
    setGiftTaps(current => Math.min(giftGoal, current + 1));
    sound.play(giftTaps + 1 >= giftGoal ? 'celebrate' : 'pop');
  };
  const titleProps = { ref: focusHeading, tabIndex: -1 };

  return <div className="birthday-experience" style={{ '--bq-background': config.colors.background, '--bq-accent': config.colors.accent, '--bq-secondary': config.colors.secondary } as CSSProperties}>
    <ExperienceShell theme="birthday" label="La quête d’anniversaire" step={scene} steps={steps} onReplay={replay} onBack={() => setScene(value => Math.max(0, value - 1))} sound={sound.enabled} onToggleSound={sound.toggle}>
      <div className="bq-world">
        <div className="bq-paper-dots" aria-hidden="true" />
        <span className="bq-edge-note" aria-hidden="true">fabriqué avec beaucoup d’amour</span>
        <SceneTransition sceneKey={scene}>
          {scene === 0 && <section className="bq-scene bq-intro" aria-labelledby="bq-title">
            <div className="bq-intro-copy">
              <p className="bq-eyebrow"><span /> Une petite aventure, juste pour toi</p>
              <h1 id="bq-title" {...titleProps}>Aujourd’hui,<br />c’est <span>ton jour,</span><br />{config.firstName}<span className="bq-title-dot">.</span></h1>
              <p className="bq-lead">Il paraît qu’une surprise t’attend…<br />Mais d’abord, un peu de magie.</p>
              <button className="bq-button" onClick={next}>Commencer ma surprise <span aria-hidden="true">↗</span></button>
              <p className="bq-duration">6 petits chapitres · à savourer à ton rythme</p>
              <div className="bq-intro-companion"><svg viewBox="0 0 50 50" fill="none" aria-hidden="true"><path d="m25 3 7 13 15 3-10 11 1 16-13-7-14 7 2-16L3 19l15-3Z" fill="#efce83" stroke="#b78c46"/><path d="M19 24v2m12-2v2m-10 6q4 4 8 0" stroke="#7c5d3d" strokeWidth="2" strokeLinecap="round"/></svg><span>« Je garde ton cadeau. Retrouvons d’abord les trois étoiles du bonheur ! »</span></div>
            </div>
            <div className="bq-intro-illustration">
              <div className="bq-round-backdrop" />
              <span className="bq-birthday-badge">{config.age}<small>bougies de bonheur</small></span>
              <Sparkle className="bq-sparkle bq-sparkle-one" /><Sparkle className="bq-sparkle bq-sparkle-two" /><Sparkle className="bq-sparkle bq-sparkle-three" />
              <div className="bq-floating-cake bq-cake-float" data-ambient><CakeArt candleCount={candleCount} decorative /></div>
              <span className="bq-handwritten" aria-hidden="true">un vœu ?<svg viewBox="0 0 90 50" fill="none" aria-hidden="true"><path d="M4 7c36-11 68 4 69 33m-11-9 11 11 10-11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
              <span className="bq-sticker">100 %<br /><strong>bonne humeur</strong></span>
            </div>
          </section>}

          {scene === 1 && <section className="bq-scene bq-centered" aria-labelledby="bq-title">
            <p className="bq-eyebrow">01 / Une envolée de bonheur</p>
            <h1 id="bq-title" {...titleProps}>Fais éclater <span>la joie.</span></h1>
            <p className="bq-lead">Fais éclater les {goal} ballons marqués d’une étoile. Les autres sont juste là pour danser.</p>
            <div className="bq-balloon-field" aria-label="Les ballons à éclater">
              {Array.from({ length: balloonCount }, (_, id) => <div key={id} className={`bq-balloon-slot bq-slot-${id}`}>
                <AnimatePresence initial={false} mode="wait">
                  {popped.includes(id) ? <motion.div key="popped" className="bq-balloon-reward" initial={reduced ? false : { scale: .3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}><Sparkle /><span>{littleMessages[id]}</span><ConfettiBurst eventKey={1}/></motion.div>
                    : <motion.button key="balloon" className={`bq-balloon ${wrongBalloon === id ? 'is-wrong' : ''}`} style={{ '--float-duration': `${3.4 + id * .35}s`, '--float-delay': `${id * -.4}s` } as CSSProperties} aria-label={id < goal ? `Éclater le ballon ${id + 1}` : `Toucher le ballon dansant ${id + 1}`} onClick={() => pop(id)} onAnimationEnd={() => { if(wrongBalloon === id) setWrongBalloon(null); }} exit={reduced ? { opacity: 0 } : { scale: 1.35, opacity: 0, transition: { duration: .13 } }} whileTap={reduced ? {} : { scale: .86 }}><BalloonArt color={balloonColors[id]} number={id} />{id < goal && <span className="bq-balloon-mark" aria-hidden="true">✧</span>}</motion.button>}
                </AnimatePresence>
              </div>)}
              <span className="bq-field-doodle" aria-hidden="true">pop !</span>
            </div>
            <p className="bq-balloon-feedback" role="status">{balloonFeedback}</p>
            <div className="bq-scene-footer"><p className={`bq-counter ${balloonsDone ? 'is-complete' : ''}`} role="status" aria-live="polite"><span>{Math.min(popped.length, goal)} / {goal}</span> {balloonsDone ? 'C’est une pluie de bonheur !' : 'ballons éclatés'}</p><button className="bq-button" disabled={!balloonsDone} onClick={next}>Chercher les étoiles <span aria-hidden="true">→</span></button></div>
          </section>}

          {scene === 2 && <section className="bq-scene bq-centered bq-stars-scene" aria-labelledby="bq-title">
            <p className="bq-eyebrow">02 / Le jardin des petits bonheurs</p>
            <h1 id="bq-title" {...titleProps}>La magie se <span>cache ici.</span></h1>
            <p className="bq-lead">Explore, soulève, cueille. Trois étoiles attendent dans ce jardin de papier.</p>
            <StarHunt found={foundStars} messages={wishes} onFind={id => { setFoundStars(previous => collectStar(previous,id)); sound.play('chime'); tactileFeedback(); }}/>
            <div className="bq-scene-footer"><p className="bq-counter" role="status"><span>{foundStars.length} / 3</span> étoiles cueillies</p><button className="bq-button" disabled={!starsUnlocked(foundStars)} onClick={next}>Place au gâteau <span aria-hidden="true">→</span></button></div>
          </section>}

          {scene === 3 && <section className="bq-scene bq-centered bq-cake-scene" aria-labelledby="bq-title">
            <p className="bq-eyebrow">03 / Le moment du vœu</p>
            <h1 id="bq-title" {...titleProps}>{blown ? <>Que ton vœu <span>se réalise.</span></> : <>Un gâteau. <span>Un vœu.</span></>}</h1>
            <p className="bq-lead">{blown ? 'On croise les doigts, très très fort.' : candlesDone ? 'Ferme les yeux, fais un vœu… puis souffle !' : 'Allume chaque bougie pour préparer ton vœu.'}</p>
            <div className="bq-cake-stage"><CakeArt candleCount={candleCount} lit={lit} blown={blown} /><Sparkle className="bq-cake-star" /><span className="bq-cake-age" aria-hidden="true">{config.age}<small>ans de magie</small></span></div>
            {!blown && <div className="bq-candle-controls" aria-label="Allumer les bougies">{Array.from({ length: candleCount }, (_, id) => <button key={id} className={`bq-candle-control ${lit.includes(id) ? 'is-lit' : ''}`} onClick={() => light(id)} aria-label={`Allumer la bougie ${id + 1}`} aria-pressed={lit.includes(id)} disabled={lit.includes(id)}><svg viewBox="0 0 24 30" fill="none" aria-hidden="true"><path d="M8 15h8v14H8z" fill={id % 2 ? '#baa3d6' : '#f5b65e'} /><path d="M12 0c-8 9-7 14 0 14s8-5 0-14Z" fill={lit.includes(id) ? '#ffbb47' : '#ded2c5'} /></svg><span>{id + 1}</span></button>)}</div>}
            <p className="bq-candle-status" role="status" aria-live="polite">{blown ? 'Toutes les bougies sont soufflées. Ton vœu est bien gardé.' : `${lit.length} sur ${candleCount} bougies allumées`}</p>
            {blown ? <button className="bq-button" onClick={next}>Et maintenant, ton cadeau <span aria-hidden="true">→</span></button> : <button className="bq-button" disabled={!candlesDone} onClick={() => { setBlown(true); sound.play('celebrate'); }}>Souffler mes bougies <span aria-hidden="true">↝</span></button>}
            <ConfettiEffect active={blown} />
          </section>}

          {scene === 4 && <section className={`bq-scene bq-centered bq-gift-scene ${giftDone ? 'bq-gift-opened' : ''}`} aria-labelledby="bq-title">
            <p className="bq-eyebrow">04 / La surprise dans la surprise</p>
            <h1 id="bq-title" {...titleProps}>{giftDone ? <>Ça, c’est <span>pour toi.</span></> : <>Quelque chose <span>t’attend.</span></>}</h1>
            <p className="bq-lead">{giftDone ? 'Un cadeau à vivre, des souvenirs à inventer.' : `Tapote le cadeau ${giftGoal} fois pour dénouer le ruban.`}</p>
            <div className="bq-gift-stage">
              {giftDone ? <div className="bq-gift-revealed-art"><GiftArt open /></div> : <motion.button className="bq-gift-button" aria-label={`Ouvrir le cadeau, ${giftTaps} sur ${giftGoal} tapotements`} onClick={unwrap} whileTap={reduced ? {} : { scale: .95, rotate: giftTaps % 2 ? -4 : 4 }}><GiftArt progress={giftTaps} /></motion.button>}
              {!giftDone && <span className="bq-gift-hint" aria-hidden="true">psst… c’est à toi !</span>}
            </div>
            <p className="bq-gift-status" role="status" aria-live="polite">{giftDone ? 'Surprise ! Ton cadeau est ouvert.' : giftTaps ? `Encore ${giftGoal - giftTaps} ${giftGoal - giftTaps > 1 ? 'petits tapotements' : 'petit tapotement'}…` : 'Le plus joli moment, c’est de l’ouvrir.'}</p>
            {!giftDone && <div className="bq-tap-progress" role="progressbar" aria-label="Ouverture du cadeau" aria-valuemin={0} aria-valuemax={giftGoal} aria-valuenow={giftTaps} aria-valuetext={`${giftTaps} sur ${giftGoal} tapotements`}>{Array.from({ length: giftGoal }, (_, id) => <span key={id} className={id < giftTaps ? 'is-done' : ''} />)}</div>}
            {giftDone && <motion.div className="bq-gift-message" initial={reduced ? false : { y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }}><span className="bq-gift-label">Le bon pour un grand sourire</span><h2>{config.gift.title}</h2><p>{config.gift.description}</p></motion.div>}

            {giftDone && <button className="bq-button" onClick={next}>Il reste un petit mot <span aria-hidden="true">→</span></button>}
            <ConfettiEffect active={giftDone} />
          </section>}

          {scene === 5 && <section className="bq-scene bq-final bq-centered" aria-labelledby="bq-title">
            <div className="bq-final-flower" aria-hidden="true"><svg viewBox="0 0 120 120" fill="none"><path d="M60 27C39-4 15 26 32 43 0 47 6 82 34 81c-12 30 24 44 36 17 20 25 47 0 28-20 32-9 20-42-7-36C92 11 60 7 60 27Z" fill="#f6b3c3" stroke="#c98295" strokeWidth="2" /><circle cx="61" cy="61" r="22" fill="#ffdd83" /><path d="M53 59v3m16-3v3m-13 7c3 3 7 3 10 0" stroke="#936a62" strokeWidth="2.5" strokeLinecap="round" /></svg></div>
            <p className="bq-eyebrow">05 / Le bonheur te va si bien</p>
            <h1 id="bq-title" {...titleProps}>Joyeux<br /><span>anniversaire,</span><br />{config.firstName}<span className="bq-title-dot"> !</span></h1>
            <div className="bq-final-message"><Sparkle /><p>{config.message}</p></div>
            <div className="bq-adventure-gallery"><h2>Ton petit carnet de magie.</h2><div className="memory-gallery" aria-label="Les souvenirs de cette aventure">
              {config.photos.length ? config.photos.map((photo, index) => <figure key={photo.src} style={{ animationDelay: `${index * .08}s` }}><img src={withBase(photo.src)} alt={photo.alt} width="320" height="240" loading="lazy"/>{photo.caption && <figcaption>{photo.caption}</figcaption>}</figure>) : wishes.map((wish, index) => <figure key={wish} style={{ animationDelay: `${index * .08}s` }}><div className="bq-journal-art" aria-hidden="true"><Sparkle color={['#c97882','#c5a0c8','#b7b67b'][index]}/></div><figcaption>{wish}</figcaption></figure>)}
            </div></div>
            <button className="bq-button" onClick={replay}>Revivre la surprise <span aria-hidden="true">↺</span></button>
            <p className="bq-duration">Les petits bonheurs, ça se rejoue à l’infini.</p>
            <ConfettiEffect active />
          </section>}
        </SceneTransition>
        <div className="bq-bottom-flower" aria-hidden="true"><Sparkle /><span>une journée à croquer</span></div>
      </div>
    </ExperienceShell>
  </div>;
}
