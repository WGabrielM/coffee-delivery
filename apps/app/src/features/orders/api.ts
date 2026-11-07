import { useQuery } from "@tanstack/react-query";

import { apiGet, type RequestOptions } from "../../api";
import type { Order } from "../checkout/api";

/** GET /api/v1/orders/{id}: the order as it was confirmed (a `404` for an id that is not one). */
export function getOrder(id: string, options?: RequestOptions): Promise<Order> {
  return apiGet<Order>(`/orders/${encodeURIComponent(id)}`, options);
}

/**
 * One confirmed order. The cache key is `["orders", id]`. A `404` is not retried by the app's query
 * client, so "Order not found" shows at once.
 */
export function useOrder(id: string) {
  return useQuery({
    queryKey: ["orders", id],
    queryFn: ({ signal }) => getOrder(id, { signal }),
  });
}
