export type AudioTheme = "birthday" | "proposal" | "party";
export const musicTracks: Record<AudioTheme, string> = {
  birthday: "/audio/birthday-garden.mp3",
  proposal: "/audio/our-constellation.mp3",
  party: "/audio/midnight-disco.mp3",
};
type Shape = {
  notes: number[];
  duration: number;
  wave?: OscillatorType;
  noise?: number;
  filter?: number;
  down?: boolean;
};
export const sounds = {
  balloon_pop: { notes: [220], duration: 0.13, noise: 0.45, down: true },
  star_collect: { notes: [880, 1320, 1760], duration: 0.45 },
  candle_ignite: { notes: [1600], duration: 0.17, noise: 0.35, filter: 3600 },
  candle_blow: { notes: [], duration: 0.65, noise: 0.65, filter: 900 },
  gift_ribbon: { notes: [320, 480], duration: 0.3, noise: 0.22, filter: 1800 },
  gift_open: { notes: [240, 360], duration: 0.3, wave: "triangle" },
  magic_reveal: { notes: [523, 659, 784, 1047], duration: 0.9 },
  birthday_finale: { notes: [523, 784, 1047, 1319, 1568], duration: 1.1 },
  star_touch: { notes: [587], duration: 0.35 },
  constellation_connect: { notes: [587, 880], duration: 0.6 },
  memory_reveal: { notes: [440, 554, 659], duration: 0.6, wave: "triangle" },
  paper_slide: { notes: [], duration: 0.28, noise: 0.3, filter: 1700 },
  letter_open: { notes: [293, 440], duration: 0.4, noise: 0.14, filter: 1500 },
  ring_box_open: { notes: [1200, 720], duration: 0.15, noise: 0.12 },
  ring_reveal: { notes: [587, 740, 880, 1175, 1480], duration: 1.4 },
  romantic_finale: {
    notes: [294, 440, 587, 740, 880],
    duration: 1.7,
    wave: "triangle",
  },
  vinyl_start: {
    notes: [110, 165, 220],
    duration: 0.32,
    wave: "triangle",
    noise: 0.08,
  },
  clue_pickup: { notes: [392, 523], duration: 0.22, wave: "triangle" },
  object_drag: { notes: [196], duration: 0.12, wave: "triangle" },
  clue_snap: { notes: [262, 523], duration: 0.18, noise: 0.08 },
  keypad_press: { notes: [440, 660], duration: 0.08, wave: "triangle" },
  wrong_code: { notes: [220, 196], duration: 0.25, wave: "triangle" },
  unlock: { notes: [330, 494, 659], duration: 0.5 },
  disco_reveal: {
    notes: [147, 294, 440, 587, 740],
    duration: 0.9,
    wave: "triangle",
  },
  confetti: { notes: [784, 988, 1175], duration: 0.55, noise: 0.13 },
} satisfies Record<string, Shape>;
export type SoundId = keyof typeof sounds;
export type SoundName = SoundId | "pop" | "chime" | "celebrate";
export function contextualSound(name: SoundName): SoundId {
  return name === "pop"
    ? "balloon_pop"
    : name === "chime"
      ? "star_collect"
      : name === "celebrate"
        ? "magic_reveal"
        : name;
}
export function soundShape(name: SoundName): Shape {
  return sounds[contextualSound(name)];
}
