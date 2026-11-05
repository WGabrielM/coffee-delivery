# ADR: App navbar and page layout

- Status: Accepted and verified
- Date: 2026-11-05
- Spec: [.specs/016-app-navbar.md](../.specs/016-app-navbar.md)
- Plan: [plans/016-app-navbar-plan.md](../plans/016-app-navbar-plan.md)

## Context

Every page needs the brand, the location, and a way to reach the cart where the design puts them, and a way for a keyboard user to skip them. The cart state does not exist yet (spec 020), so the navbar cannot read it. The owner also asked, before this spec, to keep the Figma colors and still improve what the colors do not decide: the focus of the counter at its limits and the keys of the payment options.

## Decisions

1. **`Navbar` is a presentational component with one prop, `cartCount`** (default 0). A value that is not a positive whole number counts as 0, so a bad count never prints "NaN items". The layout passes nothing until spec 021.
2. **The navbar is the one component that imports the router.** The logo and the cart are real links, and a plain `<a href>` reloads the page (the e2e test sets a marker on `window` and checks that it survives both clicks). The component guard of spec 015 ("no router in `components/`") now says "only `navbar/Navbar.tsx`"; the fetch, TanStack Query, and `api`/`features`/`app` guards still cover it.
3. **Names.** The logo link is "Coffee Delivery, home" (a link that says where it goes) and its image is decorative. The cart link is "Cart, empty", "Cart, 1 item", or "Cart, N items" through `aria-label`, which replaces the link content, so the badge number is not read twice. The badge shows `99+` above 99 but the name keeps the real count. The location pill is plain text: the spec says it is not interactive, and a non-interactive thing should not look or behave like a control.
4. **Landmarks.** `header` (the banner) holds one `nav` named "Main"; `AppLayout` adds one `main`. The pages stop rendering their own `main`, so there is exactly one. Tests check the counts in the component, in the layout, on every route, and in Chromium.
5. **`AppLayout`** (`src/app/app-layout.tsx`) renders the "Skip to content" link first (`sr-only` until it has focus, then fixed at the top left on a white chip with the focus ring), the navbar, and `<main id="main-content" tabIndex={-1}>` around the `Outlet`. `tabIndex={-1}` lets the link move the focus into `main` without adding a tab stop (checked in Chromium: Tab shows the link, Enter focuses `main`). The spec names `router.tsx`; this repository's file is `routes.tsx`, where every route is now a child of one layout route.
6. **Measures** are the Figma ones and are checked in Chromium at 1440×900: header 104 high on `rgb(255, 255, 255)`; logo at x=160, 85×40; cart link 38×38 ending at x=1280; pill 38 high; badge 20×20 on the top right corner of the cart link. The bar is `px-page` with a centered `max-w-content` row, so on a wider screen the content stays 1120 wide instead of stretching. Tablet and mobile are spec 027.
7. **The keyboard focus ring** (2 px `purple`, 2 px offset, `:focus-visible` only) is the one of the base components, on both links (the computed outline is checked in Chromium).
8. **Improvements made at the owner's request, with the palette unchanged:**
   - **Counter:** at a limit the button is `aria-disabled="true"` instead of `disabled`. A disabled button drops the keyboard focus, so a person who pressed Enter on "Increase" up to 99 lost their place; now the focus stays, the button is dimmed, has no hover, and does nothing (`onChange` is not called). This changes the "disabled" wording of spec 015 for this one control; the test "keeps the keyboard focus on the button that reaches a limit" pins it.
   - **Select options:** Home and End jump to the first and last option (the ARIA radio group pattern; native radios only have the arrows). Selecting the option that is already selected does not call `onChange`.
   - **Gradle:** `coffeeBuildDir` is set in `~/.gradle/gradle.properties`, so the command line and the VS Code Java extension build in the same folder outside OneDrive. Verified: with the environment variable unset, `yarn test:e2e` (API, 80% coverage rule) passed and `apps/api/build` was not recreated.
   - The WCAG AA contrast of the palette is not touched: the owner keeps the design. The ratios stay recorded in DESIGN_SYSTEM.md.

## Verification

- Six QA commands pass: 281 Vitest tests (253 before, 28 new or changed: Navbar 14, layout 8, routes 1, router guard 1, improvements 4), 96 root Node tests, the API suite unchanged, 11 Playwright tests (6 new in `navbar.spec.ts`) on port 5173, strict `tsc`, and `vite build` (CSS 20.49 kB, 4.68 kB gzip, from 18.88 kB; JS 358.82 kB, 112.48 kB gzip).
- Screenshots `screenshots/home_desktop_after.png` and `screenshots/checkout_desktop_after.png` (1440×900, taken with a Playwright script because the Playwright MCP is not loaded in this session). A throwaway preview page (deleted, not committed) rendered the cart with counts 3 and 120: the badge sits 8 px outside the corner (box 1268,25, 20×20, `rgb(196, 127, 23)`), and `99+` fits.
- Both pages show an unstyled `h1` below the navbar: the screens are specs 017 and later.

## Consequences

- The cart link always shows "Cart, empty" until spec 021 passes the real count to `AppLayout`.
- A page that wants its own `main` must not: the layout owns it.
- The navbar has no hover color, because the design shows none.
- Screens 017 onward start below the navbar and need no top spacing of their own.
- No new library.
