export type DropPoint = { x: number; y: number };
export type DropRect = { left: number; top: number; right: number; bottom: number };
export type ClueTarget = { position: number; rect: DropRect; occupied: boolean };

function contains(rect: DropRect, point: DropPoint) {
  return Number.isFinite(point.x) && Number.isFinite(point.y) &&
    point.x >= rect.left && point.x <= rect.right &&
    point.y >= rect.top && point.y <= rect.bottom;
}

/** All coordinates are viewport coordinates, measured from the rendered objects.
 * A corner pickup must also work when the piece, rather than the finger, is in
 * its frame. An explicit contact over a wrong/occupied frame still wins, so the
 * puzzle never silently corrects a wrong drop to a neighbouring frame.
 */
export function findClueDrop(
  contact: DropPoint,
  pieceCenter: DropPoint | null,
  targets: readonly ClueTarget[],
  viewport: DropRect,
) {
  if (!contains(viewport, contact)) return null;
  const direct = targets.find(target => contains(target.rect, contact));
  if (direct) return { ...direct, via: 'contact' as const };
  if (!pieceCenter || !contains(viewport, pieceCenter)) return null;
  const visual = targets.find(target => contains(target.rect, pieceCenter));
  return visual ? { ...visual, via: 'piece' as const } : null;
}
