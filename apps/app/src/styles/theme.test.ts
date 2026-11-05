import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const theme = readFileSync(join(import.meta.dirname, "theme.css"), "utf8");

/** Every `--name: value;` declaration inside the `@theme static { ... }` block. */
function themeVariables(): Map<string, string> {
  const block = /@theme static \{([\s\S]*?)\n\}/.exec(theme)?.[1] ?? "";
  const variables = new Map<string, string>();
  for (const match of block.matchAll(/^\s*(--[\w*-]+):\s*([^;]+);/gm)) {
    variables.set(match[1]!, match[2]!.trim());
  }
  return variables;
}

/** The declarations of `@utility <name> { ... }` as a property-to-value map. */
function utility(name: string): Record<string, string> {
  const block = new RegExp(`@utility ${name} \\{([^}]*)\\}`).exec(theme)?.[1];
  if (block === undefined) throw new Error(`@utility ${name} is missing from theme.css`);
  return Object.fromEntries(
    [...block.matchAll(/([\w-]+):\s*([^;]+);/g)].map((match) => [match[1]!, match[2]!.trim()]),
  );
}

describe("colors", () => {
  const colors: Record<string, string> = {
    white: "#FFFFFF",
    background: "#FAFAFA",
    card: "#F3F2F2",
    input: "#EDEDED",
    button: "#E6E5E5",
    hover: "#D7D5D5",
    label: "#8D8686",
    text: "#574F4D",
    subtitle: "#403937",
    title: "#272221",
    "purple-light": "#EBE5F9",
    purple: "#8047F8",
    "purple-dark": "#4B2995",
    "yellow-light": "#F1E9C9",
    yellow: "#DBAC2C",
    "yellow-dark": "#C47F17",
    "hero-blob": "#EBC136",
    error: "#CC2937",
  };

  it.each(Object.entries(colors))("%s is %s", (name, hex) => {
    expect(themeVariables().get(`--color-${name}`)?.toUpperCase()).toBe(hex);
  });

  it("defines exactly the 18 design colors and drops the default palette", () => {
    const defined = [...themeVariables().keys()].filter(
      (name) => name.startsWith("--color-") && name !== "--color-*",
    );

    expect(defined.toSorted()).toEqual(
      Object.keys(colors)
        .map((name) => `--color-${name}`)
        .toSorted(),
    );
    expect(themeVariables().get("--color-*")).toBe("initial");
  });
});

describe("typography", () => {
  it("names the two font families, Roboto for the body and Baloo 2 for titles", () => {
    expect(themeVariables().get("--font-*")).toBe("initial");
    expect(themeVariables().get("--font-body")).toMatch(/^"Roboto",/);
    expect(themeVariables().get("--font-title")).toMatch(/^"Baloo 2",/);
  });

  const baloo = "var(--font-title)";
  const roboto = "var(--font-body)";

  // name: [family, weight, size in px, line height, letter spacing, case]
  const styles: Record<string, [string, number, number, number, string, string]> = {
    "title-xl": [baloo, 800, 48, 1.3, "normal", "none"],
    "title-l": [baloo, 800, 32, 1.3, "normal", "none"],
    "title-m": [baloo, 800, 24, 1.3, "normal", "none"],
    "title-s": [baloo, 700, 20, 1.3, "normal", "none"],
    "title-xs": [baloo, 700, 18, 1.3, "normal", "none"],
    "text-regular-l": [roboto, 400, 20, 1.3, "normal", "none"],
    "text-regular-m": [roboto, 400, 16, 1.3, "normal", "none"],
    "text-regular-s": [roboto, 400, 14, 1.3, "normal", "none"],
    "text-bold-l": [roboto, 700, 20, 1.3, "normal", "none"],
    "text-bold-m": [roboto, 700, 16, 1.3, "normal", "none"],
    "text-bold-s": [roboto, 700, 12, 1.3, "-0.06em", "none"],
    "subtitle-xl": [roboto, 700, 24, 1.3, "normal", "none"],
    "button-g": [roboto, 700, 14, 1.6, "normal", "uppercase"],
    "button-s": [roboto, 400, 12, 1.6, "normal", "uppercase"],
    tag: [roboto, 700, 10, 1.3, "normal", "uppercase"],
    "tag-l": [roboto, 700, 12, 1.3, "normal", "uppercase"],
  };

  it("defines the 16 text styles of the analysis", () => {
    expect(Object.keys(styles)).toHaveLength(16);
  });

  it.each(Object.entries(styles))(
    "type-%s",
    (name, [family, weight, px, line, spacing, textCase]) => {
      expect(utility(`type-${name}`)).toEqual({
        "font-family": family,
        "font-weight": String(weight),
        "font-size": `${px / 16}rem`,
        "line-height": String(line),
        "letter-spacing": spacing,
        "text-transform": textCase,
      });
    },
  );

  it("has no text style outside the design", () => {
    const names = [...theme.matchAll(/@utility (type-[\w-]+)/g)].map((match) => match[1]);

    expect(names.toSorted()).toEqual(
      Object.keys(styles)
        .map((name) => `type-${name}`)
        .toSorted(),
    );
  });

  it("drops the default Tailwind font sizes so only the design scale exists", () => {
    expect(themeVariables().get("--text-*")).toBe("initial");
  });
});

describe("layout and shape", () => {
  it.each([
    ["--spacing-page", "160px"],
    ["--spacing-navbar", "104px"],
    ["--container-content", "1120px"],
    ["--radius-*", "initial"],
    ["--radius-input", "4px"],
    ["--radius-button", "6px"],
    ["--radius-tag", "100px"],
    ["--radius-round", "1000px"],
  ])("%s is %s", (name, value) => {
    expect(themeVariables().get(name)).toBe(value);
  });

  it.each([
    ["rounded-coffee-card", "6px 36px 6px 36px"],
    ["rounded-summary-card", "6px 44px 6px 44px"],
    ["rounded-order-card", "6px 36px 6px 36px"],
  ])("%s has the asymmetric corners of the design", (name, radius) => {
    expect(utility(name)).toEqual({ "border-radius": radius });
  });

  it("has no shadows: the design has none, so no shadow utility can be used", () => {
    const namespaces = ["--shadow-*", "--inset-shadow-*", "--drop-shadow-*", "--text-shadow-*"];

    expect(namespaces.map((namespace) => themeVariables().get(namespace))).toEqual([
      "initial",
      "initial",
      "initial",
      "initial",
    ]);
  });
});
