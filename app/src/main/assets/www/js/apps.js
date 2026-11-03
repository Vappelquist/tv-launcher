import { nextFocus } from "./nav.js";
import { getApps, launch, iconUrl } from "./native.js";

const KEY_DIRS = {
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowUp: "up",
  ArrowDown: "down",
};

let container = null;
let currentPkg = null;

function tiles() {
  return [...container.querySelectorAll(".tile")];
}

function focusTile(el) {
  if (!el) return;
  currentPkg = el.dataset.pkg;
  el.focus({ preventScroll: true });
  el.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
}

export async function renderApps() {
  const apps = await getApps();
  const previous = currentPkg;
  container.replaceChildren();

  if (apps.length === 0) {
    const msg = document.createElement("div");
    msg.className = "empty";
    msg.textContent = "No apps found";
    container.append(msg);
    return;
  }

  for (const app of apps) {
    const el = document.createElement("button");
    el.className = "tile";
    el.dataset.pkg = app.pkg;
    el.innerHTML = `<img alt="" draggable="false"><span></span>`;
    el.querySelector("img").src = iconUrl(app.pkg);
    el.querySelector("span").textContent = app.label;
    el.addEventListener("click", () => launch(app.pkg));
    container.append(el);
  }

  const keep = tiles().find((t) => t.dataset.pkg === previous);
  focusTile(keep ?? tiles()[0]);
}

export function mountApps(el) {
  container = el;

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" || e.key === "Backspace" || e.key === "GoBack") {
      e.preventDefault(); // Back never leaves the launcher
      return;
    }
    const dir = KEY_DIRS[e.key];
    const list = tiles();
    if (!dir || list.length === 0) return;
    e.preventDefault();

    const rects = list.map((t) => {
      const r = t.getBoundingClientRect();
      return { id: t.dataset.pkg, x: r.x, y: r.y, w: r.width, h: r.height };
    });
    const next = nextFocus(rects, currentPkg ?? list[0].dataset.pkg, dir);
    focusTile(list.find((t) => t.dataset.pkg === next));
  });

  // If focus is lost (e.g. window regains focus), put it back on the grid.
  window.addEventListener("focus", () => {
    const list = tiles();
    focusTile(list.find((t) => t.dataset.pkg === currentPkg) ?? list[0]);
  });

  return renderApps();
}
