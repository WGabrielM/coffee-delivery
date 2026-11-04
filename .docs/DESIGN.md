# Design

The interface follows the Coffee Delivery design in Figma. The light theme is the only theme: do not build or ship a dark theme. The visual direction is warm and friendly: a light neutral background, a purple and yellow brand, rounded cards with one distinctive asymmetric corner, round product photos, no shadows.

## Source of truth

- The Figma file "Coffee Delivery - Desafio React (Copy)" has four desktop screens, each 1440 px wide on a `#FAFAFA` background: Home (1440×2293), Checkout, Checkout Filled, and Success (1440×1013).
- `docs/design/figma-analysis.md` records every validated token, component, measure, and text. When the render and the Figma file's paint data disagree, the render wins, and the analysis lists the corrections.
- The design text is in Portuguese and its prices are in reais. The product uses the English text and the US dollar amounts defined in [BUSINESS.md](BUSINESS.md) and [CONVENTIONS.md](CONVENTIONS.md).
- The design shows no hover, focus, disabled, error, or selected-filter states for most components. Specs define them from the tokens and record them in [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md).

## Screens

| Screen | Route | Content |
| --- | --- | --- |
| Home | `/` | Navbar, hero (title, subtitle, four benefits, cup image), "Our coffees" with tag filters, grid of coffee cards |
| Checkout | `/checkout` | Left column "Complete your order" with the delivery address card and the payment card; right column "Selected coffees" with the order summary |
| Checkout Filled | `/checkout` | The same screen with the form filled and credit card selected |
| Success | `/orders/:orderId` | Confirmation title, order card (address, delivery estimate, payment), delivery illustration |

## Layout rules (desktop, 1440 px)

- Page margin 160 px, so the content is 1120 px wide. Navbar 104 px high on white.
- Home grid: four columns of 256 px cards, 32 px between columns, 40 px between rows. The last row has two cards, aligned to the left.
- Checkout: left column 640 px at x=160, right column 448 px at x=832. Form rows: 12 px between columns, 16 px between rows.
- Corners: buttons, counter, location pill, and payment options 6 px; inputs 4 px; tags 100 px; round icons 1000 px; coffee card 6/36/6/36 px (top-left, top-right, bottom-right, bottom-left); order summary card 6/44/6/44 px; form cards 6 px; success order card 6/36/6/36 px with a 1 px gradient border from `#DBAC2C` to `#8047F8`.
- No shadows. The hero has soft, blurred yellow and purple shapes in the background.
- Tablet and mobile layouts are not in the design; spec 027 derives them.

## Accessibility

All color pairings MUST meet WCAG AA contrast (4.5:1 for body text, 3:1 for large text and UI controls). Check the design tokens that carry text on tinted backgrounds, such as `#C47F17` on `#F1E9C9`, before using them for small text.
