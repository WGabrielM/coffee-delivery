import { iconSvgs, type IconName } from "../../assets";

type IconProps = {
  name: IconName;
  /** Size and color of the icon, for example `size-4 text-purple`. Only the base components and `FormCard` pass it. */
  className?: string;
};

/**
 * One of the 13 icons of the design, drawn inline so it takes the text color (`currentColor`).
 * It is decorative: the component that uses it names the control, so assistive technology skips it.
 * The markup is a committed, generated asset (scripts/extract-figma-assets.mjs), never user input.
 */
export function Icon({ name, className = "" }: IconProps) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 [&>svg]:size-full ${className}`}
      // trim() drops the newline that ends the SVG file, so the wrapper has no text node of its own.
      dangerouslySetInnerHTML={{ __html: iconSvgs[name].trim() }}
    />
  );
}
