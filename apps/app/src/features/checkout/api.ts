import { useQuery } from "@tanstack/react-query";

import { apiGet, type RequestOptions } from "../../api";

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
