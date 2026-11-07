import { Link, useParams } from "react-router";

import { ApiError } from "../api";
import { Button } from "../components/button/Button";
import { useOrder } from "../features/orders/api";
import { OrderConfirmation } from "../features/orders/order-confirmation/OrderConfirmation";

/**
 * The confirmation of an order, read from `GET /api/v1/orders/{id}` (nothing is kept in the browser,
 * so a reload shows the same page). Every state has one level 1: the title when the order loaded,
 * "Order not found" for an id the API does not know (a `404`, also for a malformed id), and a
 * hidden "Order confirmation" while it loads or when the request failed.
 */
export function OrderPage() {
  const { orderId = "" } = useParams();
  const order = useOrder(orderId);
  const notFound = order.error instanceof ApiError && order.error.status === 404;

  return (
    <div aria-busy={order.isPending} className="px-page pt-20 pb-20">
      <div className="mx-auto max-w-content">
        {order.data ? (
          <OrderConfirmation order={order.data} />
        ) : notFound ? (
          <section aria-labelledby="order-not-found" className="flex flex-col items-start gap-4">
            <h1 id="order-not-found" className="type-title-l text-subtitle">
              Order not found
            </h1>
            <Link
              to="/"
              className="type-button-g text-purple-dark underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple"
            >
              Back to coffees
            </Link>
          </section>
        ) : (
          <>
            <h1 className="sr-only">Order confirmation</h1>
            {order.isError ? (
              <div role="alert" className="flex flex-col items-start gap-4">
                <p className="type-text-regular-m text-text">We couldn't load your order.</p>
                <Button variant="secondary" onClick={() => void order.refetch()}>
                  Try again
                </Button>
              </div>
            ) : (
              <output className="flex items-center gap-3 type-text-regular-m text-text">
                <span
                  data-spinner
                  aria-hidden="true"
                  className="size-6 animate-spin rounded-round border-2 border-button border-t-purple motion-reduce:animate-none"
                />
                Loading your order…
              </output>
            )}
          </>
        )}
      </div>
    </div>
  );
}
