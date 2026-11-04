import type { RouteObject } from "react-router";

import { CheckoutPage } from "../pages/CheckoutPage";
import { HomePage } from "../pages/HomePage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { OrderPage } from "../pages/OrderPage";

export const routes: RouteObject[] = [
  { path: "/", element: <HomePage /> },
  { path: "/checkout", element: <CheckoutPage /> },
  { path: "/orders/:orderId", element: <OrderPage /> },
  { path: "*", element: <NotFoundPage /> },
];
