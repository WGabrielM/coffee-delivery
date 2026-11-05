# Plan 018: Home coffee list

- Number: 018
- Created: 2026-11-05
- Spec: [.specs/018-home-coffee-list.md](../.specs/018-home-coffee-list.md)

## Concept summary

The spec has no open question, so there was no interview. The look is fixed by the Figma design. Choices, each recorded in `adrs/home-coffee-list.md`:

1. **Data:** `features/catalog/api.ts` has the response types, `listCoffees` (a `GET /coffees` through the typed client) and `useCoffees`, a TanStack Query hook with the key `["coffees", tags]` and an empty tag list, so spec 019 only passes the argument. The app's query client already retries a network or server failure twice and never a 4xx.
2. **`CoffeeCard`** (`features/catalog/coffee-card`) is an `article` named by its `h3` (the coffee name). It has the 120 px round photo that overlaps the top edge by 20 px, the `Tag` labels, the description (`label` color), and a purchase row with the price split by `formatMoneyParts`. The row has the height of the counter (38 px) and stays empty on the right: spec 021 puts the counter and the cart button there. The card is 256×310 with `rounded-coffee-card`.
3. **The photo** comes from `coffeeImages[slug]`. A slug the app has no photo for gets an empty round placeholder, so the layout holds and the page does not break.
4. **`CoffeeList`** (`features/catalog/coffee-list`) is a `section` named by its `h2` "Our coffees". It has `aria-busy` while the first request runs. States: loading (a status with a spinner that stops under reduced motion), error ("We couldn't load the coffees." and a "Try again" button that refetches), empty ("No coffees found."), data (a `ul` of cards, each in an `li`).
5. **The grid** is four columns of 256 px with 32 px between columns and 40 px between rows inside the 1120 px content, so the two cards of the last row stay on the left.
6. **Tests** mock the network (`fetch`), not the hook, so the hook, the client, and the components are tested together. A query client with `retry: false` keeps the error state fast.
7. **Contrast:** the description (`label` on `card`) is one of the pairs of the palette that is below AA (owner decision pending, palette unchanged). The browser test checks the measures, not the contrast of this pair.

## Tasks

| # | Task | Test first |
| --- | --- | --- |
| 1 | `api.test.ts`, then `api.ts` | Fails, then passes |
| 2 | `CoffeeCard.test.tsx`, then `CoffeeCard.tsx` | idem |
| 3 | `CoffeeList.test.tsx`, then `CoffeeList.tsx` | idem |
| 4 | `HomePage` renders the list; route tests provide a query client and a fake API | idem |
| 5 | Classes test covers the new components | idem |
| 6 | `e2e/home-coffees.spec.ts` (needs the API) | Fails, then passes |
| 7 | Screenshot at 1440×900 and a look at it | A look |
| 8 | Docs: `DESIGN.md`, `DESIGN_SYSTEM.md`, `ARCHITECTURE.md` | Root tests |
| 9 | Six QA commands | Green |

## New dependencies

None.
