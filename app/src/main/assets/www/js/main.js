import config from "../config.js";
import { mountApps, renderApps } from "./apps.js";
import { onNowPlaying } from "./native.js";
import { mount as mountClock } from "../widgets/clock.js";
import { mount as mountNowPlaying, viewState } from "../widgets/nowplaying.js";

const root = document.documentElement;
root.style.setProperty("--blur", `${config.blurPx}px`);
document.body.classList.toggle("perf", config.performanceMode);
document.getElementById("wall").style.backgroundImage = `url("${config.wallpaper}")`;

const widgets = [
  mountClock(document.getElementById("w-clock")),
  mountNowPlaying(document.getElementById("w-now")),
];

// Album art takes over the background while music plays; the last image is kept
// during the fade-out so the transition back to the wallpaper is smooth.
const art = document.getElementById("art");
onNowPlaying((np) => {
  const s = viewState(np);
  if (s.showArt) art.style.backgroundImage = `url("${np.artUrl}")`;
  document.body.classList.toggle("playing", s.showArt);
  for (const w of widgets) w.onNowPlaying?.(np);
});

await mountApps(document.getElementById("apps"));

// Kotlin calls this on resume so newly installed / removed apps show up.
window.refreshApps = () => renderApps();
