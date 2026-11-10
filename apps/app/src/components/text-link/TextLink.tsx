import type { ReactNode } from "react";
import { Link } from "react-router";

type TextLinkProps = {
  /** The path inside the app, for example "/". */
  to: string;
  children: ReactNode;
};

/**
 * A link inside the text of a screen ("Back to coffees", "Browse coffees"): underlined, in
 * `purple-dark`, at least 24 px high (WCAG 2.2, 2.5.8), with the focus ring of the design. It moves
 * inside the app without a page load, so, with the navbar, it is the only component that imports
 * the router.
 */
export function TextLink({ to, children }: TextLinkProps) {
  return (
    <Link
      to={to}
      className="inline-flex min-h-6 items-center type-button-g text-purple-dark underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple"
    >
      {children}
    </Link>
  );
}
