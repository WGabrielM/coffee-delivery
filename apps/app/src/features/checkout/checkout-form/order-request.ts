import type { CartLine } from "../../cart/cart-reducer";
import type { OrderRequest } from "../api";
import type { CheckoutFormData } from "./checkout-form-schema";

/**
 * The body of the order, from the cart and the valid form. The items are the cart lines (the coffee
 * id and the quantity), never the displayed prices: the server reads the prices from the catalog.
 */
export function buildOrderRequest(
  lines: readonly CartLine[],
  { address, paymentMethod }: CheckoutFormData,
): OrderRequest {
  return {
    items: lines.map(({ coffeeId, quantity }) => ({ coffeeId, quantity })),
    address: { ...address },
    paymentMethod,
  };
}
