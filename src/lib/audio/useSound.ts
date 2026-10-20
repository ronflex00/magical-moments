import { useCallback, useEffect, useRef, useState } from 'react';

/** Petits sons synthétisés localement ; jamais d'audio automatique ni de fichier distant. */
export function useSound(audio?: { src: string; volume?: number }) {
  const [enabled, setEnabled] = useState(false);
  const context = useRef<AudioContext | null>(null);
  const music = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    if (!audio?.src) return;
    const player = new Audio(audio.src);
    player.preload = 'none';
    player.loop = true;
    player.volume = Math.max(0, Math.min(1, audio.volume ?? 0.25));
    music.current = player;
    return () => { player.pause(); player.removeAttribute('src'); player.load(); music.current = null; };
  }, [audio?.src, audio?.volume]);
  useEffect(() => () => { void context.current?.close(); }, []);
  const toggle = useCallback(() => {
    if (!context.current && typeof AudioContext !== 'undefined') context.current = new AudioContext();
    void context.current?.resume();
    if (enabled) music.current?.pause();
    else void music.current?.play().catch(() => { /* Les sons synthétiques restent disponibles si le média manque. */ });
    setEnabled(value => !value);
  }, [enabled]);
  const play = useCallback((kind: 'pop' | 'chime' | 'celebrate' = 'chime') => {
    if (!enabled || !context.current) return;
    const ctx = context.current;
    const notes = kind === 'celebrate' ? [523.25, 659.25, 783.99, 1046.5] : kind === 'pop' ? [370, 180] : [660, 880];
    notes.forEach((frequency, index) => {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = ctx.currentTime + index * 0.075;
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.09, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.23);
      oscillator.connect(gain); gain.connect(ctx.destination);
      oscillator.start(start); oscillator.stop(start + 0.25);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    });
  }, [enabled]);
  return { enabled, toggle, play };
}
