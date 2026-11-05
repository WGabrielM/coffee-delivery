import { useId, type ComponentPropsWithRef } from "react";

type NativeProps = Omit<
  ComponentPropsWithRef<"input">,
  "className" | "style" | "id" | "children" | "aria-invalid" | "aria-describedby"
>;

type InputProps = NativeProps & {
  /** The accessible name. It is drawn visually hidden: the design shows the placeholder instead. */
  label: string;
  /** A hint at the right of the field, for example "Optional". */
  hint?: string;
  /** The message shown below the field. Setting it marks the field invalid. */
  error?: string;
};

const field =
  "h-10.5 w-full rounded-input border bg-input px-3 type-text-regular-s text-text placeholder:text-label " +
  "disabled:cursor-not-allowed disabled:opacity-50";

// The border of the design is `button` when idle and `yellow-dark` when active or filled. A border
// alone is below 3:1 against the idle one, so focus also draws a 1 px outline of the same color.
const idle =
  "border-button not-placeholder-shown:border-yellow-dark " +
  "focus:border-yellow-dark focus:outline-1 focus:outline-yellow-dark";
const invalid = "border-error focus:outline-1 focus:outline-error";

/** The text field of the checkout form. A native `input`; the parent owns the value and the error. */
export function Input({ label, hint, error, placeholder, ...rest }: InputProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint === undefined ? "" : hintId, error === undefined ? "" : errorId]
    .filter(Boolean)
    .join(" ");

  return (
    <div>
      <div className="relative">
        <label htmlFor={id} className="sr-only">
          {label}
        </label>
        <input
          // A single space keeps `:placeholder-shown` working on a field that has no placeholder,
          // so the filled border applies to every field.
          placeholder={placeholder ?? " "}
          {...rest}
          id={id}
          aria-invalid={error === undefined ? undefined : true}
          aria-describedby={describedBy === "" ? undefined : describedBy}
          className={`${field} ${error === undefined ? idle : invalid}${hint === undefined ? "" : " pr-20"}`}
        />
        {hint === undefined ? null : (
          // Roboto Italic 12 is the one text of the design with no named style (it is the
          // "Optional" hint), so it is set here and not as a `type-*` utility.
          <span
            id={hintId}
            className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 font-body text-[0.75rem] leading-[1.3] font-normal text-label italic"
          >
            {hint}
          </span>
        )}
      </div>
      {error === undefined ? null : (
        <p id={errorId} aria-live="polite" className="mt-1 type-text-regular-s text-error">
          {error}
        </p>
      )}
    </div>
  );
}
