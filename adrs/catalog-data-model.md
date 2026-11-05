# ADR: Catalog data model and seed

- Status: Accepted and verified
- Date: 2026-11-04
- Spec: [.specs/004-catalog-data-model.md](../.specs/004-catalog-data-model.md)
- Plan: [plans/004-catalog-data-model-plan.md](../plans/004-catalog-data-model-plan.md)

## Context

The catalog must exist in the database with the exact coffees, prices, and tags of the design, so that every endpoint and screen reads one source. The Figma copy is in Portuguese and the product is in English.

## Decisions

1. **Two migrations.** `V1__create_catalog_tables.sql` creates `tags`, `coffees`, and `coffee_tags`; `V2__seed_catalog.sql` holds the data. Seed data stays apart from the schema, so a later change to the copy does not touch the schema migration.
2. **Database-generated UUIDs** (`gen_random_uuid()`, built into PostgreSQL 13 and later; no extension). The seed fixes no id and links coffees to tags by joining on slugs. Ids therefore differ between databases, and clients must read them from the API.
3. **Named constraints** (`pk_`, `uq_`, `ck_`, `fk_`, `ix_` prefixes) so a violation reads well in logs and tests.
4. **Money is `INTEGER` cents** with a check that the price is greater than 0. The seed uses 990 for every coffee.
5. **`tags.position` is unique** although the spec only asks for a position: the tag order is part of the response contract of spec 005.
6. **An index on `coffee_tags (tag_id)`** supports the tag filter of spec 006; the composite primary key already covers lookups by coffee.
7. **No image column.** The app finds photos by `slug`.
8. **The test is one end-to-end class on the real application context.** `CatalogMigrationE2ETest` uses plain SQL against the Testcontainers PostgreSQL: tables, constraints (each violation must raise `DataIntegrityViolationException`), the 5 tags, the 14 coffees in order at 990, the English copy (ASCII only, no `$`), the tags of each coffee, the tag counts, and idempotence through the `Flyway` bean (`validate()` passes, `migrate()` runs zero migrations). `PostgresContainerSupport` became public so tests in other packages share the container.
9. **A build-directory knob for the API.** `-PcoffeeBuildDir=<folder>` (or `ORG_GRADLE_PROJECT_coffeeBuildDir`) moves Gradle's output out of the repository. A repository inside OneDrive makes Gradle fail with `Failed to clean up stale outputs`. The last folder must be named `build`: ArchUnit's `DoNotIncludeTests` finds test classes by the path `/build/classes/`, and `ArchitectureTest` fails otherwise. The `e2eTest` task is now registered with `tasks.register`, which removes a Gradle 10 deprecation warning.

## Consequences

- Specs 005 and 006 read these tables; spec 009 adds the orders tables as `V3`.
- Coffee ids are not stable across environments. A load scenario or a test that needs one must read `GET /api/v1/coffees` first.
- Changing a seeded name or description later means a new migration, never an edit to `V2`: Flyway validates the checksum of applied migrations.
- No new library.
