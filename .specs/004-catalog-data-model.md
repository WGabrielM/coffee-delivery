# Catalog: data model and seed

## Scope
@apps/api/src/main/resources/db/migration/V1__create_catalog_tables.sql - New; `tags`, `coffees`, `coffee_tags`
@apps/api/src/main/resources/db/migration/V2__seed_catalog.sql - New; 5 tags and 14 coffees
@apps/api/src/test/java/com/coffeedelivery/catalog/CatalogMigrationE2ETest.java - New
@.docs/ARCHITECTURE.md - Add the catalog data model
@.docs/BUSINESS.md - List the 14 coffees and the 5 tags

## Context
Part of: Coffee Delivery capstone.
Depends on: @.specs/003-api-foundation.md
The Figma shows 14 coffees at the same price, each with one to three tags. The Figma copy is in Portuguese and the product is in English, so the seed carries the English copy. Prices are stored as integer cents. The app owns the coffee photos and finds them by `slug`, so the database stores no image.

## Business needs
The catalog exists in the database with the exact coffees, prices, and tags the design shows, so every API and screen reads one source.

## Acceptance Criteria
- After migration, tables `tags`, `coffees`, and `coffee_tags` exist; `coffees` has a unique `slug`, a unique `position`, and a check that `price_in_cents` is greater than `0`; `tags` has a unique `slug` and a `position`; `coffee_tags` has a composite primary key and foreign keys to both tables.
- The `tags` table has five rows, in this position order: `traditional` (Traditional), `special` (Special), `with-milk` (With milk), `alcoholic` (Alcoholic), `iced` (Iced).
- The `coffees` table has 14 rows, all with `price_in_cents` `990`, in this position order: `traditional-espresso`, `american-espresso`, `creamy-espresso`, `iced-espresso`, `coffee-with-milk`, `latte`, `cappuccino`, `macchiato`, `mochaccino`, `hot-chocolate`, `cuban`, `hawaiian`, `arabic`, `irish`.
- Tag counts by slug are: `traditional` 9, `special` 5, `with-milk` 6, `alcoholic` 2, `iced` 2; the two alcoholic coffees are `cuban` and `irish`, and the two iced coffees are `iced-espresso` and `cuban`.
- Names and descriptions are the English copy listed in the seed section of `.docs/BUSINESS.md`, one sentence each, with no Portuguese text and no currency symbol.
- Running the migrations a second time changes nothing (Flyway validation passes), and `yarn test:e2e` passes.

## What to do
- Write the e2e test first, against a Testcontainers Postgres: it asserts every point above through plain SQL.
- Write the two migrations; keep seed data in its own migration.
- Use these names (Figma order): Traditional Espresso, American Espresso, Creamy Espresso, Iced Espresso, Coffee with Milk, Latte, Cappuccino, Macchiato, Mochaccino, Hot Chocolate, Cuban, Hawaiian, Arabic, Irish. Translate each description from `docs/design/figma-analysis.md` section 7 and record them in `.docs/BUSINESS.md`.
- Assign tags as the analysis table does: coffees 1 to 3 Traditional; 4 Traditional and Iced; 5 to 9 Traditional and With milk; 10 Special and With milk; 11 Special, Alcoholic, and Iced; 12 and 13 Special; 14 Special and Alcoholic.

## What not to do
- Do not add Java entities, repositories, or endpoints; spec 005 does.
- Do not store image paths or URLs.
- Do not add stock, categories, or any field the design does not use.

## Result
A fresh database has the five tags and the 14 coffees with English copy, `990` cents prices, and the Figma tag assignments.

## Open questions
None
