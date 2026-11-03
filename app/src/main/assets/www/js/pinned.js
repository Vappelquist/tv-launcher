// Picks the apps for the island from the installed list by label, in the order of `names`.
// An exact (case-insensitive) label match wins; otherwise the first label containing the name.

export function pickPinned(apps, names) {
  const out = [];
  const seen = new Set();
  for (const name of names) {
    const n = name.toLowerCase();
    const hit =
      apps.find((a) => a.label.toLowerCase() === n) ??
      apps.find((a) => a.label.toLowerCase().includes(n));
    if (hit && !seen.has(hit.pkg)) {
      seen.add(hit.pkg);
      out.push(hit);
    }
  }
  return out;
}
