import type { ReactNode } from "react";
import { GestureSurface } from "./GestureSurface";

/** A dedicated, gated navigation zone; it never listens on the scene or gallery. */
export function SwipeAdvance({
  ready,
  onNext,
  children,
}: {
  ready: boolean;
  onNext: () => void;
  children: ReactNode;
}) {
  return (
    <GestureSurface
      className="chapter-advance"
      axis="x"
      direction={-1}
      threshold={64}
      disabled={!ready}
      onCommit={onNext}
    >
      <div className="gesture-object">{children}</div>
      {ready && (
        <span className="chapter-swipe-label" aria-hidden="true">
          ← Glisser pour continuer
        </span>
      )}
    </GestureSurface>
  );
}
