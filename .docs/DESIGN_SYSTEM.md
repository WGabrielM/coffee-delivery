# Design system

Tokens and components of the Coffee Delivery design. The values come from `docs/design/figma-analysis.md`. The theme in `apps/app/src/styles/theme.css` (spec 013) exposes them under the names below; components use the names, never the hex values. Each color is a Tailwind color named after the token: `bg-card`, `text-title`, `border-button`, `fill-purple`, and so on. Only these 18 colors exist; the default Tailwind palette is removed.

## Colors

| Token | Hex | Used for |
| --- | --- | --- |
| `white` | `#FFFFFF` | Navbar, text on the primary button and on the badge |
| `background` | `#FAFAFA` | Page background |
| `card` | `#F3F2F2` | Coffee card and checkout card fill |
| `input` | `#EDEDED` | Input fill |
| `button` | `#E6E5E5` | Counter, "Remove" button, payment option fill, input border |
| `hover` | `#D7D5D5` | Hover fill (a variant in the design), dividers |
| `label` | `#8D8686` | Coffee descriptions, placeholders, the "Optional" hint |
| `text` | `#574F4D` | Body text, prices, input values, payment option labels, subtotals |
| `subtitle` | `#403937` | Coffee name, "Our coffees", checkout section titles, hero and confirmation subtitles, "Total" |
| `title` | `#272221` | Hero title, counter number |
| `purple-light` | `#EBE5F9` | Location pill, selected payment option |
| `purple` | `#8047F8` | Plus and minus icons, payment icon, selected option border |
| `purple-dark` | `#4B2995` | Cart button on cards, city text |
| `yellow-light` | `#F1E9C9` | Navbar cart button, tag fill |
| `yellow` | `#DBAC2C` | Confirm button, timer icon, selected filter chip |
| `yellow-dark` | `#C47F17` | Tag text, cart icon, badge, address pin, success title |
| `hero-blob` | `#EBC136` | Decorative yellow shapes in the hero |
| `error` | `#CC2937` | Invalid input border and message (defined by the design, not drawn in the four screens) |

In CSS the colors are variables named `--color-<token>` (`--color-yellow-dark`), the same names as in the table.

Hero benefit icon colors: purchase `yellow-dark`, packaging `text`, delivery `yellow`, freshness `purple`.

## Typography

Families: **Roboto** (body, `--font-body`) and **Baloo 2** (titles, `--font-title`), both self-hosted with Fontsource (Roboto 400 and 700, Baloo 2 700 and 800; the `latin` and `latin-ext` subsets). The page requests no font from an outside host.

Each style is a utility named `type-<style>` that sets family, weight, size, line height, letter spacing, and case together: `type-title-xl`, `type-title-l`, `type-title-m`, `type-title-s`, `type-title-xs`, `type-text-regular-l|m|s`, `type-text-bold-l|m|s`, `type-subtitle-xl`, `type-button-g`, `type-button-s`, `type-tag`, `type-tag-l`. Sizes are `rem` (px / 16). The default Tailwind font sizes (`text-xl`) do not exist.

| Style | Font | Weight | Size (px) | Line height | Case |
| --- | --- | --- | --- | --- | --- |
| Title XL | Baloo 2 | ExtraBold | 48 | 1.3 | normal |
| Title L | Baloo 2 | ExtraBold | 32 | 1.3 | normal |
| Title M | Baloo 2 | ExtraBold | 24 | 1.3 | normal |
| Title S | Baloo 2 | Bold | 20 | 1.3 | normal |
| Title XS | Baloo 2 | Bold | 18 | 1.3 | normal |
| Text Regular L / M / S | Roboto | Regular | 20 / 16 / 14 | 1.3 | normal |
| Text Bold L / M / S | Roboto | Bold | 20 / 16 / 12 | 1.3 | normal (S has letter spacing −6%) |
| Subtitle XL | Roboto | Bold | 24 | 1.3 | normal |
| Button G | Roboto | Bold | 14 | 1.6 | uppercase |
| Button S | Roboto | Regular | 12 | 1.6 | uppercase |
| Tag | Roboto | Bold | 10 | 1.3 | uppercase |
| Tag L | Roboto | Bold | 12 | 1.3 | uppercase |

Usage: hero title Title XL; "Our coffees" and the confirmation title Title L; coffee name Title S; checkout headings Title XS; descriptions and inputs Text Regular S; the price is a small "$" (Text Regular S) next to the amount (Subtitle XL); the checkout total line is 20 px bold.

## Spacing and shape

Page margin 160 px (`px-page`), navbar 104 px (`h-navbar`), content width 1120 px (`max-w-content`). Radii: input 4 (`rounded-input`), button, counter, pill, and Select 6 (`rounded-button`), tag 100 (`rounded-tag`), round icon 1000 (`rounded-round`); card corners `rounded-coffee-card` (6/36/6/36), `rounded-summary-card` (6/44/6/44), and `rounded-order-card` (6/36/6/36). There are no shadows. Layout as listed in [DESIGN.md](DESIGN.md). Paddings: location pill 8, primary button 12 vertical, counter 8 horizontal, card tag 8×4, input 12, payment option 16, checkout cards 40. Borders are 1 px: input `button`, active or filled input `yellow-dark`, selected payment option `purple`.

## Components

| Component | Variants and states | Measures |
| --- | --- | --- |
| Button | Primary, Secondary ("Remove"), Icon; default and hover | Primary 132×46 (368×46 in the checkout); Secondary 91×32; Icon 38×38 on `purple-dark` |
| Counter | Default (card) and compact (cart) | 72×38 and 72×32; plus and minus icons in `purple` |
| Cart link (navbar) | Empty and with badge | 38×38; the badge is a 20×20 circle in `yellow-dark` with a white number |
| Input | Active and filled; optional hint; error | 42 px high, radius 4 |
| Payment option | Default, hover, selected | 179×51, radius 6, `purple` icon, uppercase label |
| Tag | Card tag; filter chip (unselected, selected) | Radius 100, `yellow-light` fill, `yellow-dark` text. The chip is proposed: unselected has a `yellow` border and `yellow-dark` text; selected has a `yellow` fill and white text |
| Coffee card | Catalog; cart row | Catalog 256×310; the cart row is 368×80 |

States the design does not show (focus, disabled, error, selected chip) are defined by the specs that build the component and recorded here when they do. The six base components below are built (spec 015) in `apps/app/src/components/<name>/`; the Cart link and the Coffee card are made of them and arrive with the screens.

### Base components

Every base component is presentational (no data fetching, no cart, no routing), takes no `className` or `style` (layout goes through props such as `size` and `fullWidth`), renders native elements, and has a test file with an axe check. Import them from their folder, for example `import { Button } from "../components/button/Button"`.

| Component | Props | What it renders |
| --- | --- | --- |
| `Button` | `variant` (`primary` default, `secondary`, `icon`), `icon?`, `fullWidth?`, native button props | A native `button` (`type="button"` unless you pass `submit`). Primary: yellow, white `type-button-g`, min height 46. Secondary: `button` fill, `text` label, 32 high, optional trash icon in `purple`. Icon: 38×38 `purple-dark`, white 22 px glyph, **`aria-label` required and no children** (a type error otherwise) |
| `Counter` | `label` (group name), `value`, `onChange(value)`, `size` (`default` 72×38, `compact` 72×32) | A `fieldset` named `label` with two 24×24 buttons, "Decrease quantity" and "Increase quantity", and the value in an `<output>` (a polite live region). Limits `MIN_QUANTITY` 1 and `MAX_QUANTITY` 99: at a limit the matching button is disabled and `onChange` is not called. The parent owns the value |
| `Input` | `label` (required, visually hidden), `hint?`, `error?`, native input props, `ref` | A native `input` 42 high, radius 4, `input` fill. `hint` ("Optional") shows at the right in 12 px italic. `error` shows the message below in `error`, sets `aria-invalid="true"`, and links the hint and the message through `aria-describedby`. Pass `name`, `autoComplete`, `inputMode`, and `type` as you would to an `input` |
| `SelectOptionGroup` (with `SelectOption`) | `label` (group name), `options` (`{ value, label, icon }[]`), `value`, `onChange(value)`, `name?` | A `fieldset` with `role="radiogroup"` of native radio buttons that share one `name`, each drawn as the 179×51 option of the design. At most one is selected and has `aria-checked="true"`; Tab enters the group once and the arrow keys move the selection and wrap. The parent owns the value |
| `Tag` | `variant` (`label` default or `filter`), `children`; for `filter`: `pressed`, `onPressedChange(pressed)` | `label`: a `span` pill (`yellow-light` fill, `yellow-dark` text, `type-tag`). `filter`: a `button` with `aria-pressed`, `type-tag-l`. The text keeps its case; the uppercase is styling |
| `Badge` | `count` | A 20×20 `yellow-dark` circle with a white number (`type-text-bold-s`). `99+` above 99; nothing for 0, a negative number, or a non-integer. It has no label: the Cart link names the count ("Cart, 3 items") |

`Icon` (`components/icon`) is the internal helper that inlines `iconSvgs[name]` with `aria-hidden="true"`; use it only inside base components.

#### States this spec defines (the design shows none of them)

| State | Rule |
| --- | --- |
| Focus (buttons, counter buttons, select options, filter chip) | A 2 px `purple` outline with a 2 px offset on `:focus-visible` only, so a keyboard shows it and a mouse click does not. It is an outline, not a shadow |
| Focus (input) | The border turns `yellow-dark` and a 1 px `yellow-dark` outline joins it (`error` when invalid), on every focus. The border alone is not enough against the idle border |
| Disabled | Half opacity, a `not-allowed` cursor, no hover color, skipped by Tab, no click |
| Hover | Primary `yellow-dark`; Secondary and options `hover` fill; Icon button `purple`; Counter buttons `hover` fill; unselected chip `yellow-light` fill. Only on enabled controls (`enabled:hover:`) |
| Filled input | `yellow-dark` border while the field has text (CSS `:not(:placeholder-shown)`, so it works on an uncontrolled field) |
| Error | `error` border and message, `aria-invalid="true"`, `aria-describedby`, message in a polite live region |
| Selected chip | `yellow` fill with white text; unselected: `yellow` border and `yellow-dark` text |
| Motion | Colors fade in 150 ms; none under `prefers-reduced-motion` |

#### Contrast: the palette of the design is below WCAG AA in places

Ratios are calculated with the WCAG formula (axe cannot judge contrast in jsdom). The components use the colors the design specifies, so these pairs are **below** the 4.5:1 that AA asks for text (3:1 for borders and icons). They need a decision of the owner (for example a darker text color for tags and chips, or a darker yellow behind white text); no component was changed on its own.

| Pair | Where | Ratio | Needs |
| --- | --- | --- | --- |
| white on `yellow` | Primary button, selected chip | 2.11 | 4.5 |
| white on `yellow-dark` | Primary hover, cart badge | 3.28 | 4.5 |
| `yellow-dark` on `yellow-light` | Tag | 2.70 | 4.5 |
| `yellow-dark` on `background` | Unselected chip | 3.15 | 4.5 |
| `label` on `input` | Placeholder, "Optional" hint | 3.05 | 4.5 |
| `button` on `input` | Idle input border | 1.07 | 3 |
| `yellow-dark` on `input` | Filled input border | 2.80 | 3 |

Pairs that pass: `text` on `button` 6.35, `title` on `button` 12.49, `text` on `purple-light` 6.50, `text` on `input` 6.82, `error` on `background` 5.11, white on `purple-dark` 10.24, white on `purple` 5.03, the `purple` focus ring on `background` 4.82, and the `purple` counter icons on `button` 4.00.

## Money

`formatMoney(990)` is `$9.90` and `formatMoneyParts(990)` is `{ symbol: "$", amount: "9.90" }` (`src/lib/format-money.ts`). The price draws the symbol small (Text Regular S) next to the amount (Subtitle XL). Both accept only non-negative whole cents and throw `RangeError` otherwise.

## Icons

Thirteen icons, Phosphor style, as SVG that take their color from the text color: `shopping-cart-fill`, `timer-fill`, `package-fill`, `coffee-fill`, `map-pin-fill`, `map-pin-line`, `currency-dollar`, `trash`, `plus-bold`, `minus-bold`, `credit-card`, `money`, `bank`. They are the whole set: do not add an icon library, and do not redraw or restyle them (spec 014).

Each icon is a 32 by 32 SVG with `fill="currentColor"` and no other color. `iconSvgs[name]` holds its markup (not a URL), because only an inline SVG takes the color of the text around it: render it inline and color it with a text color token (`text-purple`, `text-yellow-dark`). Size it with CSS.

## Assets

All brand and product images live in `apps/app/src/assets` and are committed, so the app builds without the Figma file. Import them only through the manifest, `src/assets/index.ts`, which names every file (a missing file fails `tsc` and the build).

| Folder | Content | Manifest |
| --- | --- | --- |
| `coffees/` | 14 coffee photos, square PNGs with a transparent background (320 to 1332 px), named by catalog slug | `COFFEE_SLUGS`, `CoffeeSlug`, `coffeeImages[slug]` (URL) |
| `icons/` | the 13 icons above | `ICON_NAMES`, `IconName`, `iconSvgs[name]` (SVG markup) |
| `logo/` | `logo.svg`, 85 by 40, its own two colors (cup `#8047F8`, text `#403937`) | `logo` (URL) |
| `hero/` | `hero.png`, 1070 by 810 (2.25 times the 476 by 360 of the frame), with the yellow shape and the purple arc already in it | `heroImage` (URL) |
| `success/` | `delivery-illustration.svg`, 492 by 293, its own colors | `deliveryIllustration` (URL) |

The photos are shown at 120 by 120 in the catalog and 64 by 64 in the cart. The files are the originals of the design, not resized: about 1.8 MB for the 14 photos and 0.5 MB for the hero image (spec 014 records the weight; resizing is a later decision).

### Regenerating the assets

The `.fig` file stays on the developer's machine at `docs/design/Coffee Delivery • Desafio React (Copy).fig` (ignored by Git). With it present, run:

```bash
node scripts/extract-figma-assets.mjs            # the default path
node scripts/extract-figma-assets.mjs <file.fig> # another path
```

The script reads the file offline (no Figma account, no library), rewrites `apps/app/src/assets` and `docs/design/assets-mapping.md`, and draws `docs/design/coffee-images-contact-sheet.png`. It is deterministic: running it again on the same file changes nothing. It stops with an error when a card has no known slug, when two cards share a photo, when a photo is not square or is under 240 px, or when the photos of the cards and of the Style Guide disagree. Without the file it exits with a message that names the expected path. It needs Node 22.15 or newer (the canvas of the file is zstd-compressed).

How a photo is matched to a coffee: by the image hash of its card on the Home screen, never by position. `docs/design/assets-mapping.md` lists, for each slug, the Figma card, the photo symbol, and the hash; the contact sheet lets you check the result by eye.
