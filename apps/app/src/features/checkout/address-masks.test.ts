import { describe, expect, it } from "vitest";

import { maskState, maskZipCode } from "./address-masks";

describe("maskZipCode", () => {
  it.each([
    ["", ""],
    ["9", "9"],
    ["90250", "90250"],
    ["902504", "90250-4"],
    ["90250440", "90250-440"],
  ])("turns %j into %j", (typed, shown) => {
    expect(maskZipCode(typed)).toBe(shown);
  });

  it("adds the hyphen after the fifth digit and ignores the extra digits", () => {
    expect(maskZipCode("902504409999")).toBe("90250-440");
    expect(maskZipCode("90250-440999")).toBe("90250-440");
  });

  it("keeps only digits", () => {
    expect(maskZipCode("9a0b2c5d0e4f4g0")).toBe("90250-440");
    expect(maskZipCode("abc")).toBe("");
    expect(maskZipCode(" 90 250 ")).toBe("90250");
  });

  it("is stable: masking a masked value changes nothing", () => {
    expect(maskZipCode(maskZipCode("90250440"))).toBe("90250-440");
  });

  it("lets the person delete back over the hyphen", () => {
    // "90250-4" minus the 4 is "90250-": the hyphen goes, and returns with the next digit.
    expect(maskZipCode("90250-")).toBe("90250");
  });
});

describe("maskState", () => {
  it.each([
    ["", ""],
    ["r", "R"],
    ["rs", "RS"],
    ["RS", "RS"],
  ])("turns %j into %j", (typed, shown) => {
    expect(maskState(typed)).toBe(shown);
  });

  it("stops at two letters", () => {
    expect(maskState("rsp")).toBe("RS");
  });

  it("keeps only letters, so a digit or a space is ignored", () => {
    expect(maskState("r1s")).toBe("RS");
    expect(maskState("1")).toBe("");
    expect(maskState(" r s ")).toBe("RS");
  });
});
