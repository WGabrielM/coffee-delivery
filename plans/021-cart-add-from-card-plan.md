# Plan 021: Cart, add a coffee from its card

- Number: 021
- Created: 2026-11-06
- Spec: [.specs/021-cart-add-from-card.md](../.specs/021-cart-add-from-card.md)

## Concept summary

The spec has no open question, so there was no interview. It connects the cart of spec 020 to two places: the buy row of the card and the navbar badge. Choices, each recorded in `adrs/cart-add-from-card.md`:

1. **The buy row is the price, then a group of the `Counter` and the icon `Button`,** 8 px apart. Both base components already exist (spec 015): `Counter` is 72×38 and the icon button is 38×38 `purple-dark` with the cart icon, so the card adds no style of its own. The group sits at the right edge of the 216 px inner width.
2. **The counter value is state of the card** (`useState(1)`), as the spec asks. Adding calls `useCart().add(coffee.id, quantity)` and sets the counter back to 1. The counter caps at 99 by itself; the cart caps the sum at 99 (spec 020).
3. **The announcement is a polite live region in each card** (`aria-live="polite"`, visually hidden, always in the page), with the text "Added 2 × Latte to cart". The same words twice would not be spoken again, so a no-break space is added on every second addition, which makes the text change.
4. **`AppLayout` reads `useCart()` and passes `totalQuantity` to the `Navbar`.** The navbar stays free of cart state (its own doc and tests say so), so it is still testable with a plain number.
5. **Tests.** The card tests read the cart through a small probe component (what the visitor sees), not through the hook. `renderWithQuery` and a new `renderWithCart` wrap the cart provider, since every card and the layout need it. The browser tests (`cart-add.spec.ts`) call the real API, check the counts of the spec, the reload, the sizes of the buy row, and a real-browser axe scan (without the color-contrast rule, which the owner accepted as below AA).
6. **The counter `output` is a `status` role,** so a list of cards has many `status` elements. Two tests of the list that meant "no loading spinner" now look for the spinner text instead of the role.

## Tasks

| # | Task | Test first |
| --- | --- | --- |
| 1 | `CoffeeCard.test.tsx` (buy row), then `CoffeeCard.tsx` | Fails, then passes |
| 2 | `app-layout.test.tsx` (badge follows the cart, survives a reload), then `app-layout.tsx` | idem |
| 3 | Test helpers: `renderWithCart`, cart in `renderWithQuery` | The suite stays green |
| 4 | `e2e/cart-add.spec.ts` (needs the API) | Fails, then passes |
| 5 | Screenshots at 1440×900: the page, and the cart with badge 3 | A look |
| 6 | Docs: `DESIGN.md`, `DESIGN_SYSTEM.md`, `ARCHITECTURE.md`, `QA.md` | Root tests |
| 7 | Six QA commands | Green |

## New dependencies

None.
