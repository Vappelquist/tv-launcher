// The UI is designed on a 1920x1080 canvas. Android TV WebViews often report a smaller
// CSS viewport (e.g. 1280x720 or 960x540), so we scale that canvas to fit instead of
// letting it overflow. Returns the scale and the offset that centers the canvas.

export const DESIGN_W = 1920;
export const DESIGN_H = 1080;

export function fitScale(vw, vh, designW = DESIGN_W, designH = DESIGN_H) {
  if (!Number.isFinite(vw) || !Number.isFinite(vh) || vw <= 0 || vh <= 0) {
    return { scale: 1, x: 0, y: 0 };
  }
  const scale = Math.min(vw / designW, vh / designH);
  return { scale, x: (vw - designW * scale) / 2, y: (vh - designH * scale) / 2 };
}

export function applyFit(root = document.documentElement) {
  const { scale, x, y } = fitScale(window.innerWidth, window.innerHeight);
  root.style.setProperty("--ui-scale", String(scale));
  root.style.setProperty("--ui-x", `${x}px`);
  root.style.setProperty("--ui-y", `${y}px`);
}
