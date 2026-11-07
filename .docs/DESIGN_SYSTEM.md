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

States the design does not show (focus, disabled, error, selected chip) are defined by the specs that build the component and recorded here when they do. The six base components below are built (spec 015) in `apps/app/src/components/<name>/`; the Coffee card is built in spec 018 (see below). The navbar (spec 016) is built too; see below.

### Base components

Every base component is presentational (no data fetching, no cart, no routing), takes no `className` or `style` (layout goes through props such as `size` and `fullWidth`), renders native elements, and has a test file with an axe check. Import them from their folder, for example `import { Button } from "../components/button/Button"`.

| Component | Props | What it renders |
| --- | --- | --- |
| `Button` | `variant` (`primary` default, `secondary`, `icon`), `icon?`, `fullWidth?`, native button props | A native `button` (`type="button"` unless you pass `submit`). Primary: yellow, white `type-button-g`, min height 46. Secondary: `button` fill, `text` label, 32 high, optional trash icon in `purple`. Icon: 38×38 `purple-dark`, white 22 px glyph, **`aria-label` required and no children** (a type error otherwise) |
| `Counter` | `label` (group name), `value`, `onChange(value)`, `size` (`default` 72×38, `compact` 72×32) | A `fieldset` named `label` with two 24×24 buttons, "Decrease quantity" and "Increase quantity", and the value in an `<output>` (a polite live region). Limits `MIN_QUANTITY` 1 and `MAX_QUANTITY` 99: at a limit the matching button is `aria-disabled="true"` (dimmed, no hover, announced as dimmed) and `onChange` is not called; it is not `disabled`, so a keyboard user who presses Enter up to 99 keeps the focus. The parent owns the value |
| `Input` | `label` (required, visually hidden), `hint?`, `error?`, native input props, `ref` | A native `input` 42 high, radius 4, `input` fill. `hint` ("Optional") shows at the right in 12 px italic. `error` shows the message below in `error`, sets `aria-invalid="true"`, and links the hint and the message through `aria-describedby`. Pass `name`, `autoComplete`, `inputMode`, and `type` as you would to an `input` |
| `SelectOptionGroup` (with `SelectOption`) | `label` (group name), `options` (`{ value, label, icon }[]`), `value`, `onChange(value)`, `name?` | A `fieldset` with `role="radiogroup"` of native radio buttons that share one `name`, each drawn as the 179×51 option of the design. At most one is selected and has `aria-checked="true"`; Tab enters the group once, the arrow keys move the selection and wrap, and Home and End jump to the first and last option. The parent owns the value |
| `Tag` | `variant` (`label` default or `filter`), `children`; for `filter`: `pressed`, `onPressedChange(pressed)` | `label`: a `span` pill (`yellow-light` fill, `yellow-dark` text, `type-tag`). `filter`: a `button` with `aria-pressed`, `type-tag-l`. The text keeps its case; the uppercase is styling |
| `Badge` | `count` | A 20×20 `yellow-dark` circle with a white number (`type-text-bold-s`). `99+` above 99; nothing for 0, a negative number, or a non-integer. It has no label: the Cart link names the count ("Cart, 3 items") |

### Hero (spec 017)

`Hero` (`features/home/hero/Hero.tsx`) is a feature component, not a base component: no props, no data. A `section` with the title (the page h1), the subtitle, a list of four benefits, and the decorative cup image (`alt=""`), over blurred shapes drawn with `bg-hero-blob/30`, `bg-purple-light`, and `blur-[100px]`. Measures in [DESIGN.md](DESIGN.md).

### Coffee list and card (spec 018)

| Piece | Props | What it renders |
| --- | --- | --- |
| `CoffeeCard` (`features/catalog/coffee-card`) | `coffee` (`Coffee` of `features/catalog/api`) | An `article` named by its `h3` (the coffee name), 256×310, `bg-card`, `rounded-coffee-card`. The photo is `coffeeImages[slug]` with the name as `alt` (120×120, round, `-mt-5`); a slug with no photo gets an empty round placeholder of the same size. Tags are the `Tag` label, in the order of the API. The description is `label`. The price is `formatMoneyParts` (a small symbol and a large amount). The purchase row (price at the left) ends with a group of a `Counter` named "Quantity of <name>" and the icon `Button` named "Add <name> to cart", 8 px apart. The counter value is state of the card, starts at 1, and goes back to 1 after an addition; the button calls `useCart().add(coffee.id, quantity)` (the cart caps one coffee at 99). A visually hidden `p` with `aria-live="polite"` says "Added 2 × Latte to cart"; a no-break space is added on every second addition, so the same words are spoken again. The card needs a `CartProvider` above it |
| `CoffeeList` (`features/catalog/coffee-list`) | none | A `section` named by its `h2` "Our coffees", with the `CoffeeFilters` at the right of the title, and `aria-busy` while a request runs (the first one, or a new filtered one). Loading (first request): a `status` with a spinner (stopped under reduced motion) and "Loading coffees…". Error: an `alert` with "We couldn't load the coffees." and a "Try again" button that repeats the request. Empty: "No coffees found.", or "No coffees match the selected filters." with a "Clear filters" button when a chip is selected. Data: a `ul` grid with one `li` per card. While a new filtered list loads, the previous cards stay. A visually hidden `aria-live="polite"` paragraph says the count ("5 coffees", "1 coffee"). The selection of chips is state of this component |
| `CoffeeFilters` (`features/catalog/coffee-filters`) | `selected` (slugs), `onChange(slugs)` | A `fieldset` named "Filter by tag" (its `legend` is visually hidden) with the five `Tag` filter chips (`COFFEE_TAGS` in `features/catalog/coffee-tags.ts`: Traditional, Special, With milk, Alcoholic, Iced, the slugs and names of the API, checked against the seed by a test). `onChange` always gets the slugs in chip order, so the request is the same whatever order the visitor clicked in. A "Clear filters" secondary button shows before the chips while one is selected |

The data comes from `useCoffees(tags)` (`features/catalog/api.ts`), a TanStack Query hook with the key `["coffees", tags]` that sends `?tags=a,b` (the server filters with AND logic, the app never filters) and keeps the previous list while a new one loads (`placeholderData: keepPreviousData`). The description (`label` on `card`, 3.2:1) is one of the palette pairs below AA; it is not changed (owner decision pending, see the contrast table).

### Navbar and layout (spec 016)

| Piece | Props | What it renders |
| --- | --- | --- |
| `Navbar` (`components/navbar`) | `cartCount?` (default 0; not a positive whole number counts as 0) | `header` (white, `px-page`) with `nav` named "Main" (104 high, at most 1120 wide, centered): the logo link to `/` named "Coffee Delivery, home" (85×40, the image is decorative); the location pill (38 high, 8 padding, radius 6, `purple-light` fill, `purple` pin, `purple-dark` `type-text-regular-s` text "Porto Alegre, RS"; text, not a control); the cart link to `/checkout` (38×38, `yellow-light` fill, `yellow-dark` 22 px cart icon) named "Cart, empty", "Cart, 1 item", or "Cart, N items", with the `Badge` on its top right corner (8 px out) when the count is above 0. Both links have the keyboard focus ring. It is the only component that imports the router |
| `CoffeePhoto` (`features/catalog/coffee-photo`) | `slug`, `name` (the `alt`), `size` (px, set as `width` and `height`), `className` (the size and shape of the place) | The round photo of a coffee: `coffeeImages[slug]`, or an empty `bg-hover` placeholder (`data-photo-placeholder`, `aria-hidden`) for a slug with no photo. The coffee card (120 px) and the order summary (64 px) share it |
| `OrderSummary` (`features/checkout/order-summary`) | none (it reads `useCart()`, `useCoffees()`, and `useCheckoutConfig()`) | A `section` named by its `h2` "Selected coffees" (`aria-busy` while it loads) with a `rounded-summary-card` card. Rows are `li` named by their `h3`: the 64 px `CoffeePhoto`, the compact `Counter`, the secondary `Button` "Remove" (named "Remove <name>") with the trash icon, and the line price. Under them a `dl` with "Items total", "Delivery", and "Total" (the total amount is an `output`, a polite live region), then the full-width primary `Button` "Confirm order", disabled until the catalog and the config have loaded and one row is priced (it sends nothing until spec 025). Loading shows a spinner and "Loading your order…"; a failed request shows an alert and "Try again", which asks again only for what failed. After Remove the focus moves to the heading. When the catalog has loaded, a cart line whose coffee is not in it is removed from the cart |
| `CheckoutForm` (`features/checkout/checkout-form`) | `children`, `onSubmit?(values)` | The one form of the checkout: React Hook Form with the Zod schema (`checkout-form-schema.ts`, today `{ address }`), `mode: "onTouched"`, `noValidate`. It shares the values through the form context, so every card and the Confirm order button are parts of it. A failed submit focuses the first invalid field; `onSubmit` receives the valid, trimmed values (spec 025 passes it) |
| `FormCard` (`features/checkout/checkout-form`) | `icon`, `tone` (`yellow` or `purple`), `title`, `description`, `children` | A `fieldset` named by its `h3`: `card` fill, radius 6, 40 px padding, the icon, the title (Roboto 16, `subtitle`), the line (Text Regular S, `text`), and the fields 32 px below. The address card and the payment card (spec 024) share it |
| `FormInput` (`features/checkout/checkout-form`) | `name` (a path of the form), `label`, `width` (a class), `hint?`, `mask?`, `inputMode?`, `autoComplete?` | The base `Input` connected to the form by name, with the label as its placeholder, the schema message as its `error`, and an optional mask applied on every change. Wrapped in a `div[data-field]` of the given width |
| `AddressCard` (`features/checkout/address-card`) | none | The "Delivery address" `FormCard` with the seven fields: ZIP code (mask `00000-000`, numeric keyboard), Street, Number, Complement (hint "Optional"), Neighborhood, City, and State (capitals, two letters); the widths and gaps are in [DESIGN.md](DESIGN.md). It holds no state of its own |
| `CheckoutPage` (`pages/CheckoutPage.tsx`) | none | A hidden `h1` "Checkout", then, with coffees in the cart, one `CheckoutForm` around a grid of the "Complete your order" section (640 px, with the `AddressCard`) and `OrderSummary` (448 px); with an empty cart, a section "Your cart is empty" and the link "Browse coffees". When the last coffee is removed on the page, the focus moves to the empty-cart heading |
| `AppLayout` (`app/app-layout.tsx`) | none | The "Skip to content" link (hidden until it has focus, then fixed at the top left), the `Navbar` (it reads `useCart()` and passes `totalQuantity` as `cartCount`, so the badge and the link name "Cart, 3 items" follow the cart, also after a reload), and `main#main-content` (`tabIndex` -1, so the skip link moves the focus) around the `Outlet`. Every route renders inside it, so pages render no `main` of their own |

`Icon` (`components/icon`) is the internal helper that inlines `iconSvgs[name]` with `aria-hidden="true"`; use it only inside base components.

#### States this spec defines (the design shows none of them)

| State | Rule |
| --- | --- |
| Focus (buttons, counter buttons, select options, filter chip) | A 2 px `purple` outline with a 2 px offset on `:focus-visible` only, so a keyboard shows it and a mouse click does not. It is an outline, not a shadow |
| Focus (input) | The border turns `yellow-dark` and a 1 px `yellow-dark` outline joins it (`error` when invalid), on every focus. The border alone is not enough against the idle border |
| Disabled | Half opacity, a `not-allowed` cursor, no hover color, skipped by Tab, no click. The counter buttons at a limit are the exception: `aria-disabled` instead of `disabled`, so they keep the focus (same look, no click) |
| Hover | Primary `yellow-dark`; Secondary and options `hover` fill; Icon button `purple`; Counter buttons `hover` fill; unselected chip `yellow-light` fill. Only on enabled controls (`enabled:hover:`; `not-aria-disabled:hover:` on the counter buttons) |
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
| `label` on `card` | Coffee description (14 px) | 3.19 | 4.5 |
| `button` on `input` | Idle input border | 1.07 | 3 |
| `yellow-dark` on `input` | Filled input border | 2.80 | 3 |

Pairs that pass: `text` on `button` 6.35, `title` on `button` 12.49, `text` on `purple-light` 6.50, `text` on `input` 6.82, `text` on `card` 7.14 (the price), `subtitle` on `card` 10.11 (the coffee name), `error` on `background` 5.11, white on `purple-dark` 10.24, white on `purple` 5.03, the `purple` focus ring on `background` 4.82, and the `purple` counter icons on `button` 4.00.

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
