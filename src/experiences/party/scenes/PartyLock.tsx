import { useState } from 'react';
import { codeMatches } from './party-puzzles';
import { ConfettiBurst } from '../../../components/effects/ConfettiBurst';

export function PartyLock({ code, value, onChange, unlocked, onUnlock }: { code: string; value: string; onChange: (value: string) => void; unlocked: boolean; onUnlock: () => void }) {
  const [feedback, setFeedback] = useState('Trois pièces, trois chiffres. La porte de la soirée n’attend plus que vous.');
  function check() {
    if (codeMatches(value,code)) { setFeedback('Clic. Le verrou vient de céder. Vous avez rendez-vous avec la fête !'); onUnlock(); }
    else setFeedback('Ce code ne fait pas encore tourner la boule disco. Regardez les chiffres de votre ticket.');
  }
  return <form className={`party-lock ${unlocked ? 'is-unlocked' : ''}`} onSubmit={event => { event.preventDefault(); check(); }}>
    <div className="party-lock-ticket"><span>VOTRE TICKET RECONSTITUÉ</span><strong>{code.split('').join(' · ')}</strong></div>
    <label htmlFor="party-code-entry">Le code secret</label>
    <input id="party-code-entry" value={value} onChange={event => onChange(event.target.value.replace(/\D/g,'').slice(0,3))} maxLength={3} inputMode="numeric" autoComplete="off" pattern="[0-9]{3}" placeholder="···" disabled={unlocked} aria-describedby="party-lock-status" />
    {!unlocked && <div className="party-keypad" aria-label="Clavier du code">{[1,2,3,4,5,6,7,8,9].map(digit => <button type="button" key={digit} aria-label={`Chiffre ${digit}`} onClick={() => onChange((value + digit).slice(0,3))}>{digit}</button>)}<button type="button" aria-label="Effacer le dernier chiffre" onClick={() => onChange(value.slice(0,-1))}>←</button><button type="button" aria-label="Chiffre 0" onClick={() => onChange((value+'0').slice(0,3))}>0</button><button type="submit" aria-label="Valider le code" disabled={value.length !== 3}>↵</button></div>}
    <p id="party-lock-status" className="party-puzzle-feedback" role="status">{feedback}</p>
    {!unlocked && <button className="party-button" type="submit" disabled={value.length !== 3}>Déverrouiller la soirée <span aria-hidden="true">↗</span></button>}
    <ConfettiBurst eventKey={unlocked ? 1 : 0} tone="disco"/>
  </form>;
}
