import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
  // The cart is saved in the browser; a test must never see the cart of the one before it.
  // A test file that runs in Node (no DOM) has no storage.
  if (typeof localStorage !== "undefined") localStorage.clear();
});
