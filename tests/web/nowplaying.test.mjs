import test from "node:test";
import assert from "node:assert/strict";
import { viewState } from "../../app/src/main/assets/www/widgets/nowplaying.js";

test("playing with art shows the art", () => {
  const s = viewState({ playing: true, title: "Song", artist: "Band", artUrl: "data:image/jpeg;base64,AAAA" });
  assert.deepEqual(s, { mode: "playing", showArt: true, title: "Song", artist: "Band" });
});

test("playing without art keeps the text but no art", () => {
  const s = viewState({ playing: true, title: "Song", artist: "Band", artUrl: null });
  assert.deepEqual(s, { mode: "playing", showArt: false, title: "Song", artist: "Band" });
});

test("paused or stopped goes idle and hides art", () => {
  const s = viewState({ playing: false, title: "Song", artist: "Band", artUrl: "data:image/jpeg;base64,AAAA" });
  assert.deepEqual(s, { mode: "idle", showArt: false, title: "", artist: "" });
});

test("missing fields do not throw", () => {
  const s = viewState({ playing: true });
  assert.equal(s.mode, "playing");
  assert.equal(s.showArt, false);
  assert.equal(s.title, "");
});
