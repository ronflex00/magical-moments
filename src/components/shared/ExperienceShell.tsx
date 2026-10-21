import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion, MotionConfig, useReducedMotion, useIsPresent } from 'motion/react';
import { siteConfig } from '../../site-config';
import { applyMotionQuality, motionSettings, observeMotionScope } from '../../lib/animation/settings';
import './experience-shell.css';

interface ShellProps {
  theme: 'birthday' | 'proposal' | 'party';
  label: string;
  step: number;
  steps: string[];
  onReplay: () => void;
  sound: boolean;
  onToggleSound: () => void;
  onBack?: () => void;
  children: ReactNode;
}
export function ExperienceShell({ theme, label, step, steps, onReplay, sound, onToggleSound, onBack, children }: ShellProps) {
  const [shareStatus, setShareStatus] = useState('');
  const [paused, setPaused] = useState(false);
  const scope = useRef<HTMLDivElement>(null);
  useEffect(() => { applyMotionQuality(); return scope.current ? observeMotionScope(scope.current) : undefined; }, []);
  async function share() {
    try {
      if (navigator.share) await navigator.share({ title: label, url: location.href });
      else { await navigator.clipboard.writeText(location.href); setShareStatus('Lien copié !'); }
    } catch (error) { if ((error as Error).name !== 'AbortError') setShareStatus('Copiez le lien dans votre barre d’adresse.'); }
  }
  return <MotionConfig reducedMotion="user">
    <div ref={scope} className={`experience-shell theme-${theme} ${paused ? 'is-motion-paused' : ''}`}>
      <header className="experience-topbar">
        <a href="/" className="experience-home" aria-label={`Retour à ${siteConfig.name}`}><span aria-hidden="true">✳</span> {siteConfig.name}</a>
        <div className="experience-tools">
          {onBack && <button type="button" className="experience-back" onClick={onBack} disabled={step === 0} aria-label="Étape précédente">←</button>}
          <button type="button" className="ambient-toggle" aria-label={paused ? 'Reprendre les animations' : 'Mettre les animations en pause'} aria-pressed={paused} onClick={() => setPaused(value => !value)}><span aria-hidden="true">{paused ? '▷' : 'Ⅱ'}</span><span>Animations</span></button>
          <button type="button" aria-pressed={sound} onClick={onToggleSound} aria-label={sound ? 'Désactiver le son' : 'Activer le son'}><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5Z"/>{sound ? <><path d="M15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14"/></> : <path d="m16 9 6 6m0-6-6 6"/>}</svg><span>Son {sound ? 'activé' : 'coupé'}</span></button>
          <button type="button" onClick={onReplay} aria-label="Recommencer l’expérience"><span aria-hidden="true">↺</span><span>Recommencer</span></button>
        </div>
      </header>
      <div className="experience-progress" aria-label={`Étape ${step + 1} sur ${steps.length} : ${steps[step]}`}>
        <span className="experience-label">{label}</span>
        <ol>{steps.map((name, index) => <li key={name} className={index <= step ? 'is-reached' : ''} aria-current={index === step ? 'step' : undefined}><span className="progress-dot"/><span className="progress-name">{name}</span></li>)}</ol>
        <span className="experience-count">{String(step + 1).padStart(2, '0')} / {String(steps.length).padStart(2, '0')}</span>
      </div>
      <div className="experience-content" aria-label={steps[step]}>{children}</div>
      <footer className="experience-footer"><a href="/#experiences">← Toutes les expériences</a><button type="button" onClick={share}>Partager cette surprise ↗</button><span role="status">{shareStatus}</span></footer>
    </div>
  </MotionConfig>;
}
export function SceneTransition({ sceneKey, children }: { sceneKey: string | number; children: ReactNode }) {
  return <AnimatePresence mode="wait" initial={false}><SceneFrame key={sceneKey}>{children}</SceneFrame></AnimatePresence>;
}
function SceneFrame({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();
  const present = useIsPresent();
  const scope = useRef<HTMLDivElement | null>(null);
  useEffect(() => scope.current ? observeMotionScope(scope.current) : undefined, []);
  const focusScene = useCallback((node: HTMLDivElement | null) => {
    scope.current = node;
    if (!node) return;
    // Une scène longue peut laisser le navigateur en bas de page au chapitre suivant.
    if (node.getBoundingClientRect().top < 0) window.scrollTo({ top: 0, behavior: 'instant' });
    const title = node.querySelector<HTMLHeadingElement>('h1');
    if (title) { title.tabIndex = -1; title.focus({ preventScroll: true }); }
  }, []);
  return <motion.div ref={focusScene} className="scene-transition" inert={!present} aria-hidden={!present || undefined} initial={{ opacity: 0, y: reduce ? 0 : 20, rotateX: reduce ? 0 : 2 }} animate={{ opacity: 1, y: 0, rotateX: 0 }} exit={{ opacity: 0, y: reduce ? 0 : -12 }} transition={{ duration: reduce ? 0 : motionSettings.scene, ease: motionSettings.ease }}>{children}</motion.div>;
}
export function ConfettiEffect({ active }: { active: boolean }) {
  const reduce = useReducedMotion();
  if (!active || reduce) return null;
  return <div className="confetti-effect" aria-hidden="true">{Array.from({ length: 38 }, (_, i) => <i key={i} style={{ left: `${(i * 37) % 100}%`, backgroundColor: ['#ed755c', '#f4d76b', '#dc9fbb', '#92bda5', '#ada0d5'][i % 5], animationDelay: `${(i % 8) * 0.1}s`, transform: `rotate(${i * 31}deg)` }} />)}</div>;
}
