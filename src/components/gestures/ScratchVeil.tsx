import { useEffect, useRef } from "react";
import { observeContact, type Contact } from "./contact";
import { reportGesture } from "./GestureDebug";

/** The canvas owns this contact; the enclosing button remains a keyboard option. */
export function ScratchVeil({ onReveal }: { onReveal: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null),
    latest = useRef(onReveal);
  latest.current = onReveal;
  useEffect(() => {
    const canvas = ref.current,
      ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.fillStyle = "#d8c8e5";
    ctx.fillRect(0, 0, 120, 100);
    ctx.fillStyle = "#745d86";
    ctx.font = "30px Georgia";
    ctx.textAlign = "center";
    ctx.fillText("✧", 60, 60);
    const cells = new Set<string>();
    let previous: { x: number; y: number } | null = null,
      ready = false,
      revealed = false;
    const point = (contact: Contact) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: Math.max(
          0,
          Math.min(119, ((contact.x - rect.left) / rect.width) * 120),
        ),
        y: Math.max(
          0,
          Math.min(99, ((contact.y - rect.top) / rect.height) * 100),
        ),
      };
    };
    return observeContact(canvas, () => ({
      axis: "both",
      slop: 2,
      start(contact) {
        previous = point(contact);
      },
      move(contact) {
        const current = point(contact),
          from = previous || current;
        ctx.globalCompositeOperation = "destination-out";
        ctx.lineWidth = 34;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(current.x, current.y);
        ctx.stroke();
        const steps = Math.max(
          1,
          Math.ceil(Math.hypot(current.x - from.x, current.y - from.y) / 6),
        );
        for (let i = 0; i <= steps; i++)
          cells.add(
            `${Math.floor((from.x + ((current.x - from.x) * i) / steps) / 12)},${Math.floor((from.y + ((current.y - from.y) * i) / steps) / 12)}`,
          );
        previous = current;
        ready = cells.size >= 13;
        reportGesture(
          canvas,
          "grattage",
          ready ? "zone révélée · relâcher" : "grattage accepté",
          contact.dx,
          contact.dy,
        );
      },
      end(contact) {
        previous = null;
        if (ready && !revealed && contact.intent === "accept") {
          revealed = true;
          latest.current();
        }
      },
      cancel() {
        previous = null;
      },
    }));
  }, []);
  return (
    <canvas
      ref={ref}
      width="120"
      height="100"
      className="scratch-veil"
      data-gesture-input="scratch"
      aria-hidden="true"
    />
  );
}
