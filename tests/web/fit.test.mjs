import test from "node:test";
import assert from "node:assert/strict";
import { fitScale } from "../../app/src/main/assets/www/js/fit.js";

const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-6, `${a} != ${b}`);

test("a 1920x1080 viewport needs no scaling", () => {
  assert.deepEqual(fitScale(1920, 1080), { scale: 1, x: 0, y: 0 });
});

test("a 960x540 viewport scales the design down by half", () => {
  assert.deepEqual(fitScale(960, 540), { scale: 0.5, x: 0, y: 0 });
});

test("a 1280x720 viewport scales to two thirds", () => {
  close(fitScale(1280, 720).scale, 2 / 3);
});

test("a 3840x2160 viewport scales up and still fills the screen", () => {
  assert.deepEqual(fitScale(3840, 2160), { scale: 2, x: 0, y: 0 });
});

test("a taller 16:10 viewport fits by width and centers vertically", () => {
  const r = fitScale(1600, 1000);
  close(r.scale, 1600 / 1920);
  close(r.x, 0);
  close(r.y, (1000 - 1080 * (1600 / 1920)) / 2);
});

test("a zero or invalid viewport falls back to scale 1", () => {
  assert.deepEqual(fitScale(0, 0), { scale: 1, x: 0, y: 0 });
  assert.deepEqual(fitScale(NaN, 720), { scale: 1, x: 0, y: 0 });
});
