import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { observeContact, type Contact, type GestureAxis } from "./contact";
import { reportGesture } from "./GestureDebug";
export { gestureIntent } from "./contact";
export type { GestureAxis } from "./contact";

export function gestureThreshold(
  width: number,
  height: number,
  axis: GestureAxis,
  maximum: number,
) {
  const size =
    axis === "x" ? width : axis === "y" ? height : Math.min(width, height);
  return Math.max(18, Math.min(maximum, size * 0.28));
}
type Props = {
  children: ReactNode;
  axis?: GestureAxis;
  direction?: number;
  threshold?: number;
  onCommit?: (direction: number) => void;
  onDrop?: (x: number, y: number) => boolean | void;
  onStart?: () => void;
  onDrag?: (point: { x: number; y: number } | null) => boolean | void;
  onHold?: () => void;
  holdMs?: number;
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
};
export function GestureSurface({
  children,
  axis = "x",
  direction = 0,
  threshold = 64,
  onCommit,
  onDrop,
  onStart,
  onDrag,
  onHold,
  holdMs = 750,
  disabled = false,
  className = "",
  style,
}: Props) {
  const node = useRef<HTMLDivElement>(null);
  const options = useRef({
    axis,
    direction,
    threshold,
    onCommit,
    onDrop,
    onStart,
    onDrag,
    onHold,
    holdMs,
    disabled,
  });
  options.current = {
    axis,
    direction,
    threshold,
    onCommit,
    onDrop,
    onStart,
    onDrag,
    onHold,
    holdMs,
    disabled,
  };
  useEffect(() => {
    const element = node.current;
    if (!element) return;
    let frame = 0,
      hold = 0,
      resultTimer = 0,
      started = 0,
      limit = 64;
    let held = false,
      scrollX = 0,
      scrollY = 0;
    function reset() {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(hold);
      element!.dataset.dragging = "false";
      element!.dataset.holding = "false";
      for (const [key, value] of Object.entries({
        "--drag-x": "0px",
        "--drag-y": "0px",
        "--drag-rotation": "0deg",
        "--drag-flip": "0deg",
        "--pull-y": "0px",
        "--gesture-progress": "0",
        "--hold-progress": "0",
      }))
        element!.style.setProperty(key, value);
      options.current.onDrag?.(null);
    }
    function result(value: string) {
      element!.dataset.gestureResult = value;
      clearTimeout(resultTimer);
      resultTimer = window.setTimeout(() => {
        delete element!.dataset.gestureResult;
      }, 450);
    }
    function paint(contact: Contact) {
      const { axis, direction } = options.current;
      const dx =
          axis === "y"
            ? 0
            : contact.dx +
              (options.current.onDrop ? window.scrollX - scrollX : 0),
        dy =
          axis === "x"
            ? 0
            : contact.dy +
              (options.current.onDrop ? window.scrollY - scrollY : 0);
      const distance =
        axis === "x" ? dx : axis === "y" ? dy : Math.hypot(dx, dy);
      element!.dataset.dragging = "true";
      element!.dataset.holding = "false";
      element!.style.setProperty("--drag-x", `${dx}px`);
      element!.style.setProperty("--drag-y", `${dy}px`);
      element!.style.setProperty(
        "--drag-rotation",
        `${Math.max(-7, Math.min(7, dx * 0.045))}deg`,
      );
      element!.style.setProperty(
        "--drag-flip",
        `${Math.max(-60, Math.min(60, dx * 0.3))}deg`,
      );
      element!.style.setProperty(
        "--pull-y",
        `${Math.max(-145, Math.min(0, dy))}px`,
      );
      element!.style.setProperty(
        "--gesture-progress",
        String(
          Math.max(
            0,
            Math.min(
              1,
              (direction ? distance * direction : Math.abs(distance)) / limit,
            ),
          ),
        ),
      );
      const overTarget =
        options.current.onDrag?.({ x: contact.x, y: contact.y }) === true;
      if (options.current.onDrop && !overTarget) {
        const edge = 48,
          speed =
            contact.y < edge
              ? -Math.min(7, (edge - contact.y) / 6)
              : contact.y > innerHeight - edge
                ? Math.min(7, (contact.y - innerHeight + edge) / 6)
                : 0;
        const before = window.scrollY;
        if (speed) window.scrollBy(0, speed);
        if (window.scrollY !== before) {
          element!.style.setProperty(
            "--drag-y",
            `${contact.dy + window.scrollY - scrollY}px`,
          );
          frame = requestAnimationFrame(() => paint(contact));
        }
      }
    }
    const off = observeContact(element, () => ({
      axis: options.current.axis,
      disabled: options.current.disabled,
      start() {
        reset();
        held = false;
        scrollX = window.scrollX;
        scrollY = window.scrollY;
        started = performance.now();
        const rect = element.getBoundingClientRect();
        limit = gestureThreshold(
          rect.width,
          rect.height,
          options.current.axis,
          options.current.threshold,
        );
        options.current.onStart?.();
        if (options.current.onHold) {
          element.dataset.holding = "true";
          const tick = () => {
            const progress = Math.min(
              1,
              (performance.now() - started) / options.current.holdMs,
            );
            element.style.setProperty("--hold-progress", String(progress));
            if (progress >= 1) {
              held = true;
              element.dataset.holding = "false";
              reportGesture(element, "hold", "maintien accepté");
              result("accepted");
              options.current.onHold?.();
            } else hold = requestAnimationFrame(tick);
          };
          hold = requestAnimationFrame(tick);
        }
      },
      move(contact) {
        cancelAnimationFrame(hold);
        if (held) return;
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => paint(contact));
      },
      end(contact) {
        cancelAnimationFrame(frame);
        cancelAnimationFrame(hold);
        const current = options.current;
        if (!held && contact.intent === "accept") {
          // Keep the visual excluded from hit-testing until the drop resolves.
          paint(contact);
          const distance =
            current.axis === "x"
              ? contact.dx
              : current.axis === "y"
                ? contact.dy
                : Math.hypot(contact.dx, contact.dy);
          const accepted = current.onDrop
            ? current.onDrop(contact.x, contact.y) !== false
            : Math.abs(distance) >= limit &&
              (!current.direction || distance * current.direction > 0);
          if (accepted && !current.onDrop)
            current.onCommit?.(Math.sign(distance));
          reportGesture(
            element,
            "fin",
            accepted ? "geste accepté" : "rejeté : seuil / direction / case",
            contact.dx,
            contact.dy,
          );
          result(accepted ? "accepted" : "rejected");
        } else
          reportGesture(
            element,
            "fin",
            held ? "maintien terminé" : "tap · commande accessible",
            contact.dx,
            contact.dy,
          );
        reset();
        return held || contact.intent === "accept";
      },
      cancel() {
        reset();
        result("cancelled");
      },
    }));
    return () => {
      off();
      reset();
      clearTimeout(resultTimer);
    };
  }, []);
  return (
    <div
      ref={node}
      className={`gesture-surface ${className}`}
      data-axis={axis}
      data-disabled={disabled || undefined}
      data-gesture-input="surface"
      style={style}
      onContextMenu={(event) => {
        if (onHold) event.preventDefault();
      }}
    >
      {children}
    </div>
  );
}
