import { Outlet } from "react-router";

import { Navbar } from "../components/navbar/Navbar";

/**
 * The frame shared by every route: a skip link, the navbar, and `main` around the page. The cart
 * count is 0 until spec 021 wires the cart state.
 */
export function AppLayout() {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-10 focus:rounded-button focus:bg-white focus:px-4 focus:py-3 focus:type-button-s focus:text-purple-dark focus:outline-2 focus:outline-offset-2 focus:outline-purple"
      >
        Skip to content
      </a>
      <Navbar />
      {/* tabIndex -1: the skip link can move the focus here without adding a tab stop. */}
      <main id="main-content" tabIndex={-1} className="focus:outline-none">
        <Outlet />
      </main>
    </>
  );
}
