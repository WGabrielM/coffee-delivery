// Cuts the four design frames (Home, Checkout, Checkout Filled, Success) out of the export of the
// Figma file, `docs/design/image-frames.png`, into `apps/app/e2e/figma-reference/`. The export is on
// the owner's machine and is not committed; the four cut images are, so the visual checks (spec 029)
// run without it. Run it again only when the design changes: `node scripts/cut-figma-references.mjs`.
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const FRAME_NAMES = ["home", "checkout", "checkout-filled", "success"];
/** The width of every frame of the design, in px. */
export const FRAME_WIDTH = 1440;

export function missingExportMessage(path) {
  return `${path} does not exist. It is the export of the four frames of the Figma file ("Projeto" page), kept on the owner's machine and not committed. Export the frames to that file and run this script again.`;
}

const sameColor = (rgba, offset, color) =>
  rgba[offset] === color[0] && rgba[offset + 1] === color[1] && rgba[offset + 2] === color[2];

/**
 * The boxes of the frames in the export: a frame is a run of pixels that are not the canvas color.
 * The canvas is the color near the bottom middle of the export (the corners are rounded and
 * transparent). The frames are found along a row that crosses all of them (every row is tried until
 * `count` runs of at least 100 px are found), then each box is measured down and up its left edge.
 */
export function findFrames(rgba, width, height, count) {
  const at = (x, y) => (y * width + x) * 4;
  const sample = at(Math.floor(width / 2), height - 10);
  const canvas = [rgba[sample], rgba[sample + 1], rgba[sample + 2]];

  for (let row = 0; row < height; row += 1) {
    const runs = [];
    let start = -1;
    for (let column = 0; column <= width; column += 1) {
      const paper = column < width && !sameColor(rgba, at(column, row), canvas);
      if (paper && start < 0) start = column;
      if (!paper && start >= 0) {
        if (column - start >= 100) runs.push({ x: start, width: column - start });
        start = -1;
      }
    }
    if (runs.length !== count) continue;

    return runs.map(({ x, width: frameWidth }) => {
      let top = row;
      while (top > 0 && !sameColor(rgba, at(x + 1, top - 1), canvas)) top -= 1;
      let bottom = row;
      while (bottom < height - 1 && !sameColor(rgba, at(x + 1, bottom + 1), canvas)) bottom += 1;
      return { x, y: top, width: frameWidth, height: bottom - top + 1 };
    });
  }
  const found = (() => {
    let best = 0;
    for (let row = 0; row < height; row += 1) {
      let runs = 0;
      let inside = false;
      for (let column = 0; column < width; column += 1) {
        const paper = !sameColor(rgba, at(column, row), canvas);
        if (paper && !inside) runs += 1;
        inside = paper;
      }
      best = Math.max(best, runs);
    }
    return best;
  })();
  throw new Error(`Found ${found} frame(s) in the export, expected ${count}.`);
}

async function main() {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const exportPath = join(root, process.argv[2] ?? "docs/design/image-frames.png");
  if (!existsSync(exportPath)) {
    console.error(missingExportMessage(process.argv[2] ?? "docs/design/image-frames.png"));
    return 1;
  }

  const { createCanvas, loadImage } = await import("@napi-rs/canvas");
  const source = await loadImage(exportPath);
  const canvas = createCanvas(source.width, source.height);
  const context = canvas.getContext("2d");
  context.drawImage(source, 0, 0);
  const { data } = context.getImageData(0, 0, source.width, source.height);

  let frames;
  try {
    frames = findFrames(data, source.width, source.height, FRAME_NAMES.length);
  } catch (error) {
    console.error(`${error.message} Is ${exportPath} the export of the four frames?`);
    return 1;
  }
  const wrong = frames.filter((frame) => Math.abs(frame.width - FRAME_WIDTH) > 2);
  if (wrong.length > 0) {
    console.error(
      `A frame is not ${FRAME_WIDTH} px wide (${wrong.map((frame) => frame.width).join(", ")}): the export has to be at 1x.`,
    );
    return 1;
  }

  const out = join(root, "apps/app/e2e/figma-reference");
  mkdirSync(out, { recursive: true });
  frames.forEach((frame, index) => {
    const cut = createCanvas(FRAME_WIDTH, frame.height);
    cut
      .getContext("2d")
      .drawImage(
        source,
        frame.x,
        frame.y,
        FRAME_WIDTH,
        frame.height,
        0,
        0,
        FRAME_WIDTH,
        frame.height,
      );
    const file = join(out, `${FRAME_NAMES[index]}.png`);
    writeFileSync(file, cut.toBuffer("image/png"));
    console.log(`${FRAME_NAMES[index]}.png  ${FRAME_WIDTH}x${frame.height}`);
  });
  return 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(await main());
}
