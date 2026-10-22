import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { observeContact } from "./contact";

/** Transport unit tests only. Real pointer/touch and rendering are tested in E2E. */
class ElementStub extends EventTarget {
  capture = new Set<number>();
  constructor(
    readonly button = false,
    readonly parent: ElementStub | null = null,
  ) {
    super();
  }
  closest(selector: string): ElementStub | null {
    if (selector === "[data-gesture-ignore]") return null;
    if (selector === "[data-gesture-input]") return this.parent || this;
    if (selector === "button, a") return this.button ? this : null;
    return null;
  }
  setPointerCapture(id: number) {
    this.capture.add(id);
  }
  hasPointerCapture(id: number) {
    return this.capture.has(id);
  }
  releasePointerCapture(id: number) {
    this.capture.delete(id);
  }
}
let element: ElementStub,
  button: ElementStub,
  doc: EventTarget & { hidden: boolean },
  win: EventTarget;
let off: () => void;
function emit(
  target: EventTarget,
  type: string,
  props: Record<string, unknown> = {},
) {
  const event = new Event(type, { cancelable: true });
  for (const [key, value] of Object.entries(props))
    Object.defineProperty(event, key, { value, configurable: true });
  target.dispatchEvent(event);
  return event;
}
const pointer = (extra: Record<string, unknown> = {}) => ({
  target: button,
  pointerId: 1,
  pointerType: "touch",
  isPrimary: true,
  button: 0,
  clientX: 100,
  clientY: 100,
  ...extra,
});
const touch = (type: string, x = 100, y = 100) =>
  emit(element, type, {
    target: button,
    touches:
      type === "touchend" || type === "touchcancel"
        ? []
        : [{ identifier: 7, clientX: x, clientY: y }],
    changedTouches: [{ identifier: 7, clientX: x, clientY: y }],
  });
beforeEach(() => {
  vi.useFakeTimers();
  element = new ElementStub();
  button = new ElementStub(true, element);
  doc = Object.assign(new EventTarget(), { hidden: false });
  win = Object.assign(new EventTarget(), { setTimeout });
  vi.stubGlobal("Element", ElementStub);
  vi.stubGlobal("document", doc);
  vi.stubGlobal("window", win);
  vi.stubGlobal("location", { search: "" });
});
afterEach(() => {
  off?.();
  vi.runAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
describe("Propriétaire du contact", () => {
  it('associe le pointeur au même contact si touchstart arrive en premier',()=>{
    const start=vi.fn(),end=vi.fn();off=observeContact(element as unknown as HTMLElement,()=>({axis:'both',start,end}));
    touch('touchstart');emit(element,'pointerdown',pointer());expect(button.hasPointerCapture(1)).toBe(true);
    touch('touchmove',140,80);emit(doc,'pointerup',pointer({clientX:140,clientY:80}));touch('touchend',140,80);
    expect(start).toHaveBeenCalledOnce();expect(end).toHaveBeenCalledOnce();
  });
  it("capture le contrôle dès pointerdown et conserve le tap natif", () => {
    const end = vi.fn();
    off = observeContact(element as unknown as HTMLElement, () => ({
      axis: "x",
      end,
    }));
    emit(element, "pointerdown", pointer());
    expect(button.hasPointerCapture(1)).toBe(true);
    emit(doc, "pointerup", pointer());
    expect(end).toHaveBeenCalledOnce();
    expect(end.mock.calls[0][0].intent).toBe("wait");
    expect(emit(element, "click", { detail: 1 }).defaultPrevented).toBe(false);
  });
  it("attribue le tactile à Touch Events et termine une seule fois malgré pointerup", () => {
    const start = vi.fn(),
      move = vi.fn(),
      end = vi.fn();
    off = observeContact(element as unknown as HTMLElement, () => ({
      axis: "x",
      start,
      move,
      end,
    }));
    emit(element, "pointerdown", pointer());
    touch("touchstart");
    emit(doc, "pointermove", pointer({ clientX: 40 }));
    touch("touchmove", 40, 100);
    emit(doc, "pointerup", pointer({ clientX: 40 }));
    touch("touchend", 40, 100);
    expect(start).toHaveBeenCalledOnce();
    expect(end).toHaveBeenCalledOnce();
    expect(move.mock.calls.every((call) => call[0].source === "touch")).toBe(
      true,
    );
    expect(end.mock.calls[0][0].dx).toBe(-60);
  });
  it("continue le flux touch après pointercancel sans déclencher deux actions", () => {
    const end = vi.fn(),
      cancel = vi.fn();
    off = observeContact(element as unknown as HTMLElement, () => ({
      axis: "both",
      end,
      cancel,
    }));
    emit(element, "pointerdown", pointer());
    touch("touchstart");
    emit(doc, "pointercancel", pointer());
    touch("touchmove", 120, 45);
    touch("touchend", 120, 45);
    expect(cancel).not.toHaveBeenCalled();
    expect(end).toHaveBeenCalledOnce();
  });
  it("laisse le scroll vertical natif gagner sur une carte horizontale", () => {
    const end = vi.fn(),
      cancel = vi.fn();
    off = observeContact(element as unknown as HTMLElement, () => ({
      axis: "x",
      end,
      cancel,
    }));
    emit(element, "pointerdown", pointer());
    touch("touchstart");
    expect(touch("touchmove", 103, 160).defaultPrevented).toBe(false);
    touch("touchend", 103, 160);
    expect(end).not.toHaveBeenCalled();
    expect(cancel).toHaveBeenCalledOnce();
  });
  it("empêche le pan uniquement sur une traction verticale acceptée", () => {
    const end = vi.fn();
    off = observeContact(element as unknown as HTMLElement, () => ({
      axis: "y",
      end,
    }));
    emit(element, "pointerdown", pointer());
    touch("touchstart");
    expect(touch("touchmove", 102, 40).defaultPrevented).toBe(true);
    touch("touchend", 102, 40);
    expect(end).toHaveBeenCalledOnce();
  });
  it("annule un pointeur souris qui perd sa capture", () => {
    const end = vi.fn(),
      cancel = vi.fn();
    off = observeContact(element as unknown as HTMLElement, () => ({
      axis: "both",
      end,
      cancel,
    }));
    emit(element, "pointerdown", pointer({ pointerType: "mouse" }));
    emit(doc, "lostpointercapture", pointer({ target: button }));
    emit(doc, "pointerup", pointer());
    expect(end).not.toHaveBeenCalled();
    expect(cancel).toHaveBeenCalledOnce();
  });
  it("annule touchcancel et ne valide pas après interruption", () => {
    const end = vi.fn(),
      cancel = vi.fn();
    off = observeContact(element as unknown as HTMLElement, () => ({
      axis: "both",
      end,
      cancel,
    }));
    emit(element, "pointerdown", pointer());
    touch("touchstart");
    touch("touchmove", 180, 100);
    touch("touchcancel");
    touch("touchend");
    expect(end).not.toHaveBeenCalled();
    expect(cancel).toHaveBeenCalledOnce();
  });
  it("annule les contacts multiples", () => {
    const cancel = vi.fn();
    off = observeContact(element as unknown as HTMLElement, () => ({
      axis: "both",
      cancel,
    }));
    emit(element, "pointerdown", pointer());
    touch("touchstart");
    emit(doc, "touchstart", { touches: [{}, {}] });
    expect(cancel).toHaveBeenCalledOnce();
  });
  it("annule à la mise en arrière-plan puis nettoie les événements", () => {
    const end = vi.fn(),
      cancel = vi.fn();
    off = observeContact(element as unknown as HTMLElement, () => ({
      axis: "both",
      end,
      cancel,
    }));
    emit(element, "pointerdown", pointer());
    doc.hidden = true;
    emit(doc, "visibilitychange");
    expect(cancel).toHaveBeenCalledOnce();
    off();
    emit(element, "pointerdown", pointer());
    emit(doc, "pointerup", pointer());
    expect(end).not.toHaveBeenCalled();
  });
  it("supprime le clic de compatibilité même si le contrôle est remplacé, et conserve le clavier", () => {
    off = observeContact(element as unknown as HTMLElement, () => ({
      axis: "both",
    }));
    emit(element, "pointerdown", pointer());
    touch("touchstart");
    touch("touchmove", 160, 100);
    touch("touchend", 160, 100);
    expect(
      emit(doc, "click", { detail: 0, clientX: 160, clientY: 100 })
        .defaultPrevented,
    ).toBe(false);
    expect(
      emit(doc, "click", { detail: 1, clientX: 160, clientY: 100 })
        .defaultPrevented,
    ).toBe(true);
  });
});
