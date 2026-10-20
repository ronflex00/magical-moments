export interface Photo { src: string; alt: string; caption?: string }
export interface CreationBase {
  id: string;
  slug: string;
  type: 'birthday' | 'proposal' | 'party';
  metadata: { title: string; description: string; noindex: boolean };
  audio?: { src: string; volume?: number };
}
export interface BirthdayConfig extends CreationBase {
  type: 'birthday';
  firstName: string;
  age: number;
  message: string;
  gift: { title: string; description: string };
  colors: { background: string; accent: string; secondary: string };
  photos: Photo[];
  candleCount: number;
  interactions: { balloonsToPop: number; giftTaps: number };
}
export interface Memory { title: string; message: string; photo?: Photo }
export interface ProposalConfig extends CreationBase {
  type: 'proposal';
  firstName: string;
  partnerName: string;
  welcome: string;
  letter: string;
  question: string;
  finalMessage: string;
  memories: [Memory, Memory, Memory];
  photos: Photo[];
  colors: { background: string; accent: string; secondary: string };
}
export interface PartyConfig extends CreationBase {
  type: 'party';
  name: string;
  organizer: string;
  date: string;
  time: string;
  address: string;
  dressCode?: string;
  message: string;
  rsvp: { email?: string; whatsapp?: string };
  colors: { background: string; accent: string; secondary: string };
}
export type CreationConfig = BirthdayConfig | ProposalConfig | PartyConfig;
