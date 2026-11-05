import type { RouteObject } from "react-router";

import { CheckoutPage } from "../pages/CheckoutPage";
import { HomePage } from "../pages/HomePage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { OrderPage } from "../pages/OrderPage";
import { AppLayout } from "./app-layout";

// Every route renders inside the layout (skip link, navbar, main). The pages render no `main`.
export const routes: RouteObject[] = [
  {
    element: <AppLayout />,
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/checkout", element: <CheckoutPage /> },
      { path: "/orders/:orderId", element: <OrderPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
];
