import { STATE_LENGTH, ZIP_CODE_DIGITS, ZIP_CODE_HYPHEN_AFTER } from "./address-schema";

/**
 * The ZIP code as it is typed: only digits, at most eight, with the hyphen after the fifth
 * (`90250440` becomes `90250-440`). The hyphen is added with the sixth digit, not before, so the
 * person can delete back over it.
 */
export function maskZipCode(typed: string): string {
  const digits = typed.replace(/\D/g, "").slice(0, ZIP_CODE_DIGITS);
  if (digits.length <= ZIP_CODE_HYPHEN_AFTER) return digits;
  return `${digits.slice(0, ZIP_CODE_HYPHEN_AFTER)}-${digits.slice(ZIP_CODE_HYPHEN_AFTER)}`;
}

/** The state as it is typed: only the letters A to Z, in capitals, at most two (`rs` is `RS`). */
export function maskState(typed: string): string {
  return typed
    .replace(/[^a-z]/gi, "")
    .toUpperCase()
    .slice(0, STATE_LENGTH);
}
