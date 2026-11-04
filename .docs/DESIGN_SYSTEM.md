# Design system

Tokens and components of the Coffee Delivery design. The values come from `docs/design/figma-analysis.md`. The theme in `apps/app` (spec 013) exposes them under the names below; components use the names, never the hex values.

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

Hero benefit icon colors: purchase `yellow-dark`, packaging `text`, delivery `yellow`, freshness `purple`.

## Typography

Families: **Roboto** (body) and **Baloo 2** (titles), both self-hosted.

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

Page margin 160 px, navbar 104 px, radii and layout as listed in [DESIGN.md](DESIGN.md). Paddings: location pill 8, primary button 12 vertical, counter 8 horizontal, card tag 8×4, input 12, payment option 16, checkout cards 40. Borders are 1 px: input `button`, active or filled input `yellow-dark`, selected payment option `purple`.

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

## Icons

Thirteen icons, Phosphor style, as SVG that take their color from the text color: `shopping-cart-fill`, `timer-fill`, `package-fill`, `coffee-fill`, `map-pin-fill`, `map-pin-line`, `currency-dollar`, `trash`, `plus-bold`, `minus-bold`, `credit-card`, `money`, `bank`. Spec 014 extracts them and the other assets from the Figma file.
