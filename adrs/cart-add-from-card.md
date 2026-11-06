# ADR: Add a coffee to the cart from its card

- Status: Accepted and verified
- Date: 2026-11-06
- Spec: [.specs/021-cart-add-from-card.md](../.specs/021-cart-add-from-card.md)
- Plan: [plans/021-cart-add-from-card-plan.md](../plans/021-cart-add-from-card-plan.md)

## Context

The cart exists (spec 020) but nothing uses it. A visitor must pick a quantity on a coffee card, add it, and see the number on the navbar grow, also after a reload. The Figma gives the buy row (price at the left, a 72×38 counter, a 38×38 cart button) and says nothing about what the counter does after an addition.

## Decisions

1. **The buy row reuses the base components.** The price is followed by a group of `Counter` (72×38) and the icon `Button` (38×38, `purple-dark`, cart icon, radius 6) with an 8 px gap. The card adds no style of its own to them (they take no `className`), so the sizes of the design come from spec 015 and are checked in the browser.
2. **The counter value is state of the card,** not of the cart (the spec says so). Adding calls `useCart().add(coffee.id, quantity)` and sets the counter back to 1, which is the choice of the spec where the design is silent. The counter itself stops at 99; the cart caps the sum of one coffee at 99 (spec 020), so adding 99 twice leaves 99.
3. **Each card has its own polite live region** (`aria-live="polite"`, visually hidden, always in the page, empty until the first addition) that says "Added 2 × Latte to cart". It is per card because the message is born in the card, with its name and quantity, and needs no shared state. A live region speaks a change of text, so the same words twice (adding 1 Latte two times) would stay silent; every second message gets a trailing no-break space, which makes the text change without changing what is heard.
4. **The navbar stays free of cart state.** `AppLayout` is the one reader of `useCart()` for the navbar and passes `totalQuantity` as `cartCount`. The navbar keeps its plain number prop and its tests, and the badge and the link name ("Cart, 3 items") follow the cart on every route.
5. **Nothing opens after an addition** (no cart, toast, or drawer, as the spec says), and the card does not show the quantity already in the cart. The feedback is the badge and the live region.
6. **The tests read the cart through the screen.** A small probe component shows the total and the lines; the cart hook is not mocked. Every card and the layout now need a `CartProvider`, so `renderWithQuery` wraps one and a new `renderWithCart` serves tests that need no query client.
7. **The counter's `output` is a `status` role,** so a page of 14 cards has 14 of them. Two list tests that meant "no loading spinner" asked for the role `status`; they now look for the spinner text "Loading coffees…". The first-load spinner is still a `status`.
8. **The browser axe scan leaves out `color-contrast`.** The unit test runs axe in jsdom (no contrast either). The e2e scan runs the other rules in a real browser on the whole page after an addition. The contrast of the card description and some palette pairs is below AA by the owner's choice and is documented in `DESIGN_SYSTEM.md`.

## Verification

- Six QA commands pass: 412 Vitest tests (402 before: 9 new for the buy row, 1 removed because the card now has a button, 2 for the layout badge), 96 root tests, the API suite unchanged, 40 Playwright tests (30 before, 10 new in `cart-add.spec.ts`, which call the real API), strict `tsc`, and `vite build` (CSS 24.24 kB, 5.46 kB gzip, from 24.22 kB; JS 380.70 kB, 119.29 kB gzip, from 378.99 kB).
- The new tests were run red first (9 card tests and 2 layout tests failed), then green.
- Measured in Chromium at 1440×900 against the API: the counter is 72×38 and the cart button 38×38 (within 2 px), the price is left of the counter and the counter left of the button on one line, the button ends on the 20 px padding of the card, the gap is 8 px, the card keeps 256×310. Latte × 2, then Traditional Espresso × 1 gives "Cart, 3 items", and Latte again gives "Cart, 4 items"; the value stays after a reload; counters of different cards change independently; the counter stops at 99; the live region says "Added 2 × Latte to cart"; no dialog opens and the URL does not change; the button is `rgb(75, 41, 149)` with a 6 px radius.
- Screenshots `screenshots/home_desktop_after.png` (full page), `screenshots/home_cart_filled_desktop_after.png` (badge 3), and `screenshots/home_cart_cards_desktop_after.png` (the buy rows, Latte's counter back at 1), all 1440 px wide, taken with a Playwright script because the Playwright MCP is not loaded in this session.

## Consequences

- A card cannot render without a `CartProvider`. The app has it in `AppProviders`; tests use the helpers.
- 14 empty live regions sit in the page, one per card. They are empty until used and cost nothing visible.
- The counter number is also announced (it is an `output`), so adding Latte × 2 is heard as "Added 2 × Latte to cart" and then the counter reset to "1".
- A card does not show how many of that coffee are already in the cart (the spec says not to); the badge is the only total until the checkout summary (spec 022).
- The badge shows `99+` above 99 (spec 015) while the link name gives the exact number.
- No new library.
