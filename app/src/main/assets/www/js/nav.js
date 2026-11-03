// Pure D-pad focus search. rects: [{id, x, y, w, h}] in any shared coordinate space.
// Returns the id to focus next, or currentId when nothing lies in that direction.

const EPS = 1;

export function nextFocus(rects, currentId, dir) {
  const cur = rects.find((r) => r.id === currentId);
  if (!cur) return currentId;

  const cx = cur.x + cur.w / 2;
  const cy = cur.y + cur.h / 2;
  let best = null;

  for (const r of rects) {
    if (r.id === currentId) continue;
    const dx = r.x + r.w / 2 - cx;
    const dy = r.y + r.h / 2 - cy;

    let primary;
    let cross;
    if (dir === "right") { primary = dx; cross = Math.abs(dy); }
    else if (dir === "left") { primary = -dx; cross = Math.abs(dy); }
    else if (dir === "down") { primary = dy; cross = Math.abs(dx); }
    else if (dir === "up") { primary = -dy; cross = Math.abs(dx); }
    else return currentId;

    if (primary <= EPS) continue; // not in that direction

    const score = primary + cross * 2;
    if (!best || score < best.score || (score === best.score && cross < best.cross)) {
      best = { id: r.id, score, cross };
    }
  }
  return best ? best.id : currentId;
}
