import type { AudioSnapshot, AudioVolumes } from "../../lib/audio/AudioEngine";
export type MixerState = AudioSnapshot & {
  setVolume: (bus: keyof AudioVolumes, value: number) => void;
  retry?: () => void;
};
export function AudioMixer({ audio }: { audio: MixerState }) {
  const labels = {
    master: "Volume général",
    music: "Musique",
    sfx: "Effets sonores",
  };
  const status = {
    idle: "La musique commence avec vous.",
    loading: "La musique arrive…",
    playing: "Musique & effets",
    muted: "Son coupé",
    paused: "Son en pause",
    blocked: "Touchez le bouton son pour réessayer.",
    "effects-only": "Musique indisponible · effets actifs",
  };
  return (
    <details className="audio-mixer">
      <summary aria-label="Régler les volumes">
        <span aria-hidden="true">♫</span>
      </summary>
      <div className="audio-panel">
        <p role="status">{status[audio.status]}</p>
        {(["master", "music", "sfx"] as const).map((bus) => (
          <label key={bus}>
            <span>{labels[bus]}</span>
            <output>{Math.round(audio.volumes[bus] * 100)} %</output>
            <input
              type="range"
              aria-label={labels[bus]}
              min="0"
              max="1"
              step="0.05"
              value={audio.volumes[bus]}
              onChange={(event) =>
                audio.setVolume(bus, Number(event.target.value))
              }
            />
          </label>
        ))}
      </div>
    </details>
  );
}
