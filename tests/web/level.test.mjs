import test from "node:test";
import assert from "node:assert/strict";
import { nextLevel } from "../../app/src/main/assets/www/js/level.js";

test("down from hidden shows the island", () => {
  assert.deepEqual(nextLevel("hidden", "ArrowDown", {}), { level: "island", handled: true });
});

test("up from the island hides it", () => {
  assert.deepEqual(nextLevel("island", "ArrowUp", {}), { level: "hidden", handled: true });
});

test("down from the island opens the full app list", () => {
  assert.deepEqual(nextLevel("island", "ArrowDown", {}), { level: "drawer", handled: true });
});

test("up from the top row of the app list returns to the island", () => {
  assert.deepEqual(nextLevel("drawer", "ArrowUp", { atTopRow: true }), { level: "island", handled: true });
});

test("up below the top row of the app list is left to normal focus movement", () => {
  assert.deepEqual(nextLevel("drawer", "ArrowUp", { atTopRow: false }), { level: "drawer", handled: false });
});

test("down inside the app list is left to normal focus movement", () => {
  assert.deepEqual(nextLevel("drawer", "ArrowDown", { atTopRow: true }), { level: "drawer", handled: false });
});

test("left and right never change the level", () => {
  for (const level of ["hidden", "island", "drawer"]) {
    for (const key of ["ArrowLeft", "ArrowRight"]) {
      assert.deepEqual(nextLevel(level, key, {}), { level, handled: false });
    }
  }
});

test("up while everything is hidden does nothing", () => {
  assert.deepEqual(nextLevel("hidden", "ArrowUp", {}), { level: "hidden", handled: false });
});

test("back closes one level at a time and does nothing when hidden", () => {
  assert.deepEqual(nextLevel("drawer", "Back", {}), { level: "island", handled: true });
  assert.deepEqual(nextLevel("island", "Back", {}), { level: "hidden", handled: true });
  assert.deepEqual(nextLevel("hidden", "Back", {}), { level: "hidden", handled: false });
});
