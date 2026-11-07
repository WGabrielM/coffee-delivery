import { z } from "zod";

// The rules of the API (spec 010, `CreateOrderRequestValidator`) and of the design, named once. The
// masks of the fields use the same numbers.
export const ZIP_CODE_PATTERN = /^\d{5}-\d{3}$/;
export const ZIP_CODE_DIGITS = 8;
export const ZIP_CODE_HYPHEN_AFTER = 5;
export const STATE_PATTERN = /^[A-Z]{2}$/;
export const STATE_LENGTH = 2;
export const MAX_COMPLEMENT_LENGTH = 60;

/** A text the API trims and does not accept blank. */
const required = (message: string) => z.string().trim().min(1, message);

/**
 * The delivery address, with the same rules as `POST /api/v1/orders`. Text is trimmed, so a value of
 * spaces is blank. The schema is strict: the fields turn their input into the right shape (the ZIP
 * code mask, the state in capitals) before it gets here.
 */
export const addressSchema = z.object({
  zipCode: z.string().trim().regex(ZIP_CODE_PATTERN, "Enter a ZIP code like 12345-678"),
  street: required("Street is required"),
  number: required("Number is required"),
  complement: z
    .string()
    .trim()
    .max(MAX_COMPLEMENT_LENGTH, `Complement must have at most ${MAX_COMPLEMENT_LENGTH} characters`),
  neighborhood: required("Neighborhood is required"),
  city: required("City is required"),
  state: z.string().trim().regex(STATE_PATTERN, "Enter the 2-letter state, like RS"),
});

/** What the person types: every field is text (the complement may be empty). */
export type AddressValues = z.input<typeof addressSchema>;
