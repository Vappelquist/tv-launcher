import config from "../config.js";
import { applyFit } from "./fit.js";
import { mountApps, renderApps, goBack } from "./apps.js";
import { onNowPlaying } from "./native.js";
import { mount as mountClock } from "../widgets/clock.js";
import { mount as mountNowPlaying, viewState } from "../widgets/nowplaying.js";

applyFit();
window.addEventListener("resize", () => applyFit());

document.documentElement.style.setProperty("--blur", `${config.blurPx}px`);
document.body.classList.toggle("perf", config.performanceMode);
document.getElementById("wall").style.backgroundImage = `url("${config.wallpaper}")`;

mountClock(document.getElementById("clock"));
const stage = mountNowPlaying(document.getElementById("stage"));

// Blurred album art fills the background while music plays; the last image is kept
// during the fade-out so the way back to the wallpaper is smooth.
const art = document.getElementById("art");
onNowPlaying((np) => {
  const s = viewState(np);
  if (s.showArt) art.style.backgroundImage = `url("${np.artUrl}")`;
  document.body.classList.toggle("playing", s.showArt);
  stage.onNowPlaying(np);
});

await mountApps(document.getElementById("island"), document.getElementById("drawer"));

// Kotlin calls these: on resume (new / removed apps) and when the remote's Back is pressed.
window.refreshApps = () => renderApps();
window.onBack = () => goBack();
