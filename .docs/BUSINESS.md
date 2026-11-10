# Business

## Product

**Coffee Delivery** is a small web store where a visitor picks coffees from a catalog, builds a cart, enters a delivery address, chooses how to pay on delivery, and confirms the order. It has no accounts: anyone can order. The product is a rebuild, as a postgraduate capstone, of a design called "Coffee Delivery" (see [DESIGN.md](DESIGN.md)).

## Glossary

| Term | Meaning |
| --- | --- |
| Coffee | A drink in the catalog, with a name, a description, a price, and tags |
| Tag | A label on a coffee that the visitor can filter by: Traditional, Special, With milk, Alcoholic, Iced |
| Cart | The coffees and quantities a visitor has chosen; kept in the visitor's browser |
| Order | A confirmed purchase: the coffees with their prices at that moment, the address, the payment method, the delivery fee, and the total |
| Delivery fee | A fixed amount added to every order: `$3.50` |
| Payment method | How the visitor pays on delivery: credit card, debit card, or cash. The product never takes payment data |

## How it works

1. The visitor opens the home page and sees the 14 coffees. They can filter by tags (several tags narrow the list: a coffee must have all of them).
2. On a coffee card the visitor picks a quantity and adds it to the cart. The cart icon in the navbar shows the total number of coffees.
3. In the checkout the visitor reviews the coffees, changes quantities or removes items, and sees the items total, the delivery fee, and the total.
4. The visitor enters the address (ZIP code, street, number, optional complement, neighborhood, city, state) and chooses a payment method.
5. The visitor confirms. If the form has a problem, the page shows it and sends nothing. Otherwise the app sends the cart lines, the address, and the payment method once; the server checks the request, prices the order itself, stores it, and answers with the confirmed order. The app then empties the cart and opens the confirmation page; Back does not return to the form.
6. The confirmation page shows where the order goes (street, number, neighborhood, city, state; not the complement), the delivery estimate (20 to 30 minutes, from the order), and the payment method ("Credit card", "Debit card", or "Cash"). It reads the order from the server by its id, so reloading it, or opening the same link again, shows the same page; it shows no prices, items, or totals. An id the server does not know shows "Order not found" with a link back to the coffees.

## Rules

- Prices are in US dollars. Every coffee costs `$9.90`; the delivery fee is `$3.50`. Amounts are integers in cents everywhere except on screen.
- The server owns prices and totals. It reads prices from the catalog and ignores any price sent by the client. A stored order keeps the prices it was confirmed with.
- Quantity is a whole number from 1 to 99 per coffee. An order has at least one coffee, and each coffee appears once.
- The cart lives in the browser (`localStorage`, key `coffee-delivery:cart:v1`). Reloading the page keeps it; clearing the browser data empties it. It is not shared between tabs or devices.
- The cart keeps only coffee ids and quantities, never prices or names, so a saved cart cannot show a stale price. Adding a coffee that is already in the cart makes its quantity grow, up to 99; the extra is dropped. A saved cart that is damaged is read line by line: the valid lines stay, the others are ignored.
- The checkout rules live in one place on the server (`DeliveryPolicy`, `PaymentMethod`) and are published by `GET /api/v1/checkout-config`: currency USD, a fixed delivery fee of 350 cents, an estimate of 20 to 30 minutes, and the payment methods `credit_card`, `debit_card`, and `cash`. There are no taxes, tips, or discounts.
- The customer must choose one payment method before ordering. The methods shown are the ones `GET /api/v1/checkout-config` returns, with the labels "Credit card", "Debit card", and "Cash" for `credit_card`, `debit_card`, and `cash`; a method the app does not know is not shown. The choice is the API code and nothing else: no card number or other payment data is ever collected. Without a choice the form shows "Choose a payment method".
- The order is sent once per confirmation: while it is being sent the Confirm order button is disabled, and a failed order is never retried by itself. The cart is cleared only after the server confirmed the order. If the server refuses the order, the cart and what the visitor typed stay: a problem with a field is shown under that field, coffees that are no longer available (`422`) and any other refused part show a message above the button, and a network or server failure says "We couldn't place your order. Please try again."
- The delivery address has seven fields. ZIP code is `00000-000` (five digits, a hyphen, three digits; the field adds the hyphen and ignores other characters), state is two capital letters (the field turns letters into capitals and stops at two), street, number, neighborhood, and city are required, and the complement is optional with at most 60 characters. Text is trimmed, so a value of spaces is blank. The app checks these rules with one schema that mirrors the API's, and the messages are: "Enter a ZIP code like 12345-678", "Street is required", "Number is required", "Neighborhood is required", "City is required", "Enter the 2-letter state, like RS", and "Complement must have at most 60 characters". The address is not looked up from the ZIP code and is not saved in the browser.
- Confirming the same order twice gives one order. The app sends a key with the order (the `Idempotency-Key` header); a second click, a retry after a network error, or a second tab that sends the same order with the same key gets the order created the first time, not a new one. The key stays the same while the order (coffees, quantities, address, payment) stays the same, and changes when the person changes it. The same key with a different order is refused (422). An order sent without a key is always created.
- An order is checked in full before anything is stored, and every problem is reported at once. A coffee that is not in the catalog is refused (422), and the whole order is stored or nothing is.
- Example: 1 coffee at `$9.90` plus 2 coffees at `$9.90` plus the `$3.50` fee gives a total of `$33.20`.

## Catalog

The catalog has 14 coffees in this order, all at `$9.90` (`990` cents). The seed data (spec 004) uses exactly this copy.

| # | Slug | Name | Description | Tags |
| --- | --- | --- | --- | --- |
| 1 | `traditional-espresso` | Traditional Espresso | The traditional coffee made with hot water and ground beans | Traditional |
| 2 | `american-espresso` | American Espresso | Diluted espresso, less intense than the traditional | Traditional |
| 3 | `creamy-espresso` | Creamy Espresso | Traditional espresso coffee with creamy foam | Traditional |
| 4 | `iced-espresso` | Iced Espresso | Drink prepared with espresso coffee and ice cubes | Traditional, Iced |
| 5 | `coffee-with-milk` | Coffee with Milk | Half and half of traditional espresso with steamed milk | Traditional, With milk |
| 6 | `latte` | Latte | A shot of espresso coffee with double the milk and creamy foam | Traditional, With milk |
| 7 | `cappuccino` | Cappuccino | Cinnamon drink made of equal parts coffee, milk and foam | Traditional, With milk |
| 8 | `macchiato` | Macchiato | Espresso coffee mixed with a little hot milk and foam | Traditional, With milk |
| 9 | `mochaccino` | Mochaccino | Espresso coffee with chocolate syrup, a little milk and foam | Traditional, With milk |
| 10 | `hot-chocolate` | Hot Chocolate | Drink made with chocolate dissolved in hot milk and coffee | Special, With milk |
| 11 | `cuban` | Cuban | Iced espresso drink with rum, cream and mint | Special, Alcoholic, Iced |
| 12 | `hawaiian` | Hawaiian | Sweet drink prepared with coffee and coconut milk | Special |
| 13 | `arabic` | Arabic | Drink prepared with Arabian coffee beans and spices | Special |
| 14 | `irish` | Irish | Coffee-based drink with Irish whiskey, sugar and whipped cream | Special, Alcoholic |

Tag slugs are `traditional`, `special`, `with-milk`, `alcoholic`, and `iced`. Expected filter results: Traditional 9, Special 5, With milk 6, Alcoholic 2, Iced 2, Special and Alcoholic 2 (Cuban, Irish), Special and Iced 1 (Cuban).

## Out of scope

Accounts and sign-in, online payment, stock, discounts and coupons, order tracking, order history, email, geolocation, and more than one language or currency.
