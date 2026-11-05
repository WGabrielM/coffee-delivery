# Plan 015: App base components

- Number: 015
- Created: 2026-11-05
- Spec: [.specs/015-app-base-components.md](../.specs/015-app-base-components.md)

## Concept summary

The spec has no open question, so there was no interview. The look is fixed by the Figma design, so the design skills were applied as a checklist (visible keyboard focus, no decoration beyond the design, states defined for what the design lacks), not as a new visual direction. Choices, each recorded in `adrs/app-base-components.md`:

1. **One folder per component** in `src/components/<name>/` with `<Name>.tsx` and `<Name>.test.tsx`: `button`, `counter`, `input`, `select-option`, `tag`, `badge`, plus the internal `icon` (inlines `iconSvgs[name]` with `aria-hidden`, because every component that draws an icon needs it; it is not a screen component). Components take no `className`: layout goes through props (`fullWidth`, `size`), so a screen cannot restyle them.
2. **Button**: a discriminated union. `primary` and `secondary` take `children`; `icon` takes `icon` and a required `aria-label`, so an icon button without a name is a type error (tested with `@ts-expect-error`). Hover colors are not in the Figma file as values, so they are chosen from the tokens: primary `yellow-dark`, secondary `hover`, icon `purple`. Disabled is `opacity-50` and `cursor-not-allowed` with no hover change. The focus ring is an outline on `:focus-visible` only (2 px, `purple`, 2 px offset), so a mouse click shows none.
3. **Counter**: a `fieldset` (the native group) with `value`, `onChange`, `size` (`default` 72×38, `compact` 72×32), and a required `label` for the accessible name of the group. Minimum 1 and maximum 99 are exported constants. The value is an `<output>` (a polite live region), so a screen reader hears each change. Each button is at least 24×24 (WCAG 2.2 target size).
4. **Input**: a native `input` with a visually hidden `<label>` (`label` prop is required), an optional `hint` at the right, and `error`. With an error the border is `error`, `aria-invalid="true"`, and `aria-describedby` lists the hint and the message. The "filled" border of the design is CSS only (`placeholder-shown`), so it works for uncontrolled fields; a field without a placeholder gets a single space so the selector still matches. Focus is a border change plus a 1 px outline of the same color (the border alone is below 3:1 against the idle border). `ref` is a normal prop (React 19), so spec 023 can focus the first invalid field.
5. **Select option**: `SelectOptionGroup` (a `fieldset` with `role="radiogroup"`, with `label`, `value`, `onChange`, `name?`, and an `options` array) renders `SelectOption`: a native `<input type="radio">`, visually hidden, inside a `<label>` drawn as the option. Native radios give the keyboard for free (one tab stop, arrow keys that move the selection and the focus and wrap) and work as a form field for spec 023 (shared `name`, a `value` each). The spec asks for `aria-checked`, so the attribute is set too, always equal to `checked`. A first version used `role="radio"` buttons with hand-written arrow keys; it was replaced because semantic HTML comes before ARIA. Home and End are not supported (native radios do not).
6. **Tag**: one component with two variants. The label tag is a `span`; the filter chip is a `button` with `aria-pressed` and `onPressedChange`. Both are uppercase through the `type-tag` styles, so the text content keeps its case. The chip look is the one proposed in DESIGN_SYSTEM.md.
7. **Badge**: renders the number, `99+` above 99, and nothing for 0 or less. It has no label of its own; the cart link of spec 016 names the count.
8. **Accessibility tests** use `axe-core` 4.14.0 (new dev dependency of the app) through a helper `src/test/axe.ts`. Color contrast is turned off in that helper because jsdom has no layout or computed colors; the contrast of the token pairs is checked by calculation and recorded in DESIGN_SYSTEM.md. Several pairs of the Figma palette are below 4.5:1 (white on `yellow`, `yellow-dark` on `yellow-light`, white on `yellow-dark`, `label` on `background`); they are implemented as designed and reported to the owner.
9. **A test scans `src/components`** for hex color literals. The existing root test already does for all of `src`; this one lives with the components, as the spec asks.
10. **Real CSS check**: jsdom has no stylesheet, so a class that does not exist would pass every test. `classes.test.tsx` renders every variant, collects the classes of the DOM, and compiles them with the theme of the app (`tailwindcss`, already a dependency): each class must produce CSS. A throwaway page (not committed) also rendered every state in Chromium at 1440×900 for a look and for computed styles.

## Tasks

| # | Task | Test first |
| --- | --- | --- |
| 1 | Install `axe-core`; `src/test/axe.ts` | A test that axe flags an unlabeled button |
| 2 | `Button.test.tsx`, then `Button.tsx` and `Icon.tsx` | Fails, then passes |
| 3 | `Counter.test.tsx`, then `Counter.tsx` | idem |
| 4 | `Input.test.tsx`, then `Input.tsx` | idem |
| 5 | `SelectOptionGroup.test.tsx`, then `SelectOption.tsx` and `SelectOptionGroup.tsx` | idem |
| 6 | `Tag.test.tsx`, `Badge.test.tsx`, then `Tag.tsx`, `Badge.tsx` | idem |
| 7 | `components.test.ts`: no hex literal under `src/components` | Passes with the code |
| 8 | `classes.test.tsx`: every class of every variant compiles with the app theme; throwaway page and screenshots | Mutation check: a bad class fails it |
| 9 | Docs: `DESIGN_SYSTEM.md` (props, states, contrast), `ARCHITECTURE.md`, `DEVELOPMENT.md` | Root tests |
| 10 | Six QA commands | Green |

## New dependencies

`axe-core` 4.14.0 (dev dependency of `apps/app`, tests only).
