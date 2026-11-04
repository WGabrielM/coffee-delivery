// @vitest-environment node
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const html = readFileSync(new URL("../../index.html", import.meta.url), "utf8");

describe("index.html", () => {
  it("declares English", () => {
    expect(html).toMatch(/<html[^>]*\slang="en"/);
  });

  it("has the title Coffee Delivery", () => {
    expect(html).toMatch(/<title>Coffee Delivery<\/title>/);
  });

  it("has a responsive viewport and mounts the app in #root", () => {
    expect(html).toMatch(
      /<meta name="viewport" content="width=device-width, initial-scale=1(\.0)?"/,
    );
    expect(html).toContain('<div id="root"></div>');
    expect(html).toContain('src="/src/main.tsx"');
  });
});
