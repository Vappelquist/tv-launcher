// Serves app/src/main/assets/www on localhost and screenshots the UI states.
// Usage: node scripts/preview.mjs   (writes preview-*.png in the repo root)
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const www = path.join(root, "app/src/main/assets/www");

function loadPlaywright() {
  try {
    return createRequire(import.meta.url)("playwright");
  } catch {
    const globalRoot = execSync("npm root -g").toString().trim();
    return createRequire(path.join(globalRoot, "x.js"))("playwright");
  }
}
const { chromium } = loadPlaywright();

const TYPES = {
  ".html": "text/html", ".js": "text/javascript", ".css": "text/css",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg",
};
const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://x");
  const file = path.join(www, url.pathname === "/" ? "index.html" : url.pathname);
  if (!file.startsWith(www) || !fs.existsSync(file)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { "content-type": TYPES[path.extname(file)] ?? "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, r));
const base = `http://localhost:${server.address().port}`;

const browser = await chromium.launch();
// VIEWPORT=1280x720 node scripts/preview.mjs  -> simulates a TV WebView with a smaller CSS viewport
const [VW, VH] = (process.env.VIEWPORT ?? "1920x1080").split("x").map(Number);
const SUFFIX = process.env.VIEWPORT ? `-${VW}x${VH}` : "";
const page = await browser.newPage({ viewport: { width: VW, height: VH } });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });

async function shot(name, query = "", keys = []) {
  await page.goto(`${base}/index.html${query}`);
  await page.waitForSelector("#island .tile", { state: "attached" });
  for (const k of keys) await page.keyboard.press(k);
  await page.waitForTimeout(1200); // let transitions settle
  await page.screenshot({ path: path.join(root, `preview-${name}${SUFFIX}.png`) });
  console.log("wrote", `preview-${name}${SUFFIX}.png`);
}

await shot("idle");                                   // nothing playing, island hidden
await shot("idle-island", "", ["ArrowDown"]);
await shot("idle-drawer", "", ["ArrowDown", "ArrowDown"]);
if (process.argv.includes("--playing")) {
  await shot("playing", "?mock=playing");
  await shot("playing-island", "?mock=playing", ["ArrowDown", "ArrowRight"]);
  await shot("playing-drawer", "?mock=playing", ["ArrowDown", "ArrowDown", "ArrowRight"]);
  await shot("playing-noart", "?mock=playing-noart");
}

await browser.close();
server.close();
if (errors.length) { console.error("PAGE ERRORS:\n" + errors.join("\n")); process.exit(1); }
