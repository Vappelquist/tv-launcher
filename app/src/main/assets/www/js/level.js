// What the D-pad's up/down/back do to the island. Pure, so it is easy to test.
// levels: "hidden" (just art + clock), "island" (pinned apps), "drawer" (all apps).
// Returns { level, handled }. handled=false means the key should move focus normally.

export function nextLevel(level, key, { atTopRow = false } = {}) {
  const keep = { level, handled: false };

  if (key === "ArrowDown") {
    if (level === "hidden") return { level: "island", handled: true };
    if (level === "island") return { level: "drawer", handled: true };
    return keep;
  }
  if (key === "ArrowUp") {
    if (level === "island") return { level: "hidden", handled: true };
    if (level === "drawer" && atTopRow) return { level: "island", handled: true };
    return keep;
  }
  if (key === "Back") {
    if (level === "drawer") return { level: "island", handled: true };
    if (level === "island") return { level: "hidden", handled: true };
    return keep;
  }
  return keep;
}
