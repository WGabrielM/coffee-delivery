import { useMutation, useQuery } from "@tanstack/react-query";

import { apiGet, apiPost, type RequestOptions } from "../../api";

/** The checkout rules of the server as `GET /api/v1/checkout-config` returns them. */
export interface CheckoutConfig {
  currency: string;
  /** Whole cents. */
  deliveryFeeInCents: number;
  estimatedDeliveryMinutes: { min: number; max: number };
  paymentMethods: string[];
}

/** GET /api/v1/checkout-config: the fee, the estimate, and the payment methods. */
export function getCheckoutConfig(options?: RequestOptions): Promise<CheckoutConfig> {
  return apiGet<CheckoutConfig>("/checkout-config", options);
}

/** The checkout config. Every reader shares one request (the cache key is `["checkout-config"]`). */
export function useCheckoutConfig() {
  return useQuery({
    queryKey: ["checkout-config"],
    queryFn: ({ signal }) => getCheckoutConfig({ signal }),
  });
}

/** The address as the API takes it. `complement` is an empty string when there is none. */
export interface OrderAddress {
  zipCode: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
}

/** The body of `POST /api/v1/orders`: the cart lines, the address, and the payment code. No price. */
export interface OrderRequest {
  items: { coffeeId: string; quantity: number }[];
  address: OrderAddress;
  paymentMethod: string;
}

export interface OrderItem {
  coffeeId: string;
  name: string;
  quantity: number;
  unitPriceInCents: number;
  lineTotalInCents: number;
}

/** A confirmed order as the API returns it (`POST /api/v1/orders` and `GET /api/v1/orders/{id}`). */
export interface Order {
  id: string;
  status: string;
  items: OrderItem[];
  /**
   * The stored address; `complement` is `null` when the order has none. The whole address is `null`
   * once it was cleared, `addressRetentionDays` days after the order (spec 038).
   */
  address: (Omit<OrderAddress, "complement"> & { complement: string | null }) | null;
  /** After how many days the address of an order is removed. */
  addressRetentionDays: number;
  paymentMethod: string;
  subtotalInCents: number;
  deliveryFeeInCents: number;
  totalInCents: number;
  currency: string;
  estimatedDeliveryMinutes: { min: number; max: number };
  createdAt: string;
}

/** An order to send, with the key that makes sending it again safe. */
export interface OrderSubmission {
  request: OrderRequest;
  /** Sent as the `Idempotency-Key` header: the same key and request never create a second order. */
  idempotencyKey?: string | undefined;
}

/**
 * POST /api/v1/orders: the server prices the order itself and answers `201` with it. When the key
 * was already used with the same request it answers `200` with the order it created the first time.
 */
export function createOrder(
  { request, idempotencyKey }: OrderSubmission,
  options: RequestOptions = {},
): Promise<Order> {
  const headers = idempotencyKey
    ? { ...options.headers, "Idempotency-Key": idempotencyKey }
    : options.headers;
  return apiPost<Order>("/orders", request, { ...options, headers });
}

/** Confirms the order. A mutation never retries by itself: the person decides to try again. */
export function useCreateOrder() {
  return useMutation({ mutationFn: (submission: OrderSubmission) => createOrder(submission) });
}
