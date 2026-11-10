import { useParams } from "react-router";

import { OrderStatus } from "../features/orders/order-status/OrderStatus";

/** `/orders/:orderId`: the order of the URL. The page only reads the route and composes. */
export function OrderPage() {
  const { orderId = "" } = useParams();
  return <OrderStatus orderId={orderId} />;
}
