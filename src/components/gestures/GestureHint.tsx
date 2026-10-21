export function GestureHint({
  kind = "swipe",
  done = false,
  label,
}: {
  kind?: "swipe" | "pull" | "hold" | "rub" | "drag";
  done?: boolean;
  label: string;
}) {
  if (done) return null;
  return (
    <div
      className={`gesture-hint hint-${kind}`}
      aria-hidden="true"
      data-ambient
    >
      <svg viewBox="0 0 110 50" fill="none">
        <path
          className="hint-path"
          d={
            kind === "pull" ? "M55 38V8m-8 8 8-8 8 8" : "M20 25h70m-8-7 8 7-8 7"
          }
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <g className="hint-hand">
          <path
            d="M49 36V22a4 4 0 0 1 8 0v5c12-4 17 3 12 13l-3 6H53l-8-10a3 3 0 0 1 4-4Z"
            fill="var(--gesture-paper,#fff7e8)"
            stroke="currentColor"
            strokeWidth="1.4"
          />
          <circle
            cx="53"
            cy="19"
            r="8"
            stroke="currentColor"
            strokeOpacity=".3"
          />
        </g>
      </svg>
      <span>{label}</span>
    </div>
  );
}
