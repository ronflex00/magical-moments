import { useEffect, useState } from "react";

const channel = "magical-moments:gesture-debug";
const selector =
  ".gesture-surface, .scratch-veil, .proposal-weave-board, .memory-gallery";
type Entry = {
  event: string;
  target: string;
  dx: number;
  dy: number;
  direction: string;
  decision: string;
  capture: string;
  action: string;
  dropTarget: string;
  result: 'accepted' | 'rejected' | 'tracking';
};

export function debugGesturesEnabled() {
  return (
    typeof location !== "undefined" &&
    new URLSearchParams(location.search).get("debugGestures") === "1"
  );
}

/** Only a transient, local diagnostic; no storage, console logging or network. */
export function reportGesture(
  element: HTMLElement,
  event: string,
  decision: string,
  dx = 0,
  dy = 0,
  diagnostic?: { object?: string; dropTarget?: string },
) {
  if (!debugGesturesEnabled()) return;
  element.dispatchEvent(
    new CustomEvent(channel, {
      bubbles: true,
      detail: { event, decision, dx, dy, ...diagnostic },
    }),
  );
}

export function GestureDebug() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [enabled, setEnabled] = useState(false);
  const [top, setTop] = useState(false);
  useEffect(() => {
    if (!debugGesturesEnabled()) return;
    setEnabled(true);
    let start = { x: 0, y: 0 };
    let current: Element | null = null;
    let decision = "en attente";
    let dropTarget = '—';
    let recent: Entry[] = [];
    let timer = 0;
    const update = () => {
      timer = 0;
      setEntries([...recent]);
    };
    const record = (event: Event) => {
      const origin = event.target instanceof Element ? event.target : null;
      if (origin?.closest(".gesture-debug")) return;
      const surface =
        origin?.closest<HTMLElement>(selector) ||
        current?.closest<HTMLElement>(selector);
      if (!surface) return;
      const pointer = event as PointerEvent;
      const touch = (event as TouchEvent).changedTouches?.[0];
      const point =
        touch || (typeof pointer.clientX === "number" ? pointer : null);
      const detail = event instanceof CustomEvent ? event.detail : null;
      if (event.type === "pointerdown" || event.type === "touchstart") {
        if (point) start = { x: point.clientX, y: point.clientY };
        current = origin;
        decision = "en attente";
        dropTarget = '—';
      }
      if (detail) decision = detail.decision;
      if (detail?.dropTarget) dropTarget = detail.dropTarget;
      const dx = detail?.dx ?? (point ? point.clientX - start.x : 0);
      const dy = detail?.dy ?? (point ? point.clientY - start.y : 0);
      const target = current || origin || surface;
      const control = target.closest("button, a") || target;
      recent = [
        ...recent.slice(-13),
        {
          event: detail?.event || event.type,
          target: detail?.object ||
            control.getAttribute("aria-label") ||
            `${target.tagName.toLowerCase()}.${String(target.getAttribute("class") || "").split(" ")[0]}`,
          dropTarget,
          result: /rejeté|cancel|interruption|perte de capture/.test(`${event.type} ${decision}`)
            ? 'rejected' : /accepté/.test(decision) ? 'accepted' : 'tracking',
          dx: Math.round(dx),
          dy: Math.round(dy),
          direction:
            Math.hypot(dx, dy) < 8
              ? "tap / maintien"
              : Math.abs(dx) > Math.abs(dy)
                ? dx < 0
                  ? "←"
                  : "→"
                : dy < 0
                  ? "↑"
                  : "↓",
          decision,
          capture:
            typeof pointer.pointerId === "number"
              ? `${surface.hasPointerCapture(pointer.pointerId) ? "surface" : control.hasPointerCapture(pointer.pointerId) ? "contrôle" : "non"} #${pointer.pointerId}`
              : "—",
          action: `${getComputedStyle(surface).touchAction} / cible ${getComputedStyle(target).touchAction}`,
        },
      ];
      if (!timer) timer = window.setTimeout(update, 80);
    };
    const events = [
      "pointerdown",
      "pointermove",
      "pointerup",
      "pointercancel",
      "gotpointercapture",
      "lostpointercapture",
      "touchstart",
      "touchmove",
      "touchend",
      "touchcancel",
      channel,
    ];
    events.forEach((name) =>
      document.addEventListener(name, record, { capture: true, passive: true }),
    );
    return () => {
      events.forEach((name) =>
        document.removeEventListener(name, record, true),
      );
      clearTimeout(timer);
    };
  }, []);
  if (!enabled) return null;
  const last = entries.at(-1);
  return (
    <details className={`gesture-debug${top ? " is-top" : ""}`} open>
      <summary>
        Diagnostic tactile · local uniquement{" "}
        <button
          type="button"
          aria-label={
            top ? "Placer le diagnostic en bas" : "Placer le diagnostic en haut"
          }
          onClick={(event) => {
            event.preventDefault();
            setTop((value) => !value);
          }}
        >
          ↕
        </button>
      </summary>
      <div className="gesture-debug-body">
        <p>{last?.target || "Touchez un objet interactif."}</p>
        {last && (
          <p>
            {last.dx}, {last.dy} px · {last.direction} · {last.decision}
            <br />
            Capture : {last.capture}
            <br />
            touch-action : {last.action}
            <br />
            Dépôt : {last.dropTarget}
          </p>
        )}
        <ol aria-label="Derniers événements tactiles">
          {entries.map((entry, index) => (
            <li key={index} data-result={entry.result}>
              {entry.event} · {entry.dx}/{entry.dy} · {entry.direction} ·{" "}
              {entry.decision} · capture {entry.capture} · dépôt {entry.dropTarget}
            </li>
          ))}
        </ol>
        <p>
          Aucune donnée enregistrée ou envoyée. Retirez ?debugGestures=1 pour
          désactiver.
        </p>
      </div>
    </details>
  );
}
