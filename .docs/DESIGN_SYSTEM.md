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

States the design does not show (focus, disabled, error, selected chip) are defined by the specs that build the component and recorded here when they do.

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
