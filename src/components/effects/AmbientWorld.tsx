import type { CSSProperties } from "react";
export function AmbientWorld({
  theme,
}: {
  theme: "birthday" | "proposal" | "party";
}) {
  return (
    <div className={`ambient-world world-${theme}`} aria-hidden="true">
      {Array.from({ length: 8 }, (_, i) => (
        <svg
          key={i}
          data-ambient
          viewBox="0 0 100 100"
          style={
            {
              left: `${[3, 87, 12, 81, 4, 91, 25, 73][i]}%`,
              top: `${5 + i * 12}%`,
              "--float-duration": `${7 + i * 1.7}s`,
              "--float-delay": `${-i * 2.3}s`,
              "--float-y": `${-8 - i * 2}px`,
              "--float-start": `${-2 - i}deg`,
              "--float-end": `${2 + i}deg`,
            } as CSSProperties
          }
        >
          {theme === "birthday" && i % 3 === 0 ? (
            <path
              d="M15 61C2 41 19 29 33 33c3-27 38-24 41 0 26-3 30 33 5 35H25Z"
              fill="currentColor"
            />
          ) : theme === "birthday" && i % 3 === 1 ? (
            <>
              <path
                d="M50 15v72m0-20Q17 45 22 66q11 12 28 1"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
              />
              <path
                d="M50 18c-22-27-42 7-20 18-23 13-4 41 17 21 15 27 42 4 24-13 24-14 2-43-21-26Z"
                fill="currentColor"
              />
            </>
          ) : theme === "party" && i % 2 === 0 ? (
            <>
              <circle
                cx="50"
                cy="50"
                r="32"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M20 50h60M50 18v64M26 30l50 40m-50 0 50-40"
                stroke="currentColor"
                strokeWidth="2"
              />
            </>
          ) : (
            <path
              d="m50 9 10 30 31 11-31 11-10 30-10-30L9 50l31-11Z"
              fill="currentColor"
            />
          )}
        </svg>
      ))}
      <div className="music-beat" data-ambient />
    </div>
  );
}
