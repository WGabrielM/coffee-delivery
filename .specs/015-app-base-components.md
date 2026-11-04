# App: base components

## Scope
@apps/app/src/components/button - New; primary, secondary, and icon variants
@apps/app/src/components/counter - New; default and compact sizes
@apps/app/src/components/input - New; text field with optional hint and error
@apps/app/src/components/select-option - New; payment option, single choice in a group
@apps/app/src/components/tag - New; coffee tag and filter chip
@apps/app/src/components/badge - New; cart quantity badge
@apps/app/src/components/*.test.tsx - New; one test file per component
@.docs/DESIGN_SYSTEM.md - Document each component, its props, and its states

## Context
Part of: Coffee Delivery capstone.
Depends on: @.specs/013-app-design-tokens.md
The design defines these components: Button (Primary, Secondary "Remove", Icon; default and hover), Counter (72×38 in the card, 72×32 in the cart; plus and minus icons in purple), Input (42 px high, radius 4, border `#E6E5E5`, active and filled border `#C47F17`, "Optional" hint), Select (179×51, radius 6, selected with `#EBE5F9` fill and `#8047F8` border), Tag (radius 100, `#F1E9C9` fill, `#C47F17` text), and the cart badge (20×20, `#C47F17`, white number). The design shows no error, disabled, or focus states, so this spec defines them.

## Business needs
Screens are assembled from a small set of accessible components that look and behave as the design shows.

## Acceptance Criteria
- **Button:** renders a native `button`; the primary, secondary, and icon variants exist; `disabled` blocks clicks and shows a visibly different state; every button has a focus ring that appears on keyboard focus only; an icon button without a text label requires an `aria-label` (a type error otherwise).
- **Counter:** shows the value with minus and plus buttons labeled "Decrease quantity" and "Increase quantity"; the minimum is `1` and the maximum is `99`, and at a limit the matching button is disabled; each change calls `onChange` with the new value; the group has an accessible name.
- **Input:** every input has an accessible name through a visually hidden label; the optional hint "Optional" shows at the right; when `error` is set, the border uses the error color, the message appears below, `aria-invalid` is `true`, and `aria-describedby` links the message.
- **Select option:** a group of options works as a radio group: one option is selected at most, arrow keys move the selection, and the selected option has `aria-checked="true"`.
- **Tag and Badge:** the tag renders uppercase through styling (the text content keeps its original case); the filter chip variant toggles with `aria-pressed`; the badge renders the number, shows `99+` above 99, and renders nothing when the number is `0`.
- No component source file contains a hex color literal (a test scans the folder), and each component test also passes an axe check with no violations.
- `yarn code:fix`, `yarn lint`, `yarn types:check`, `yarn test`, `yarn test:e2e`, and `yarn build` pass.

## What to do
- Write the tests first, then the components, using the tokens from spec 013 and the icons from spec 014.
- Keep components presentational: no data fetching, no cart access, no routing.
- Document the states this spec adds beyond the design (focus, disabled, error) in `.docs/DESIGN_SYSTEM.md`.

## What not to do
- Do not build a component gallery page or Storybook.
- Do not add a form library binding; spec 023 wires forms.
- Do not add components the screens do not use (modal, toast, dropdown).
- Do not design tablet or mobile variants; spec 027 does.

## Result
Button, Counter, Input, Select option, Tag, and Badge exist with the design's looks, keyboard support, and accessible names, ready for the screens.

## Open questions
None
