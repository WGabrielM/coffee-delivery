# ADR: Visual parity with the design

- Status: Accepted and verified
- Date: 2026-11-08
- Spec: [.specs/029-app-visual-parity.md](../.specs/029-app-visual-parity.md)
- Plan: [plans/029-app-visual-parity-plan.md](../plans/029-app-visual-parity-plan.md)

## Context

Every screen was built from measured values and checked box by box, but nothing compared the finished pages with the approved design. The design is in Portuguese and in reais and the app is in English and dollars, so a plain pixel comparison would fail on every text. The plan's exit criteria are at most 2% of pixels different at 1440 px and Lighthouse desktop on Home at 90 for performance and 95 for accessibility.

## Decisions

1. **References from the export, committed.** `scripts/cut-figma-references.mjs` reads `docs/design/image-frames.png` (the export of the "Projeto" page, kept on the owner's machine) and cuts the four frames: it finds each frame as a run of pixels that are not the canvas color, so it does not depend on fixed coordinates. The result (`home.png` 1440×2293 and three of 1440×1013) is committed in `apps/app/e2e/figma-reference`, so the checks run without the export. A missing export, or one that has not four frames at 1x, fails with a message. The `.fig` and the PDF stay out of Git.
2. **The app is put in the state of the frame, in a window as large as the frame.** Home with 14 coffees and no cart; Checkout with Traditional Espresso × 1 and Latte × 2 (saved in `localStorage` with the real ids), an empty form, and no payment; Checkout Filled with the sample address and credit card; Success for a real order from the API. A screenshot is then exactly the size of the frame.
3. **The comparison** uses `pixelmatch` (distance 0.1 per pixel, anti-aliased pixels not counted). The masks are painted in both images, and the share is the different pixels over the pixels that are not masked, so a mask never makes the result better by enlarging the denominator. The expected, actual, and diff images are written to the test output.
4. **Masks cover text only.** Each is the union of the text in the design and in the app plus 2 px, with a comment that names the element and why it differs (a translation, a currency, or, for one digit, the design mock that shows a counter of 1 beside the price of two coffees). The cards use the grid geometry (four columns 288 px apart, rows 350 px apart). I checked the masked images by eye: no mask touches an image, an icon, a border, or a button. Not masked, so counted against the 2%: the filter chips (not in the design) and the yellow border of filled inputs (the frame shows none).
5. **The first run without masks showed real deviations, and I fixed them in the components** (small changes, each measured against the frame):
   - The coffee card has 24 px of side padding, not 20: the price starts and the cart button ends 24 px from the card edge (20 px stays at the bottom). Everything inside moved 4 px.
   - The hero is 544 px high (92 px of padding), and the intro sits 8 px above center. The benefits icons were 10 px too low, the cup 2 px, and every card below it 4 px.
   - The summary rows are 128 px apart in the design, not 80 + a divider: 80 px of row, 24 px, the divider, and 23 px; the text and controls start 2 px below the photo top.
   - The line under the card titles is 4.8 px lower (the design's title line height is 1.6), and the card icons are 2 px higher; with the page 1 px higher, the address card, the payment card, the summary card, and the confirm button now match the frame to the pixel.
   - The confirmation: the card is 22 px higher, the title 1 px lower, and the illustration starts at the top edge of the card (its drawing has 12 px of empty space above it).
6. **Lighthouse** (`yarn lighthouse`, `scripts/lighthouse-home.mjs`): it checks that the API answers, builds the app, serves the build with Vite's `preview` in the same process, launches the Chromium of Playwright with `chrome-launcher`, audits Home with the desktop preset, prints the scores and the audits that cost points, and exits 1 under 90 (performance) or 95 (accessibility). Running it in the same process means nothing is left running after it. It is not part of CI, as the spec says.

## Verification

- Six QA commands pass: 638 Vitest tests, 111 root tests (new: the frame cutting and the Lighthouse rules), the API suite unchanged, 185 Playwright tests (176 before, 9 new in `visual-parity.spec.ts`: 4 pixel comparisons and 5 layout checks), strict `tsc`, and `vite build` (CSS 29.34 kB, JS 522.68 kB).
- **Pixel share of each screen** (limit 2%): Home 0.42% of 2,836,842 unmasked pixels, Checkout 0.07% of 1,403,923, Checkout Filled 0.41% of 1,409,180, Success 0.27% of 1,410,982. Without masks the first run was 3.95%, 3.17%, 3.51%, and 1.84%, and after the component fixes (still without masks) 2.12%, 0.81%, 1.08%, and 0.90%; the masks cover 14% of the Home pixels and under 4% of the others.
- **Layout boxes of the design, within 2 px:** the navbar is 104 px, the hero intro 544 px, a card 256×310 with 32 px and 40 px gaps, the checkout columns 640 px at x=160 and 448 px at x=832, Confirm order 368×46, the payment options 179×51, and the success card 526×270.
- **Lighthouse (desktop, Home):** performance 91 and accessibility 96, the same in four runs. The accessibility audit that fails is the color contrast of the palette that the owner kept (it costs 4 points); the performance cost is the Largest Contentful Paint (the 0.5 MB hero image and the 1.8 MB of coffee photos, which the owner chose to leave unoptimized in spec 014).
- Everything above was run against the real API.

## Known differences from the design (not masked, and not changed)

- **Filled input border.** The frame "Checkout Filled" shows the filled fields with no yellow border; the app draws `yellow-dark` on a filled field, as spec 015 and spec 023 say (the Figma component "Preenchido"). This is the owner's decision to take; it costs about 0.2% of the pixels of that frame.
- **Filter chips.** The Figma hides them, and the app shows them (owner's decision 4).
- **The second benefits column** starts 14 px to the right in English because the first column's text is longer than in Portuguese.
- **The pill text** "Porto Alegre, RS" is 1 px higher than in the frame.
- **Contrast.** The palette pairs below AA are unchanged.

## Consequences

- A change to a screen can now fail the pixel check; the diff image shows where. Only text may be masked, and the 2% is not to be raised.
- The pixel check depends on the font rendering of Chromium on the machine that runs it. On a different OS the anti-aliasing can shift; the largest share is 0.42% against a limit of 2%.
- Performance 91 is close to its limit of 90. Resizing the images (spec 014 left them as exported) would give room.
- New libraries: `pixelmatch` 7.2.0, `pngjs` 7.0.0, `@types/pngjs` 6.0.5 (dev, `apps/app`); `lighthouse` 13.6.0, `chrome-launcher` 1.2.3 (dev, root).
