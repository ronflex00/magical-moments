import {
  useEffect,
  useRef,
  type CSSProperties,
  type PointerEvent,
  type ReactNode,
} from "react";

export type GestureAxis = "x" | "y" | "both";
export function gestureIntent(
  dx: number,
  dy: number,
  axis: GestureAxis,
): "wait" | "accept" | "scroll" {
  if (Math.hypot(dx, dy) < 8) return "wait";
  if (axis === "x" && Math.abs(dy) > Math.abs(dx) * 1.15) return "scroll";
  if (axis === "y" && Math.abs(dx) > Math.abs(dy) * 1.6) return "scroll";
  return "accept";
}
export function GestureSurface({
  children,
  axis = "x",
  direction = 0,
  threshold = 64,
  onCommit,
  onDrop,
  onHold,
  holdMs = 750,
  disabled = false,
  className = "",
  style,
}: {
  children: ReactNode;
  axis?: GestureAxis;
  direction?: number;
  threshold?: number;
  onCommit?: (direction: number) => void;
  onDrop?: (x: number, y: number) => void;
  onHold?: () => void;
  holdMs?: number;
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const active = useRef<{
    id: number;
    x: number;
    y: number;
    dx: number;
    dy: number;
    locked: boolean;
    consumed: boolean;
    start: number;
  } | null>(null);
  const frame = useRef(0),
    hold = useRef(0),
    suppress = useRef(false);
  const options = useRef({ onCommit, onDrop, onHold });
  options.current = { onCommit, onDrop, onHold };
  const node = useRef<HTMLDivElement>(null);
  useEffect(
    () => () => {
      cancelAnimationFrame(frame.current);
      cancelAnimationFrame(hold.current);
      active.current = null;
    },
    [],
  );
  function reset() {
    cancelAnimationFrame(frame.current);
    cancelAnimationFrame(hold.current);
    if (node.current) {
      node.current.dataset.dragging = "false";
      node.current.style.setProperty("--drag-x", "0px");
      node.current.style.setProperty("--drag-y", "0px");
      node.current.style.setProperty("--gesture-progress", "0");
      node.current.style.setProperty("--hold-progress", "0");
    }
  }
  function down(event: PointerEvent<HTMLDivElement>) {
    if (
      disabled ||
      active.current ||
      (event.pointerType === "mouse" && event.button !== 0)
    )
      return;
    suppress.current = false;
    active.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      dx: 0,
      dy: 0,
      locked: false,
      consumed: false,
      start: performance.now(),
    };
    if (onHold) {
      const tick = () => {
        const a = active.current;
        if (!a || a.locked) return;
        const progress = Math.min(1, (performance.now() - a.start) / holdMs);
        node.current?.style.setProperty("--hold-progress", String(progress));
        if (progress >= 1) {
          a.consumed = true;
          suppress.current = true;
          options.current.onHold?.();
        } else hold.current = requestAnimationFrame(tick);
      };
      hold.current = requestAnimationFrame(tick);
    }
  }
  function move(event: PointerEvent<HTMLDivElement>) {
    const a = active.current;
    if (!a || a.id !== event.pointerId) return;
    a.dx = event.clientX - a.x;
    a.dy = event.clientY - a.y;
    const intent = gestureIntent(a.dx, a.dy, axis);
    if (intent === "wait") return;
    cancelAnimationFrame(hold.current);
    if (intent === "scroll" && !a.locked) {
      active.current = null;
      reset();
      return;
    }
    if (!a.locked) {
      a.locked = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    suppress.current = true;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const n = node.current;
      if (!n) return;
      n.dataset.dragging = "true";
      n.style.setProperty(
        "--drag-x",
        `${axis === "y" ? 0 : Math.max(-260, Math.min(260, a.dx))}px`,
      );
      n.style.setProperty(
        "--drag-y",
        `${axis === "x" ? 0 : Math.max(-300, Math.min(300, a.dy))}px`,
      );
      const distance =
        axis === "x" ? a.dx : axis === "y" ? a.dy : Math.hypot(a.dx, a.dy);
      n.style.setProperty(
        "--gesture-progress",
        String(
          Math.max(
            0,
            Math.min(
              1,
              (direction ? distance * direction : Math.abs(distance)) /
                threshold,
            ),
          ),
        ),
      );
    });
  }
  function end(event: PointerEvent<HTMLDivElement>, cancelled = false) {
    const a = active.current;
    if (!a || a.id !== event.pointerId) return;
    active.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
    reset();
    if (cancelled || a.consumed || !a.locked) return;
    if (options.current.onDrop) {
      options.current.onDrop(event.clientX, event.clientY);
      return;
    }
    const distance =
      axis === "x" ? a.dx : axis === "y" ? a.dy : Math.hypot(a.dx, a.dy);
    if (
      Math.abs(distance) >= threshold &&
      (!direction || distance * direction > 0)
    )
      options.current.onCommit?.(Math.sign(distance));
  }
  return (
    <div
      ref={node}
      className={`gesture-surface ${className}`}
      data-axis={axis}
      style={style}
      onDragStart={(event) => event.preventDefault()}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={(event) => end(event)}
      onPointerCancel={(event) => end(event, true)}
      onLostPointerCapture={(event) => {
        if (
          event.target === event.currentTarget &&
          active.current?.id === event.pointerId &&
          !event.currentTarget.hasPointerCapture(event.pointerId)
        ) {
          active.current = null;
          reset();
        }
      }}
      onContextMenu={(event) => {
        if (onHold) event.preventDefault();
      }}
      onClickCapture={(event) => {
        if (suppress.current) {
          event.preventDefault();
          event.stopPropagation();
          suppress.current = false;
        }
      }}
    >
      {children}
    </div>
  );
}
