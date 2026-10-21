import { useEffect, useRef, type PointerEvent } from "react";
/** Small optional scratch surface; the enclosing button remains the keyboard alternative. */
export function ScratchVeil({ onReveal }: { onReveal: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null),
    drawing = useRef<number | null>(null),
    cells = useRef(new Set<string>()),
    moved = useRef(false);
  useEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#d8c8e5";
      ctx.fillRect(0, 0, 120, 100);
      ctx.fillStyle = "#745d86";
      ctx.font = "30px Georgia";
      ctx.textAlign = "center";
      ctx.fillText("✧", 60, 60);
    }
  }, []);
  function scratch(event: PointerEvent<HTMLCanvasElement>) {
    if (drawing.current !== event.pointerId) return;
    const canvas = event.currentTarget,
      rect = canvas.getBoundingClientRect(),
      x = ((event.clientX - rect.left) / rect.width) * 120,
      y = ((event.clientY - rect.top) / rect.height) * 100;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, 17, 0, Math.PI * 2);
    ctx.fill();
    cells.current.add(`${Math.floor(x / 12)},${Math.floor(y / 12)}`);
    moved.current = true;
    if (cells.current.size >= 13) {
      drawing.current = null;
      onReveal();
    }
  }
  return (
    <canvas
      ref={ref}
      width="120"
      height="100"
      className="scratch-veil"
      aria-hidden="true"
      onPointerDown={(event) => {
        drawing.current = event.pointerId;
        moved.current = false;
        event.currentTarget.setPointerCapture(event.pointerId);
        event.stopPropagation();
      }}
      onPointerMove={scratch}
      onPointerUp={(event) => {
        drawing.current = null;
        if (event.currentTarget.hasPointerCapture(event.pointerId))
          event.currentTarget.releasePointerCapture(event.pointerId);
      }}
      onPointerCancel={() => {
        drawing.current = null;
      }}
      onClick={(event) => {
        if (moved.current) event.stopPropagation();
      }}
    />
  );
}
