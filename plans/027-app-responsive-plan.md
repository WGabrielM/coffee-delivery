# Plan 027: Responsive layouts

- Number: 027
- Created: 2026-11-08
- Spec: [.specs/027-app-responsive.md](../.specs/027-app-responsive.md)

## Concept summary

The spec has no open question. Its rules were "the proposal for the user to approve"; the owner approved them on 2026-11-08 and told me to set the pixel sizes I think are right. Choices, each recorded in `adrs/app-responsive.md`:

1. **Breakpoints** are Tailwind's own: `sm` (640 px) and `lg` (1024 px). No custom breakpoint is added.
2. **The page margin is one variable.** `--spacing-page` (used as `px-page` by five screens) is set in `base.css`: 16 px, 32 px from 640 px, and from 1024 px `clamp(2rem, (100vw - 1140px) / 2, 160px)`. The content is at most 1120 px and centered, so the 160 px of the design still shows at 1440 px (the content starts at x=160). The 160 px in `theme.css` stays as the desktop value.
3. **Desktop between 1024 px and about 1180 px is fluid.** The spec calls desktop "from 1024 px", but the design needs 1120 px of content. So the desktop layouts share the room: the coffee grid is `repeat(auto-fill, 16rem)` (four, three, two, or one column), the checkout columns are `640fr / 448fr`, the address rows are fractions equal to the design pixels, the confirmation illustration and the hero image shrink with their proportions.
4. **One component per element.** Only classes change (no copy of a component for mobile): the margin variable, `flex-col lg:flex-row`, `grid-cols-1 lg:...`, and `sm:` and `max-lg:` variants. `SelectOptionGroup` stacks below 640 px (a base component changed with its test).
5. **Targets of 24 px.** The empty-cart and not-found links were 22 px high (also on desktop), so they get `min-h-6`.
6. **No horizontal scroll** at any width from 320 px up; extra checks at 1280, 1024, and 320 px beyond the spec's 768 and 390.

## Tasks

| # | Task | Files | Test first |
| --- | --- | --- | --- |
| 1 | Playwright checks | `e2e/responsive.spec.ts` | Red on the desktop-only layouts (35 failed), green after |
| 2 | Margin variable, navbar | `styles/base.css`, `Navbar.tsx` | The checks |
| 3 | Hero | `Hero.tsx` | The checks |
| 4 | Coffee list and chips | `CoffeeList.tsx`, `CoffeeFilters.tsx` | The checks |
| 5 | Checkout: page, cards, address rows, payment group, summary | `CheckoutPage.tsx`, `FormCard.tsx`, `AddressCard.tsx`, `SelectOptionGroup.tsx`, `OrderSummary.tsx` | The checks |
| 6 | Confirmation and order page | `OrderConfirmation.tsx`, `OrderPage.tsx` | The checks |
| 7 | Unit tests that pinned the fixed classes | nine tests in seven files | Updated |
| 8 | Screenshots 1440×900, 768×1024, 390×844 | twelve files in `screenshots/` | A look |
| 9 | Docs | `DESIGN.md`, `DEVELOPMENT.md`, `QA.md`, `PLAN.md` | Root tests |
| 10 | Six QA commands | | Green |

## New dependencies

None.

## Accessibility, observability

- Targets of at least 24×24 px at every width; the reading and focus order do not change (the DOM order is the visual order on every width).
- Nothing is hidden on a small screen.
- No server code and no new metric.

## QA steps and risks

- QA: the six commands, plus the manual steps in the report.
- Risk: Chromium in Playwright has overlay scrollbars, so the checks do not see a 15 to 17 px classic scrollbar. The margin formula leaves 20 px of room for it at 1440 px.
- Risk: the 1024 to 1180 px range (a small laptop window) has no design; its rules are mine.
