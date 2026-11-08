# Plan 029: Visual parity with the design

- Number: 029
- Created: 2026-11-08
- Spec: [.specs/029-app-visual-parity.md](../.specs/029-app-visual-parity.md)

## Concept summary

The spec has no open question. It turns "looks like the design" into numbers: layout boxes within 2 px, at most 2% of the pixels different from the frames, and Lighthouse scores. Choices, each recorded in `adrs/app-visual-parity.md`:

1. **References.** `scripts/cut-figma-references.mjs` finds the four frames in `docs/design/image-frames.png` (the export is local to the owner and ignored by Git) and writes `home.png` (1440×2293), `checkout.png`, `checkout-filled.png`, and `success.png` (1440×1013) to `apps/app/e2e/figma-reference`, which are committed. The script fails with a clear message when the export is missing or has not four frames at 1x. The PDF is not used.
2. **State of each frame.** Home with 14 coffees and an empty cart; Checkout with Traditional Espresso × 1 and Latte × 2 put in `localStorage` (the badge is 3), an empty form, and no payment; Checkout Filled with the sample address and credit card; Success for a real order made through the API with the sample address and credit card. The window is as large as the frame, so a screenshot is exactly the frame's size.
3. **The comparison** is `pixelmatch` (color distance 0.1, anti-aliased pixels ignored) after painting the masks in both images; the share is the different pixels over the unmasked pixels. The expected, actual, and diff images are written to the test output.
4. **Masks only for text** that differs on purpose (Portuguese and reais against English and dollars), each with a comment naming the element, each the union of the text in both images plus 2 px. The cards use the grid geometry. No mask covers an image, an icon, a border, or a background (checked by looking at the masked image). Chips (not in the design) and filled input borders (the frame shows none) are not masked: they count against the 2%.
5. **Fix the deviations the check finds** in the component, small, and list them. The first run found real ones: card padding, hero position, summary row spacing, card header line height, page top, confirmation layout.
6. **Lighthouse** is `scripts/lighthouse-home.mjs` (`yarn lighthouse`): it checks the API, builds the app, serves it with Vite's `preview` in the same process (no child process to leave behind), launches the Chromium that Playwright installs through `chrome-launcher`, audits Home with the desktop preset, prints the scores and the audits that cost points, and exits 1 under 90 or 95. It is not in CI.

## Tasks

| # | Task | Files | Test first |
| --- | --- | --- | --- |
| 1 | Cut the references | `scripts/cut-figma-references.mjs`, `e2e/figma-reference/*.png` | `scripts/cut-figma-references.test.mjs` |
| 2 | The checks | `e2e/visual-parity.spec.ts`, `e2e/visual-masks.ts` | Red without masks (3.17% to 3.95%) |
| 3 | Fix the deviations | `CoffeeCard`, `Hero`, `OrderSummary`, `FormCard`, `CheckoutPage`, `OrderConfirmation` and their tests | The raw share falls |
| 4 | Masks for text | `visual-masks.ts` | The shares fall under 2% with only text masked |
| 5 | Lighthouse | `scripts/lighthouse-home.mjs`, `package.json` | `scripts/lighthouse-home.test.mjs` |
| 6 | Docs | `DESIGN.md`, `QA.md`, `ARCHITECTURE.md`, `PLAN.md` | Root tests |
| 7 | Six QA commands | | Green |

## New dependencies

- `pixelmatch` 7.2.0, `pngjs` 7.0.0, `@types/pngjs` 6.0.5 (dev, `apps/app`): the pixel comparison and the PNG reading.
- `lighthouse` 13.6.0 and `chrome-launcher` 1.2.3 (dev, root): the audit.

## QA steps and risks

- QA: the six commands, plus `yarn lighthouse` and `node scripts/cut-figma-references.mjs` once.
- Risk: pixel comparison depends on the font rendering of Chromium on this machine; a different OS may shift anti-aliasing. The limit of 2% leaves room (the largest share is 0.42%).
- Risk: Lighthouse performance is 91, close to its limit of 90; the 1.8 MB of unoptimized coffee photos and the 0.5 MB hero image are the cost.
