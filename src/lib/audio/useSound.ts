import { useEffect, useRef, useState } from "react";
import { AudioEngine, type AudioSnapshot } from "./AudioEngine";
import type { AudioTheme, SoundName } from "./sounds";

export function useSound(
  audio?: { src: string; volume?: number },
  theme: AudioTheme = "birthday",
  scene = 0,
) {
  const engine = useRef<AudioEngine | null>(null);
  const [snapshot, setSnapshot] = useState<AudioSnapshot>({
    status: "idle",
    enabled: false,
    volumes: { master: 0.75, music: audio?.volume ?? 0.55, sfx: 0.65 },
  });
  useEffect(() => {
    const current = new AudioEngine(theme, audio);
    engine.current = current;
    const off = current.subscribe(setSnapshot);
    return () => {
      off();
      current.dispose();
      engine.current = null;
    };
  }, [theme, audio?.src, audio?.volume]);
  useEffect(() => {
    engine.current?.setScene(scene);
  }, [scene]);
  return {
    ...snapshot,
    retry: () => engine.current?.retry(),
    start: () => engine.current?.start(),
    toggle: () => engine.current?.toggle(),
    play: (name: SoundName, variation = 0) =>
      engine.current?.play(name, variation),
    duck: (amount?: number, duration?: number) =>
      engine.current?.duck(amount, duration),
    setVolume: (bus: "master" | "music" | "sfx", value: number) =>
      engine.current?.setVolume(bus, value),
  };
}
