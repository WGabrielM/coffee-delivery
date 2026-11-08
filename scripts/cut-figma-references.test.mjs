// Guards the script that cuts the four design frames out of the Figma export (spec 029).
import assert from "node:assert/strict";
import { test } from "node:test";

import { FRAME_NAMES, findFrames, missingExportMessage } from "./cut-figma-references.mjs";

const CANVAS = [30, 30, 30, 255];
const PAPER = [250, 250, 250, 255];
const INK = [200, 60, 60, 255];

/** An RGBA image of the canvas color with the given rectangles painted on it. */
function image(width, height, rectangles) {
  const rgba = new Uint8Array(width * height * 4);
  for (let index = 0; index < width * height; index += 1) rgba.set(CANVAS, index * 4);
  for (const { x, y, w, h, color } of rectangles) {
    for (let row = y; row < y + h; row += 1) {
      for (let column = x; column < x + w; column += 1) rgba.set(color, (row * width + column) * 4);
    }
  }
  return { rgba, width, height };
}

test("the frames are the four names of the design, in the order of the export", () => {
  assert.deepEqual(FRAME_NAMES, ["home", "checkout", "checkout-filled", "success"]);
});

test("findFrames returns the box of each frame, left to right, whatever is inside it", () => {
  const { rgba, width, height } = image(1000, 400, [
    { x: 20, y: 30, w: 200, h: 300, color: PAPER },
    { x: 20, y: 100, w: 50, h: 40, color: INK },
    { x: 260, y: 30, w: 200, h: 120, color: PAPER },
    { x: 500, y: 30, w: 200, h: 120, color: PAPER },
    { x: 740, y: 30, w: 200, h: 120, color: PAPER },
  ]);

  const frames = findFrames(rgba, width, height, 4);

  assert.deepEqual(frames, [
    { x: 20, y: 30, width: 200, height: 300 },
    { x: 260, y: 30, width: 200, height: 120 },
    { x: 500, y: 30, width: 200, height: 120 },
    { x: 740, y: 30, width: 200, height: 120 },
  ]);
});

test("findFrames fails with a clear message when the export does not have four frames", () => {
  const { rgba, width, height } = image(300, 200, [{ x: 10, y: 10, w: 100, h: 100, color: PAPER }]);

  assert.throws(
    () => findFrames(rgba, width, height, 4),
    /Found 1 frame\(s\) in the export, expected 4/,
  );
});

test("the message for a missing export says what it is and where to put it", () => {
  const message = missingExportMessage("docs/design/image-frames.png");

  assert.match(message, /docs\/design\/image-frames\.png/);
  assert.match(message, /export of the four frames/);
  assert.match(message, /not committed/);
});
