import { reportGesture } from "./GestureDebug";

export type GestureAxis = "x" | "y" | "both";
export function gestureIntent(
  dx: number,
  dy: number,
  axis: GestureAxis,
  slop = 8,
): "wait" | "accept" | "scroll" {
  if (Math.hypot(dx, dy) < slop) return "wait";
  if (axis === "x" && Math.abs(dy) > Math.abs(dx) * 1.15) return "scroll";
  if (axis === "y" && Math.abs(dx) > Math.abs(dy) * 1.6) return "scroll";
  return "accept";
}
export type Contact = {
  x: number;
  y: number;
  startX: number;
  startY: number;
  dx: number;
  dy: number;
  intent: "wait" | "accept";
  source: "pointer" | "touch";
  pointerType: string;
  pointerId: number | null;
  touchId: number | null;
  capture: Element;
};
type Options = {
  axis: GestureAxis;
  slop?: number;
  disabled?: boolean;
  start?: (contact: Contact) => void;
  move?: (contact: Contact) => void;
  end?: (contact: Contact) => boolean | void;
  cancel?: (contact: Contact, reason: string) => void;
};

let clearPreviousClickGuard: (() => void) | undefined;
function guardCompatibilityClick(contact: Contact) {
  clearPreviousClickGuard?.();
  const clear = () => {
    document.removeEventListener("click", click, { capture: true });
    document.removeEventListener("pointerdown", clear, { capture: true });
    document.removeEventListener("touchstart", clear, { capture: true });
    clearTimeout(timer);
    if (clearPreviousClickGuard === clear) clearPreviousClickGuard = undefined;
  };
  const click = (event: MouseEvent) => {
    if (event.detail === 0) return;
    if (Math.hypot(event.clientX - contact.x, event.clientY - contact.y) < 40) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
    clear();
  };
  const timer = window.setTimeout(clear, 700);
  clearPreviousClickGuard = clear;
  document.addEventListener("click", click, true);
  document.addEventListener("pointerdown", clear, {
    capture: true,
    once: true,
  });
  document.addEventListener("touchstart", clear, {
    capture: true,
    once: true,
    passive: true,
  });
}

/** Native capture-phase listeners precede React/Motion children. One stream owns
 * each contact. Native touch tracking survives cancellation of parallel pointers.
 * Non-passive touchmove is restricted to these surfaces and accepted gestures.
 */
export function observeContact(element: HTMLElement, options: () => Options) {
  let active: Contact | null = null;
  let blockedClick = false,
    blockedUntil = 0;
  const captureOptions = { capture: true, passive: false };
  const owner = (event: Event) => {
    const target = event.target instanceof Element ? event.target : null;
    return target &&
      !target.closest("[data-gesture-ignore]") &&
      target.closest("[data-gesture-input]") === element
      ? target
      : null;
  };
  function release(contact: Contact) {
    if (contact.pointerId === null) return;
    try {
      if (contact.capture.hasPointerCapture(contact.pointerId))
        contact.capture.releasePointerCapture(contact.pointerId);
    } catch {
      /* Already cancelled. */
    }
  }
  function suppressClick() {
    blockedClick = true;
    blockedUntil = performance.now() + 700;
  }
  function finish(cancelled?: string) {
    const contact = active;
    if (!contact) return;
    active = null;
    removeTracking();
    release(contact);
    let consumed = contact.intent === "accept";
    if (consumed || cancelled) suppressClick();
    if (cancelled) {
      reportGesture(
        element,
        "interruption",
        `rejeté : ${cancelled}`,
        contact.dx,
        contact.dy,
      );
      options().cancel?.(contact, cancelled);
    } else consumed = options().end?.(contact) === true || consumed;
    if (consumed) {
      suppressClick();
      guardCompatibilityClick(contact);
    }
  }
  function begin(
    x: number,
    y: number,
    target: Element,
    source: Contact["source"],
    pointerType: string,
    pointerId: number | null,
    touchId: number | null,
  ) {
    if (options().disabled) return;
    blockedClick = false;
    // Capture the touched control to preserve its native tap and keyboard action.
    const capture = target.closest("button, a") || element;
    active = {
      x,
      y,
      startX: x,
      startY: y,
      dx: 0,
      dy: 0,
      intent: "wait",
      source,
      pointerType,
      pointerId,
      touchId,
      capture,
    };
    if (pointerId !== null) {
      try {
        capture.setPointerCapture(pointerId);
      } catch {
        /* Document tracking remains available. */
      }
    }
    addTracking();
    reportGesture(element, "début", `${source} · capture demandée`);
    options().start?.(active);
  }
  function update(x: number, y: number, event?: Event) {
    const contact = active;
    if (!contact) return;
    if (options().disabled) {
      finish("surface désactivée");
      return;
    }
    contact.x = x;
    contact.y = y;
    contact.dx = x - contact.startX;
    contact.dy = y - contact.startY;
    if (contact.intent === "wait") {
      const intent = gestureIntent(
        contact.dx,
        contact.dy,
        options().axis,
        options().slop,
      );
      if (intent === "scroll") {
        finish("scroll natif / autre axe");
        return;
      }
      if (intent === "wait") return;
      contact.intent = "accept";
      suppressClick();
    }
    if (event?.cancelable) event.preventDefault();
    options().move?.(contact);
  }
  function pointerDown(event: PointerEvent) {
    if (!active) blockedClick = false;
    if (active) {
      // Also support engines that deliver touchstart before the matching pointer.
      if(active.source==='touch'&&active.pointerId===null&&event.pointerType==='touch'&&event.isPrimary){
        active.pointerId=event.pointerId;
        try{active.capture.setPointerCapture(event.pointerId);}catch{/* Touch tracking already owns the contact. */}
        return;
      }
      if (event.pointerId !== active.pointerId) finish("plusieurs contacts");
      return;
    }
    const target = owner(event);
    if (
      !target ||
      !event.isPrimary ||
      (event.pointerType === "mouse" && event.button !== 0)
    )
      return;
    begin(
      event.clientX,
      event.clientY,
      target,
      "pointer",
      event.pointerType,
      event.pointerId,
      null,
    );
  }
  function pointerMove(event: PointerEvent) {
    if (active?.source === "pointer" && event.pointerId === active.pointerId)
      update(event.clientX, event.clientY, event);
  }
  function pointerEnd(event: PointerEvent) {
    if (active?.source !== "pointer" || event.pointerId !== active.pointerId)
      return;
    update(event.clientX, event.clientY);
    finish();
  }
  function pointerCancel(event: PointerEvent) {
    if (!active || event.pointerId !== active.pointerId) return;
    if (active.source === "touch")
      reportGesture(
        element,
        event.type,
        "suivi touch conservé",
        active.dx,
        active.dy,
      );
    else finish(event.type);
  }
  function lostCapture(event: PointerEvent) {
    if (
      !active ||
      event.pointerId !== active.pointerId ||
      event.target !== active.capture
    )
      return;
    if (active.source === "touch")
      reportGesture(
        element,
        event.type,
        "suivi touch conservé",
        active.dx,
        active.dy,
      );
    else finish("perte de capture");
  }
  function touchStart(event: TouchEvent) {
    if (!active) blockedClick = false;
    if (event.touches.length !== 1) {
      finish("plusieurs contacts");
      return;
    }
    const target = owner(event),
      touch = event.changedTouches[0];
    if (!target || !touch || options().disabled) return;
    if (active?.pointerType === "touch" && active.source === "pointer") {
      active.source = "touch";
      active.touchId = touch.identifier;
      reportGesture(element, "touchstart", "flux tactile propriétaire");
    } else if (!active)
      begin(
        touch.clientX,
        touch.clientY,
        target,
        "touch",
        "touch",
        null,
        touch.identifier,
      );
  }
  function touchMove(event: TouchEvent) {
    if (active?.source !== "touch") return;
    if (event.touches.length !== 1) {
      finish("plusieurs contacts");
      return;
    }
    const touch = Array.from(event.changedTouches).find(
      (touch) => touch.identifier === active?.touchId,
    );
    if (touch) update(touch.clientX, touch.clientY, event);
  }
  function touchEnd(event: TouchEvent) {
    if (active?.source !== "touch") return;
    const touch = Array.from(event.changedTouches).find(
      (touch) => touch.identifier === active?.touchId,
    );
    if (!touch) return;
    if (event.type === "touchcancel") {
      finish("touchcancel");
      return;
    }
    update(touch.clientX, touch.clientY);
    finish();
  }
  function click(event: MouseEvent) {
    if (event.detail > 0 && blockedClick && performance.now() <= blockedUntil) {
      event.preventDefault();
      event.stopImmediatePropagation();
      blockedClick = false;
      reportGesture(element, "click", "clic de compatibilité supprimé");
    }
  }
  function interrupt() {
    finish("fenêtre interrompue");
  }
  function visibility() {
    if (document.hidden) finish("onglet masqué");
  }
  function secondTouch(event: TouchEvent) {
    if (event.touches.length > 1) finish("plusieurs contacts");
  }
  function addTracking() {
    document.addEventListener("pointermove", pointerMove, captureOptions);
    document.addEventListener("pointerup", pointerEnd, true);
    document.addEventListener("pointercancel", pointerCancel, true);
    document.addEventListener("lostpointercapture", lostCapture, true);
    document.addEventListener("touchstart", secondTouch, {
      capture: true,
      passive: true,
    });
    window.addEventListener("blur", interrupt);
    window.addEventListener("pagehide", interrupt);
    window.addEventListener("orientationchange", interrupt);
    window.addEventListener("resize", interrupt);
    document.addEventListener("visibilitychange", visibility);
  }
  function removeTracking() {
    document.removeEventListener("pointermove", pointerMove, { capture: true });
    document.removeEventListener("pointerup", pointerEnd, { capture: true });
    document.removeEventListener("pointercancel", pointerCancel, {
      capture: true,
    });
    document.removeEventListener("lostpointercapture", lostCapture, {
      capture: true,
    });
    document.removeEventListener("touchstart", secondTouch, { capture: true });
    window.removeEventListener("blur", interrupt);
    window.removeEventListener("pagehide", interrupt);
    window.removeEventListener("orientationchange", interrupt);
    window.removeEventListener("resize", interrupt);
    document.removeEventListener("visibilitychange", visibility);
  }
  const drag = (event: DragEvent) => event.preventDefault();
  element.addEventListener("pointerdown", pointerDown, true);
  element.addEventListener("touchstart", touchStart, captureOptions);
  element.addEventListener("touchmove", touchMove, captureOptions);
  element.addEventListener("touchend", touchEnd, true);
  element.addEventListener("touchcancel", touchEnd, true);
  element.addEventListener("click", click, true);
  element.addEventListener("dragstart", drag);
  return () => {
    finish("démontage");
    removeTracking();
    element.removeEventListener("pointerdown", pointerDown, { capture: true });
    element.removeEventListener("touchstart", touchStart, { capture: true });
    element.removeEventListener("touchmove", touchMove, { capture: true });
    element.removeEventListener("touchend", touchEnd, { capture: true });
    element.removeEventListener("touchcancel", touchEnd, { capture: true });
    element.removeEventListener("click", click, { capture: true });
    element.removeEventListener("dragstart", drag);
  };
}
