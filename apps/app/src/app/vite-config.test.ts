import { describe, expect, it } from "vitest";

import config from "../../vite.config";

describe("vite config", () => {
  it("serves the dev server on port 5173 and fails instead of choosing another port", () => {
    expect(config.server?.port).toBe(5173);
    expect(config.server?.strictPort).toBe(true);
  });

  it("proxies /api to the API on port 3000", () => {
    const proxy = config.server?.proxy as Record<string, { target?: string }> | undefined;

    expect(proxy?.["/api"]?.target).toBe("http://localhost:3000");
  });

  it("runs the preview server on the same port and proxy", () => {
    const proxy = config.preview?.proxy as Record<string, { target?: string }> | undefined;

    expect(config.preview?.port).toBe(5173);
    expect(proxy?.["/api"]?.target).toBe("http://localhost:3000");
  });
});
