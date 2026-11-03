import test from "node:test";
import assert from "node:assert/strict";
import { nextFocus } from "../../app/src/main/assets/www/js/nav.js";

const box = (id, x, y) => ({ id, x, y, w: 100, h: 100 });

test("right moves to the nearest item in the same row", () => {
  const rects = [box("a", 0, 0), box("b", 150, 0), box("c", 300, 0)];
  assert.equal(nextFocus(rects, "a", "right"), "b");
});

test("left from the first item stays on it", () => {
  const rects = [box("a", 0, 0), box("b", 150, 0)];
  assert.equal(nextFocus(rects, "a", "left"), "a");
});

test("down with no row below stays on the current item", () => {
  const rects = [box("a", 0, 0), box("b", 150, 0)];
  assert.equal(nextFocus(rects, "a", "down"), "a");
});

test("when two items are equally far, the smaller vertical offset wins", () => {
  const rects = [box("cur", 0, 0), box("far", 150, 40), box("near", 150, 10)];
  assert.equal(nextFocus(rects, "cur", "right"), "near");
});

test("up and down move between rows", () => {
  const rects = [box("a", 0, 0), box("b", 0, 150)];
  assert.equal(nextFocus(rects, "a", "down"), "b");
  assert.equal(nextFocus(rects, "b", "up"), "a");
});

test("unknown current id returns it unchanged", () => {
  assert.equal(nextFocus([box("a", 0, 0)], "zzz", "right"), "zzz");
});
