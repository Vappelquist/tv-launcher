import config from "../config.js";
import { nextFocus } from "./nav.js";
import { nextLevel } from "./level.js";
import { pickPinned } from "./pinned.js";
import { getApps, launch, iconUrl } from "./native.js";

const KEY_DIRS = {
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowUp: "up",
  ArrowDown: "down",
};

let island = null;
let drawer = null;
let level = "hidden"; // hidden | island | drawer
let currentPkg = null;

const activeContainer = () => (level === "island" ? island : level === "drawer" ? drawer : null);
const tilesIn = (c) => (c ? [...c.querySelectorAll(".tile")] : []);

function tileEl(app) {
  const el = document.createElement("button");
  el.className = "tile";
  el.dataset.pkg = app.pkg;
  el.innerHTML = `<img alt="" draggable="false"><span></span>`;
  el.querySelector("img").src = iconUrl(app.pkg);
  el.querySelector("span").textContent = app.label;
  el.addEventListener("click", () => launch(app.pkg));
  return el;
}

function focusTile(el) {
  if (!el) return;
  currentPkg = el.dataset.pkg;
  el.focus({ preventScroll: true });
  el.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
}

function setLevel(next) {
  level = next;
  document.body.dataset.level = next;
  const c = activeContainer();
  if (!c) {
    document.activeElement?.blur?.();
    return;
  }
  const list = tilesIn(c);
  focusTile(list.find((t) => t.dataset.pkg === currentPkg) ?? list[0]);
}

function isTopRow() {
  const list = tilesIn(drawer);
  const cur = list.find((t) => t.dataset.pkg === currentPkg);
  if (!cur || list.length === 0) return true;
  const top = Math.min(...list.map((t) => t.getBoundingClientRect().y));
  return cur.getBoundingClientRect().y - top < 4;
}

export function goBack() {
  const r = nextLevel(level, "Back");
  if (r.handled) setLevel(r.level);
}

export async function renderApps() {
  const apps = await getApps();

  island.replaceChildren(...pickPinned(apps, config.pinned).map(tileEl));
  if (apps.length === 0) {
    const msg = document.createElement("div");
    msg.className = "empty";
    msg.textContent = "No apps found";
    drawer.replaceChildren(msg);
  } else {
    drawer.replaceChildren(...apps.map(tileEl));
  }
  if (activeContainer()) setLevel(level); // keep focus after a refresh
}

export function mountApps(islandEl, drawerEl) {
  island = islandEl;
  drawer = drawerEl;

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" || e.key === "Backspace" || e.key === "GoBack") {
      e.preventDefault(); // Back never leaves the launcher; it closes the island instead
      goBack();
      return;
    }
    const dir = KEY_DIRS[e.key];
    if (!dir) return;
    e.preventDefault();

    const r = nextLevel(level, e.key, { atTopRow: level === "drawer" && isTopRow() });
    if (r.handled) {
      // No pinned apps found: skip the empty island and open the full list.
      const empty = r.level === "island" && tilesIn(island).length === 0;
      setLevel(empty ? "drawer" : r.level);
      return;
    }

    const list = tilesIn(activeContainer());
    if (list.length === 0) return;
    const rects = list.map((t) => {
      const b = t.getBoundingClientRect();
      return { id: t.dataset.pkg, x: b.x, y: b.y, w: b.width, h: b.height };
    });
    const next = nextFocus(rects, currentPkg ?? list[0].dataset.pkg, dir);
    focusTile(list.find((t) => t.dataset.pkg === next));
  });

  return renderApps();
}
