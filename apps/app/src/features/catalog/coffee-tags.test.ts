import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { COFFEE_TAGS, orderTags } from "./coffee-tags";

const seed = readFileSync(
  join(import.meta.dirname, "../../../../api/src/main/resources/db/migration/V2__seed_catalog.sql"),
  "utf8",
);

describe("COFFEE_TAGS", () => {
  it("has the five tags of the catalog seed, with the same slugs and names, in the same order", () => {
    const rows = [...seed.matchAll(/\('([a-z-]+)',\s*'([^']+)',\s*(\d+)\)/g)]
      .map(([, slug, name, position]) => ({ slug, name, position: Number(position) }))
      .toSorted((a, b) => a.position - b.position);

    expect(rows).toHaveLength(5);
    expect(COFFEE_TAGS.map(({ slug, name }) => ({ slug, name }))).toEqual(
      rows.map(({ slug, name }) => ({ slug, name })),
    );
  });
});

describe("orderTags", () => {
  it("puts the slugs in the order of the chips, whatever order they were picked in", () => {
    expect(orderTags(["iced", "special"])).toEqual(["special", "iced"]);
    expect(orderTags(["alcoholic", "iced", "traditional"])).toEqual([
      "traditional",
      "alcoholic",
      "iced",
    ]);
  });

  it("keeps each slug once and drops a slug that is not a chip", () => {
    expect(orderTags(["iced", "iced", "hot", "special"])).toEqual(["special", "iced"]);
  });

  it("returns an empty list for an empty list", () => {
    expect(orderTags([])).toEqual([]);
  });
});
