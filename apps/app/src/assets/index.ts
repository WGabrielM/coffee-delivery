// Every brand and product asset of the app, extracted from the Figma file by
// `node scripts/extract-figma-assets.mjs` (see docs/design/assets-mapping.md). Each file is imported
// by name, so a missing file fails the type check and the build, never the browser.
import americanEspresso from "./coffees/american-espresso.webp";
import arabic from "./coffees/arabic.webp";
import cappuccino from "./coffees/cappuccino.webp";
import coffeeWithMilk from "./coffees/coffee-with-milk.webp";
import creamyEspresso from "./coffees/creamy-espresso.webp";
import cuban from "./coffees/cuban.webp";
import hawaiian from "./coffees/hawaiian.webp";
import hotChocolate from "./coffees/hot-chocolate.webp";
import icedEspresso from "./coffees/iced-espresso.webp";
import irish from "./coffees/irish.webp";
import latte from "./coffees/latte.webp";
import macchiato from "./coffees/macchiato.webp";
import mochaccino from "./coffees/mochaccino.webp";
import traditionalEspresso from "./coffees/traditional-espresso.webp";
import heroImage from "./hero/hero.webp";
import bank from "./icons/bank.svg?raw";
import coffeeFill from "./icons/coffee-fill.svg?raw";
import creditCard from "./icons/credit-card.svg?raw";
import currencyDollar from "./icons/currency-dollar.svg?raw";
import mapPinFill from "./icons/map-pin-fill.svg?raw";
import mapPinLine from "./icons/map-pin-line.svg?raw";
import minusBold from "./icons/minus-bold.svg?raw";
import money from "./icons/money.svg?raw";
import packageFill from "./icons/package-fill.svg?raw";
import plusBold from "./icons/plus-bold.svg?raw";
import shoppingCartFill from "./icons/shopping-cart-fill.svg?raw";
import timerFill from "./icons/timer-fill.svg?raw";
import trash from "./icons/trash.svg?raw";
import logo from "./logo/logo.svg";
import deliveryIllustration from "./success/delivery-illustration.svg";

/** The slugs of the catalog (apps/api seed), in the order of the grid. */
export const COFFEE_SLUGS = [
  "traditional-espresso",
  "american-espresso",
  "creamy-espresso",
  "iced-espresso",
  "coffee-with-milk",
  "latte",
  "cappuccino",
  "macchiato",
  "mochaccino",
  "hot-chocolate",
  "cuban",
  "hawaiian",
  "arabic",
  "irish",
] as const;

export type CoffeeSlug = (typeof COFFEE_SLUGS)[number];

/** The photo of each coffee: the URL of a square WebP of 240 px (twice the 120 px of the card) with a transparent background. */
export const coffeeImages: Readonly<Record<CoffeeSlug, string>> = {
  "traditional-espresso": traditionalEspresso,
  "american-espresso": americanEspresso,
  "creamy-espresso": creamyEspresso,
  "iced-espresso": icedEspresso,
  "coffee-with-milk": coffeeWithMilk,
  latte,
  cappuccino,
  macchiato,
  mochaccino,
  "hot-chocolate": hotChocolate,
  cuban,
  hawaiian,
  arabic,
  irish,
};

/** The 13 icons of the design (Phosphor), named as in the Figma Style Guide. */
export const ICON_NAMES = [
  "shopping-cart-fill",
  "timer-fill",
  "package-fill",
  "coffee-fill",
  "map-pin-fill",
  "map-pin-line",
  "currency-dollar",
  "trash",
  "plus-bold",
  "minus-bold",
  "credit-card",
  "money",
  "bank",
] as const;

export type IconName = (typeof ICON_NAMES)[number];

/**
 * The source of each icon, a 32 by 32 SVG that is drawn in `currentColor`. It is markup, not a URL,
 * because only an inline SVG can take the color of the text around it.
 */
export const iconSvgs: Readonly<Record<IconName, string>> = {
  "shopping-cart-fill": shoppingCartFill,
  "timer-fill": timerFill,
  "package-fill": packageFill,
  "coffee-fill": coffeeFill,
  "map-pin-fill": mapPinFill,
  "map-pin-line": mapPinLine,
  "currency-dollar": currencyDollar,
  trash,
  "plus-bold": plusBold,
  "minus-bold": minusBold,
  "credit-card": creditCard,
  money,
  bank,
};

/** The URL of the logo (85 by 40, in its own colors). */
export { logo };

/** The URL of the hero image of the Home screen (a WebP of 952 by 721, twice the 476 by 360 of the design). */
export { heroImage };

/** The URL of the delivery illustration of the Success screen (492 by 293, in its own colors). */
export { deliveryIllustration };
