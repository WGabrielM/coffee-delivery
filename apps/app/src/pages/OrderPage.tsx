import { useParams } from "react-router";

import { ApiError } from "../api";
import { ErrorState } from "../components/error-state/ErrorState";
import { LoadingState } from "../components/loading-state/LoadingState";
import { TextLink } from "../components/text-link/TextLink";
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
    <div aria-busy={order.isPending} className="px-page pt-10 pb-16 lg:pt-20 lg:pb-20">
      <div className="mx-auto max-w-content">
        {order.data ? (
          <OrderConfirmation order={order.data} />
        ) : notFound ? (
          <section aria-labelledby="order-not-found" className="flex flex-col items-start gap-4">
            <h1 id="order-not-found" className="type-title-l text-subtitle">
              Order not found
            </h1>
            <TextLink to="/">Back to coffees</TextLink>
          </section>
        ) : (
          <>
            <h1 className="sr-only">Order confirmation</h1>
            {order.isError ? (
              <ErrorState
                message="We couldn't load your order."
                onRetry={() => void order.refetch()}
              />
            ) : (
              <LoadingState text="Loading your order…" />
            )}
          </>
        )}
      </div>
    </div>
  );
}
