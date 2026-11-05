import { Link } from "react-router";

import { logo } from "../../assets";
import { Badge } from "../badge/Badge";
import { Icon } from "../icon/Icon";

type NavbarProps = {
  /** The number of items in the cart. Anything that is not a positive whole number counts as 0. */
  cartCount?: number;
};

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple";

function cartName(count: number): string {
  if (count === 0) return "Cart, empty";
  return `Cart, ${count} ${count === 1 ? "item" : "items"}`;
}

/**
 * The bar at the top of every page: the logo (home), the fixed location, and the cart link. It reads
 * no cart state: the layout passes the count. The only component that imports the router, because
 * its two links must navigate without a page reload.
 */
export function Navbar({ cartCount = 0 }: NavbarProps) {
  const count = Number.isInteger(cartCount) && cartCount > 0 ? cartCount : 0;

  return (
    <header className="bg-white px-page">
      <nav
        aria-label="Main"
        className="mx-auto flex h-navbar max-w-content items-center justify-between"
      >
        <Link
          to="/"
          aria-label="Coffee Delivery, home"
          className={`inline-flex rounded-button ${focusRing}`}
        >
          {/* The link already has a name, so the image is decorative. */}
          <img src={logo} alt="" width={85} height={40} />
        </Link>
        <div className="flex items-center gap-3">
          <div className="inline-flex h-9.5 items-center gap-1 rounded-button bg-purple-light px-2">
            <Icon name="map-pin-fill" className="size-5.5 text-purple" />
            <span className="type-text-regular-s text-purple-dark">Porto Alegre, RS</span>
          </div>
          <Link
            to="/checkout"
            aria-label={cartName(count)}
            className={`relative inline-flex size-9.5 items-center justify-center rounded-button bg-yellow-light text-yellow-dark ${focusRing}`}
          >
            <Icon name="shopping-cart-fill" className="size-5.5" />
            <span className="absolute -top-2 -right-2 flex">
              <Badge count={count} />
            </span>
          </Link>
        </div>
      </nav>
    </header>
  );
}
