import { withBase } from "../paths";
import {
  contextualSound,
  musicTracks,
  soundShape,
  type AudioTheme,
  type SoundName,
} from "./sounds";
export type AudioStatus =
  | "idle"
  | "loading"
  | "playing"
  | "muted"
  | "paused"
  | "blocked"
  | "effects-only";
export type AudioVolumes = { master: number; music: number; sfx: number };
export type AudioSnapshot = {
  status: AudioStatus;
  enabled: boolean;
  volumes: AudioVolumes;
};
const muteKey = "magical-moments:muted";
const clamp = (n: number) =>
  Math.max(0, Math.min(1, Number.isFinite(n) ? n : 0));

/** One context and loop per experience, finite contextual voices, no unsolicited audio. */
export class AudioEngine {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private duckGain: GainNode | null = null;
  private tone: BiquadFilterNode | null = null;
  private music: AudioBufferSourceNode | null = null;
  private buffer: AudioBuffer | null = null;
  private loading: Promise<void> | null = null;
  private loadFinished = false;
  private abort = new AbortController();
  private listeners = new Set<(value: AudioSnapshot) => void>();
  private voices = new Set<{ stop: () => void }>();
  private lastPlay = new Map<string, number>();
  private pauseTimer: ReturnType<typeof setTimeout> | null = null;
  private disposed = false;
  private requested = false;
  private muted = false;
  private scene = 0;
  private status: AudioStatus = "idle";
  private volumes: AudioVolumes;
  constructor(
    private theme: AudioTheme,
    private audio?: { src: string; volume?: number },
  ) {
    this.volumes = {
      master: 0.75,
      music: clamp(audio?.volume ?? 0.55),
      sfx: 0.65,
    };
    try {
      this.muted = localStorage.getItem(muteKey) === "true";
    } catch {}
    if (this.muted) this.status = "muted";
    document.addEventListener("visibilitychange", this.visibility);
  }
  snapshot(): AudioSnapshot {
    return {
      status: this.status,
      enabled: this.status === "playing" || this.status === "effects-only",
      volumes: { ...this.volumes },
    };
  }
  subscribe(listener: (value: AudioSnapshot) => void) {
    this.listeners.add(listener);
    listener(this.snapshot());
    return () => {
      this.listeners.delete(listener);
    };
  }
  private notify(status = this.status) {
    if (this.disposed) return;
    this.status = status;
    const value = this.snapshot();
    this.listeners.forEach((fn) => fn(value));
  }
  private fade(param: AudioParam | undefined, value: number, duration = 0.3) {
    if (!param || !this.context) return;
    const t = this.context.currentTime;
    param.cancelScheduledValues(t);
    param.setValueAtTime(param.value, t);
    param.linearRampToValueAtTime(value, t + duration);
  }
  private init() {
    if (this.context) return this.context;
    const Constructor =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Constructor) throw new Error("Web Audio unavailable");
    const ctx = (this.context = new Constructor());
    this.master = ctx.createGain();
    this.master.gain.value = this.volumes.master;
    this.musicGain = ctx.createGain();
    this.musicGain.gain.value = 0;
    this.sfxGain = ctx.createGain();
    this.sfxGain.gain.value = this.volumes.sfx;
    this.duckGain = ctx.createGain();
    this.duckGain.gain.value = 1;
    this.tone = ctx.createBiquadFilter();
    this.tone.type = "lowpass";
    this.tone.frequency.value = 9000;
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -12;
    limiter.ratio.value = 5;
    limiter.attack.value = 0.004;
    limiter.release.value = 0.15;
    this.musicGain
      .connect(this.tone)
      .connect(this.duckGain)
      .connect(this.master);
    this.sfxGain.connect(this.master);
    this.master.connect(limiter).connect(ctx.destination);
    ctx.onstatechange = () => {
      if (ctx.state !== "running" && this.snapshot().enabled && !this.muted)
        this.notify("paused");
    };
    const prime = ctx.createBufferSource();
    prime.buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
    prime.connect(this.master);
    prime.start();
    prime.onended = () => prime.disconnect();
    return ctx;
  }
  start = () => {
    if (this.disposed || this.muted) return;
    this.requested = true;
    if (this.pauseTimer) clearTimeout(this.pauseTimer);
    try {
      const ctx = this.init();
      // Synchronous resume in the gesture, before any download/decode promise.
      const resumed = ctx.resume();
      this.notify("loading");
      if (!this.loading) this.loading = this.load(ctx);
      void Promise.all([resumed, this.loading])
        .then(() => {
          if (this.disposed || this.muted || document.hidden) return;
          if (ctx.state !== "running") {
            this.notify("blocked");
            return;
          }
          if (this.buffer && !this.music) {
            this.music = ctx.createBufferSource();
            this.music.buffer = this.buffer;
            this.music.loop = true;
            this.music.connect(this.musicGain!);
            this.music.start();
          }
          this.fade(this.musicGain?.gain, this.volumes.music, 0.8);
          this.fade(this.sfxGain?.gain, this.volumes.sfx, 0.12);
          this.setScene(this.scene);
          this.notify(this.music ? "playing" : "effects-only");
        })
        .catch(() => {
          if (!this.disposed && !this.muted && !document.hidden)
            this.notify("blocked");
        });
    } catch {
      this.notify("blocked");
    }
  };
  private async load(ctx: AudioContext) {
    try {
      const response = await fetch(
        withBase(this.audio?.src || musicTracks[this.theme]),
        { signal: this.abort.signal },
      );
      if (!response.ok) throw new Error("Music unavailable");
      const decoded = await ctx.decodeAudioData(await response.arrayBuffer());
      if (!this.disposed) this.buffer = decoded;
    } catch {
      /* Sound effects remain available if the music cannot load. */
    } finally {
      this.loadFinished = true;
    }
  }
  toggle = () => {
    if (this.snapshot().enabled || this.status === "loading") {
      this.muted = true;
      this.remember();
      this.pause("muted");
    } else {
      this.muted = false;
      this.remember();
      if (this.loadFinished && !this.buffer) {
        this.loading = null;
        this.loadFinished = false;
      }
      this.start();
    }
  };
  retry = () => {
    if (this.loadFinished && !this.buffer) {
      this.loading = null;
      this.loadFinished = false;
    }
    this.muted = false;
    this.remember();
    this.start();
  };
  private remember() {
    try {
      localStorage.setItem(muteKey, String(this.muted));
    } catch {}
  }
  private pause(status: "muted" | "paused") {
    this.fade(this.musicGain?.gain, 0, 0.12);
    this.fade(this.sfxGain?.gain, 0, 0.1);
    this.notify(status);
    if (this.pauseTimer) clearTimeout(this.pauseTimer);
    this.pauseTimer = setTimeout(() => {
      if (!this.disposed && (this.muted || document.hidden)) {
        this.voices.forEach((voice) => voice.stop());
        void this.context?.suspend().catch(() => {});
      }
    }, 140);
  }
  private visibility = () => {
    if (document.hidden) this.pause(this.muted ? "muted" : "paused");
    else if (this.requested && !this.muted) this.start();
  };
  setVolume = (bus: keyof AudioVolumes, value: number) => {
    this.volumes[bus] = clamp(value);
    this.fade(
      bus === "master"
        ? this.master?.gain
        : bus === "music"
          ? this.musicGain?.gain
          : this.sfxGain?.gain,
      bus !== "master" && (this.muted || document.hidden)
        ? 0
        : this.volumes[bus],
    );
    this.notify();
  };
  setScene = (scene: number) => {
    this.scene = scene;
    this.fade(
      this.tone?.frequency,
      this.theme === "proposal"
        ? 3500 + scene * 900
        : this.theme === "party"
          ? 5000 + scene * 900
          : 8500,
      0.8,
    );
    if (this.music) this.duck(0.7, 0.35);
  };
  duck = (amount = 0.3, duration = 0.7) => {
    if (!this.context || !this.duckGain) return;
    const t = this.context.currentTime;
    const gain = this.duckGain.gain;
    gain.cancelScheduledValues(t);
    gain.setValueAtTime(gain.value, t);
    gain.linearRampToValueAtTime(amount, t + 0.07);
    gain.linearRampToValueAtTime(1, t + duration);
  };
  play = (name: SoundName = "star_collect", variation = 0) => {
    const ctx = this.context;
    if (
      !ctx ||
      ctx.state !== "running" ||
      this.muted ||
      document.hidden ||
      this.disposed
    )
      return;
    const id = contextualSound(name),
      key = ["constellation_connect", "star_collect"].includes(id)
        ? `${id}:${variation}`
        : id;
    if (ctx.currentTime - (this.lastPlay.get(key) ?? -10) < 0.065) return;
    this.lastPlay.set(key, ctx.currentTime);
    if (this.voices.size >= 7) this.voices.values().next().value?.stop();
    const shape = soundShape(name);
    const nodes: AudioScheduledSourceNode[] = [];
    const out = ctx.createGain();
    out.gain.value = 0.11;
    out.connect(this.sfxGain!);
    let remaining = shape.notes.length + (shape.noise ? 1 : 0);
    const voice = {
      stop: () => {
        nodes.forEach((node) => {
          try {
            node.stop();
          } catch {}
          node.disconnect();
        });
        out.disconnect();
        this.voices.delete(voice);
      },
    };
    const ended = () => {
      if (--remaining <= 0) voice.stop();
    };
    this.voices.add(voice);
    shape.notes.forEach((frequency, index) => {
      const oscillator = ctx.createOscillator(),
        gain = ctx.createGain(),
        t = ctx.currentTime + index * 0.045;
      oscillator.type = shape.wave || "sine";
      oscillator.frequency.setValueAtTime(
        frequency * 2 ** (((variation % 5) * 2) / 12),
        t,
      );
      if (shape.down)
        oscillator.frequency.exponentialRampToValueAtTime(
          70,
          t + shape.duration,
        );
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(
        0.65 / Math.sqrt(shape.notes.length),
        t + 0.008,
      );
      gain.gain.exponentialRampToValueAtTime(0.001, t + shape.duration);
      oscillator.connect(gain).connect(out);
      oscillator.onended = () => {
        gain.disconnect();
        ended();
      };
      nodes.push(oscillator);
      oscillator.start(t);
      oscillator.stop(t + shape.duration + 0.02);
    });
    if (shape.noise) {
      const source = ctx.createBufferSource(),
        buffer = ctx.createBuffer(
          1,
          Math.ceil(ctx.sampleRate * shape.duration),
          ctx.sampleRate,
        ),
        data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++)
        data[i] = (Math.random() * 2 - 1) * Math.exp((-i / data.length) * 4);
      source.buffer = buffer;
      const filter = ctx.createBiquadFilter(),
        gain = ctx.createGain();
      filter.type = "lowpass";
      filter.frequency.value = shape.filter || 5000;
      gain.gain.value = shape.noise;
      source.connect(filter).connect(gain).connect(out);
      source.onended = () => {
        filter.disconnect();
        gain.disconnect();
        ended();
      };
      nodes.push(source);
      source.start();
    }
    if (
      [
        "ring_reveal",
        "magic_reveal",
        "candle_blow",
        "disco_reveal",
        "romantic_finale",
      ].includes(id)
    )
      this.duck(0.22, shape.duration + 0.4);
  };
  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.abort.abort();
    document.removeEventListener("visibilitychange", this.visibility);
    if (this.pauseTimer) clearTimeout(this.pauseTimer);
    this.voices.forEach((voice) => voice.stop());
    this.listeners.clear();
    try {
      this.music?.stop();
    } catch {}
    this.music?.disconnect();
    this.music = null;
    this.buffer = null;
    if (this.context) {
      this.context.onstatechange = null;
      void this.context.close().catch(() => {});
    }
  }
}
