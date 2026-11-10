import type { RouteObject } from "react-router";

import { HomePage } from "../pages/HomePage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { AppLayout } from "./app-layout";

// Every route renders inside the layout (skip link, navbar, main). The pages render no `main`.
//
// Home and the not-found page are in the first chunk. The checkout and the order page are loaded
// when the person goes there (React Hook Form, Zod, and the forms are not needed by Home): the
// router waits for the chunk before it changes the page, and if the chunk cannot be loaded it shows
// its own error page instead of a blank one. On a first visit to those paths the layout (skip link
// and navbar) is shown while the chunk loads.
export const routes: RouteObject[] = [
  {
    element: <AppLayout />,
    HydrateFallback: AppLayout,
    children: [
      { path: "/", element: <HomePage /> },
      {
        path: "/checkout",
        lazy: async () => ({ Component: (await import("../pages/CheckoutPage")).CheckoutPage }),
      },
      {
        path: "/orders/:orderId",
        lazy: async () => ({ Component: (await import("../pages/OrderPage")).OrderPage }),
      },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
];
