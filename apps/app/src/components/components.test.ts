import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const components = import.meta.dirname;
// Paths use "/" whatever the operating system is.
const list = () =>
  readdirSync(components, { recursive: true, encoding: "utf8" }).map((file) =>
    file.replaceAll("\\", "/"),
  );
const sources = list()
  .filter((file) => /\.tsx?$/.test(file) && !/\.test\.tsx?$/.test(file))
  .toSorted();

describe("src/components", () => {
  it("has a source file for each component", () => {
    expect(sources).toEqual(
      expect.arrayContaining([
        "badge/Badge.tsx",
        "button/Button.tsx",
        "counter/Counter.tsx",
        "input/Input.tsx",
        "select-option/SelectOption.tsx",
        "select-option/SelectOptionGroup.tsx",
        "tag/Tag.tsx",
      ]),
    );
  });

  it("has a test file for each component", () => {
    const tests = list().filter((file) => file.endsWith(".test.tsx"));

    expect(tests).toEqual(
      expect.arrayContaining([
        "badge/Badge.test.tsx",
        "button/Button.test.tsx",
        "counter/Counter.test.tsx",
        "input/Input.test.tsx",
        "select-option/SelectOptionGroup.test.tsx",
        "tag/Tag.test.tsx",
      ]),
    );
  });

  it("has no hex color literal in any component source: colors come from the tokens", () => {
    const withHex = sources.filter((file) =>
      /#[0-9a-fA-F]{3,8}\b/.test(readFileSync(join(components, file), "utf8")),
    );

    expect(withHex).toEqual([]);
  });

  it("has no rgb(), hsl(), or arbitrary color class either", () => {
    const offenders = sources.filter((file) =>
      /\b(?:rgba?|hsla?|oklch)\(|(?:bg|text|border|outline|fill|stroke)-\[#/.test(
        readFileSync(join(components, file), "utf8"),
      ),
    );

    expect(offenders).toEqual([]);
  });

  it("does not fetch data, read the cart, or route: components are presentational", () => {
    const offenders = sources.filter((file) =>
      /\bfetch\(|@tanstack|react-router|from "\.\.\/\.\.\/(?:api|features|app)/.test(
        readFileSync(join(components, file), "utf8"),
      ),
    );

    expect(offenders).toEqual([]);
  });

  it("takes no className prop: a screen cannot restyle a component", () => {
    const offenders = sources.filter((file) =>
      /\bclassName\??:\s*string/.test(readFileSync(join(components, file), "utf8")),
    );

    expect(offenders.filter((file) => !file.startsWith("icon/"))).toEqual([]);
  });
});
