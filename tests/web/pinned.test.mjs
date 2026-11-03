import test from "node:test";
import assert from "node:assert/strict";
import { pickPinned } from "../../app/src/main/assets/www/js/pinned.js";

const app = (pkg, label) => ({ pkg, label });

test("keeps the order of the requested names", () => {
  const apps = [app("n", "Netflix"), app("s", "Spotify"), app("y", "YouTube")];
  const out = pickPinned(apps, ["Spotify", "YouTube", "Netflix"]);
  assert.deepEqual(out.map((a) => a.pkg), ["s", "y", "n"]);
});

test("an exact label match beats a partial one", () => {
  const apps = [app("yk", "YouTube Kids"), app("y", "YouTube")];
  assert.deepEqual(pickPinned(apps, ["YouTube"]).map((a) => a.pkg), ["y"]);
});

test("falls back to a partial, case-insensitive match", () => {
  const apps = [app("d", "Disney+ Hotstar")];
  assert.deepEqual(pickPinned(apps, ["disney+"]).map((a) => a.pkg), ["d"]);
});

test("names with no matching app are skipped", () => {
  const apps = [app("s", "Spotify")];
  assert.deepEqual(pickPinned(apps, ["Crunchyroll", "Spotify"]).map((a) => a.pkg), ["s"]);
});

test("the same app is never pinned twice", () => {
  const apps = [app("y", "YouTube")];
  assert.deepEqual(pickPinned(apps, ["YouTube", "youtube"]).map((a) => a.pkg), ["y"]);
});
