import type { OrderRequest } from "../api";

/**
 * The keys of one checkout. The first submit gets a new key. A try again with the very same request
 * (after a network failure or a server error) keeps the key, so the server answers with the order
 * it already created instead of creating a second one. A request that changed (another address,
 * payment, or cart) gets a new key, and so does the next one after `reset` (an order was placed).
 */
export function createIdempotencyKeys(newKey: () => string = () => crypto.randomUUID()) {
  let current: { signature: string; key: string } | undefined;
  return {
    keyFor(request: OrderRequest): string {
      const signature = JSON.stringify(request);
      if (current?.signature !== signature) current = { signature, key: newKey() };
      return current.key;
    },
    reset(): void {
      current = undefined;
    },
  };
}
