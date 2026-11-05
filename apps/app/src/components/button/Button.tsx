import type { ComponentPropsWithRef, ReactNode } from "react";

import type { IconName } from "../../assets";
import { Icon } from "../icon/Icon";

type NativeProps = Omit<ComponentPropsWithRef<"button">, "className" | "style" | "children">;

type TextButtonProps = NativeProps & {
  /** `primary` is the yellow action (Confirm order); `secondary` is the neutral one (Remove). */
  variant?: "primary" | "secondary";
  /** An icon drawn before the label. The design has one on the secondary button (the trash). */
  icon?: IconName;
  /** Stretches the button to its container, as the Confirm order button is in the checkout. */
  fullWidth?: boolean;
  children: ReactNode;
};

type IconButtonProps = NativeProps & {
  variant: "icon";
  icon: IconName;
  /** An icon button has no text, so its name is required. */
  "aria-label": string;
  fullWidth?: never;
  children?: never;
};

export type ButtonProps = TextButtonProps | IconButtonProps;

// A 2 px purple outline on keyboard focus only: `:focus-visible` is not matched by a mouse click.
const base =
  "inline-flex items-center justify-center gap-1 rounded-button transition-[color,background-color,border-color] motion-reduce:transition-none " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple " +
  "disabled:cursor-not-allowed disabled:opacity-50";

const variants = {
  primary: "min-h-11.5 bg-yellow px-4 type-button-g text-white enabled:hover:bg-yellow-dark",
  secondary: "h-8 bg-button px-2 type-button-s text-text enabled:hover:bg-hover",
  icon: "size-9.5 bg-purple-dark text-white enabled:hover:bg-purple",
} as const;

/** The three buttons of the design. Always a native `button`, so it works with the keyboard as is. */
export function Button(props: ButtonProps) {
  if (props.variant === "icon") {
    const { variant, icon, fullWidth: _fullWidth, children: _children, ...rest } = props;
    return (
      <button type="button" {...rest} className={`${base} ${variants[variant]}`}>
        <Icon name={icon} className="size-5.5" />
      </button>
    );
  }

  const { variant = "primary", icon, fullWidth = false, children, ...rest } = props;
  return (
    <button
      type="button"
      {...rest}
      className={`${base} ${variants[variant]}${fullWidth ? " w-full" : ""}`}
    >
      {icon === undefined ? null : (
        <Icon name={icon} className={variant === "secondary" ? "size-4 text-purple" : "size-4"} />
      )}
      {children}
    </button>
  );
}
