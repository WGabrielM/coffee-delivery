# Plan 016: App navbar and page layout

- Number: 016
- Created: 2026-11-05
- Spec: [.specs/016-app-navbar.md](../.specs/016-app-navbar.md)

## Concept summary

The spec has no open question, so there was no interview. The look is fixed by the Figma design (104 px white bar, 160 px margins, logo, location pill, 38×38 cart button), so the design skills were applied as a checklist (visible keyboard focus, a skip link, named landmarks, no decoration beyond the design). The owner asked to keep the design as it is. Choices, each recorded in `adrs/app-navbar.md`:

1. **`Navbar` is a presentational component** in `src/components/navbar/Navbar.tsx` with one prop, `cartCount` (default 0; anything that is not a positive whole number counts as 0). It reads no cart and calls no API (spec 021 wires the count). It renders `header > nav[aria-label="Main"]` with the logo link, the location pill, and the cart link.
2. **It is the one component that imports the router.** The logo and the cart are real links (`/` and `/checkout`), and a plain `<a href>` would reload the page. The folder guard of spec 015 ("no router in `components/`") now exempts `navbar/` only; the other guards (no fetch, TanStack Query, `api`, `features`, `app`) still cover it.
3. **Accessible names.** The logo link is "Coffee Delivery, home" and its image is decorative (`alt=""`). The cart link is "Cart, empty", "Cart, 1 item", or "Cart, N items"; the `aria-label` replaces the content, so the badge number is not read twice. The pin icon is decorative. The location pill is text, not a link or button, because the product has no geolocation.
4. **`AppLayout`** in `src/app/app-layout.tsx`: a "Skip to content" link (hidden until it has keyboard focus), the navbar, and `<main id="main-content" tabIndex={-1}>` around the router `Outlet`, so the skip link moves the focus into the page. The pages lose their own `<main>` (one `main` per page). `routes.tsx` (the spec says `router.tsx`; the file of this repository is `routes.tsx`) wraps every route in a layout route.
5. **Measures** (from the Figma analysis): height `h-navbar` (104), white, `px-page` (160) with content at most `max-w-content` (1120) and centered, so at 1440 the logo starts at 160 and the cart ends at 1280. Pill 38 high, 8 padding, radius 6, `purple-light` fill, `purple-dark` text, `purple` pin. Cart link 38×38, `yellow-light` fill, `yellow-dark` cart icon, the 20×20 badge on its top right corner. Tablet and mobile are spec 027.
6. **Tests.** Component tests with a memory router (names, hrefs, counts, landmarks, axe); layout and route tests (skip link first in the tab order, one `header`, one `nav`, one `main`); the class-compilation test gets the navbar; a Playwright test measures the boxes at 1440×900 within 2 px and uses the keyboard on the skip link.

## Tasks

| # | Task | Test first |
| --- | --- | --- |
| 1 | Improvements asked by the owner: Counter keeps focus at a limit (`aria-disabled`), select group Home and End | Tests changed or added, then the code |
| 2 | `Navbar.test.tsx`, then `Navbar.tsx` | Fails, then passes |
| 3 | `app-layout.test.tsx`, then `app-layout.tsx`; routes and pages | idem |
| 4 | Guard and class tests learn the navbar | Fails, then passes |
| 5 | `e2e/navbar.spec.ts` | Fails, then passes |
| 6 | Docs: `DESIGN.md`, `DESIGN_SYSTEM.md`, `DEVELOPMENT.md`, `ARCHITECTURE.md` | Root tests |
| 7 | Six QA commands, screenshots at 1440×900 | Green |

## New dependencies

None.
