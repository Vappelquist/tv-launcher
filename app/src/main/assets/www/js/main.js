import config from "../config.js";
import { mountApps, renderApps } from "./apps.js";

const root = document.documentElement;
root.style.setProperty("--blur", `${config.blurPx}px`);
document.body.classList.toggle("perf", config.performanceMode);
document.getElementById("wall").style.backgroundImage = `url("${config.wallpaper}")`;

await mountApps(document.getElementById("apps"));

// Kotlin calls this on resume so newly installed / removed apps show up.
window.refreshApps = () => renderApps();
