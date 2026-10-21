import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AudioEngine } from "./AudioEngine";
import { sounds } from "./sounds";

class Param {
  value = 1;
  cancelScheduledValues = vi.fn();
  setValueAtTime = vi.fn((n: number) => {
    this.value = n;
  });
  linearRampToValueAtTime = vi.fn((n: number) => {
    this.value = n;
  });
  exponentialRampToValueAtTime = vi.fn((n: number) => {
    this.value = n;
  });
}
class Node {
  gain = new Param();
  frequency = new Param();
  threshold = new Param();
  ratio = new Param();
  attack = new Param();
  release = new Param();
  type = "";
  loop = false;
  buffer: unknown = null;
  onended: (() => void) | null = null;
  connect = vi.fn((target: Node) => target);
  disconnect = vi.fn();
  start = vi.fn();
  stop = vi.fn();
}
class Context {
  static instances: Context[] = [];
  static refuse = false;
  state = "suspended";
  currentTime = 0;
  sampleRate = 1000;
  destination = new Node();
  sources: Node[] = [];
  onstatechange: unknown;
  constructor() {
    Context.instances.push(this);
  }
  createGain = () => new Node();
  createBiquadFilter = () => new Node();
  createDynamicsCompressor = () => new Node();
  createOscillator = () => {
    const n = new Node();
    this.sources.push(n);
    return n;
  };
  createBufferSource = () => {
    const n = new Node();
    this.sources.push(n);
    return n;
  };
  createBuffer = (_channels: number, length: number) => ({
    getChannelData: () => new Float32Array(length),
  });
  decodeAudioData = vi.fn(async () => ({ duration: 42 }));
  resume = vi.fn(async () => {
    if (Context.refuse) throw new Error("NotAllowedError");
    this.state = "running";
  });
  suspend = vi.fn(async () => {
    this.state = "suspended";
  });
  close = vi.fn(async () => {
    this.state = "closed";
  });
}
const engines: AudioEngine[] = [];
let doc: EventTarget & { hidden: boolean };
let storage: Map<string, string>;
const create = () => {
  const engine = new AudioEngine("birthday");
  engines.push(engine);
  return engine;
};
beforeEach(() => {
  Context.instances = [];
  Context.refuse = false;
  doc = Object.assign(new EventTarget(), { hidden: false });
  storage = new Map();
  vi.stubGlobal("window", { AudioContext: Context });
  vi.stubGlobal("document", doc);
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
  });
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(10),
    })),
  );
});
afterEach(() => {
  engines.splice(0).forEach((engine) => engine.dispose());
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("Moteur musical", () => {
  it("attend le geste, reprend le contexte immédiatement et ne double jamais la boucle", async () => {
    const engine = create();
    expect(Context.instances).toHaveLength(0);
    expect(fetch).not.toHaveBeenCalled();
    engine.start();
    const ctx = Context.instances[0];
    expect(ctx.resume).toHaveBeenCalledOnce();
    await vi.waitFor(() => expect(engine.snapshot().status).toBe("playing"));
    engine.start();
    await vi.waitFor(() => expect(engine.snapshot().enabled).toBe(true));
    expect(ctx.sources.filter((source) => source.loop)).toHaveLength(1);
    expect(fetch).toHaveBeenCalledOnce();
  });
  it("ne prétend pas jouer après un refus et peut reprendre sur un nouveau geste", async () => {
    Context.refuse = true;
    const engine = create();
    engine.start();
    await vi.waitFor(() => expect(engine.snapshot().status).toBe("blocked"));
    expect(engine.snapshot().enabled).toBe(false);
    Context.refuse = false;
    engine.toggle();
    await vi.waitFor(() => expect(engine.snapshot().status).toBe("playing"));
  });
  it("garde les effets disponibles lorsque la musique échoue", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: false } as Response);
    const engine = create();
    engine.start();
    await vi.waitFor(() =>
      expect(engine.snapshot().status).toBe("effects-only"),
    );
    expect(engine.snapshot().enabled).toBe(true);
    expect(Context.instances[0].sources.filter((s) => s.loop)).toHaveLength(0);
  });
  it("réessaie une musique indisponible sans créer un second contexte", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: false } as Response);
    const engine = create();
    engine.start();
    await vi.waitFor(() =>
      expect(engine.snapshot().status).toBe("effects-only"),
    );
    engine.retry();
    await vi.waitFor(() => expect(engine.snapshot().status).toBe("playing"));
    expect(Context.instances).toHaveLength(1);
    expect(fetch).toHaveBeenCalledTimes(2);
  });
  it("ne double pas le téléchargement après un mute rapide pendant le chargement", async () => {
    let release!: (response: Response) => void;
    vi.mocked(fetch).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          release = resolve;
        }),
    );
    const engine = create();
    engine.start();
    engine.toggle();
    engine.toggle();
    expect(fetch).toHaveBeenCalledOnce();
    release({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(10),
    } as Response);
    await vi.waitFor(() => expect(engine.snapshot().status).toBe("playing"));
    expect(Context.instances[0].sources.filter((s) => s.loop)).toHaveLength(1);
  });
  it("fonctionne si le stockage local est refusé", async () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("Storage unavailable");
      },
      setItem: () => {
        throw new Error("Storage unavailable");
      },
    });
    const engine = create();
    engine.start();
    await vi.waitFor(() => expect(engine.snapshot().enabled).toBe(true));
    expect(() => engine.toggle()).not.toThrow();
    expect(engine.snapshot().status).toBe("muted");
  });
  it("respecte un mute sauvegardé, même lors du démarrage suivant", async () => {
    const first = create();
    first.start();
    await vi.waitFor(() => expect(first.snapshot().enabled).toBe(true));
    first.toggle();
    expect(storage.get("magical-moments:muted")).toBe("true");
    first.dispose();
    const next = create();
    next.start();
    expect(next.snapshot().status).toBe("muted");
    expect(Context.instances).toHaveLength(1);
  });
  it("suspend un onglet masqué, reprend sans doublon et reste muet après un choix utilisateur", async () => {
    vi.useFakeTimers();
    const engine = create();
    engine.start();
    await vi.waitFor(() => expect(engine.snapshot().enabled).toBe(true));
    const ctx = Context.instances[0];
    doc.hidden = true;
    doc.dispatchEvent(new Event("visibilitychange"));
    await vi.advanceTimersByTimeAsync(160);
    expect(ctx.state).toBe("suspended");
    doc.hidden = false;
    doc.dispatchEvent(new Event("visibilitychange"));
    await vi.waitFor(() => expect(engine.snapshot().status).toBe("playing"));
    expect(ctx.sources.filter((s) => s.loop)).toHaveLength(1);
    engine.toggle();
    doc.hidden = true;
    doc.dispatchEvent(new Event("visibilitychange"));
    doc.hidden = false;
    doc.dispatchEvent(new Event("visibilitychange"));
    expect(engine.snapshot().status).toBe("muted");
  });
  it("sépare les volumes, borne leurs valeurs et limite les voix puis libère les ressources", async () => {
    const engine = create();
    engine.start();
    await vi.waitFor(() => expect(engine.snapshot().enabled).toBe(true));
    const ctx = Context.instances[0];
    engine.setVolume("music", 0);
    engine.setVolume("sfx", 2);
    engine.setVolume("master", -0.3);
    expect(engine.snapshot().volumes).toEqual({ master: 0, music: 0, sfx: 1 });
    for (const sound of Object.keys(sounds) as (keyof typeof sounds)[]) {
      ctx.currentTime += 0.1;
      engine.play(sound);
    }
    expect(
      ctx.sources.some((source) => source.stop.mock.calls.length > 0),
    ).toBe(true);
    engine.dispose();
    expect(ctx.close).toHaveBeenCalled();
    expect(engine.snapshot().volumes.music).toBe(0);
  });
});
