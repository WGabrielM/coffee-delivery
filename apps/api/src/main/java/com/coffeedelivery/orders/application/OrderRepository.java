package com.coffeedelivery.orders.application;

import com.coffeedelivery.orders.domain.Order;
import java.util.Optional;
import java.util.UUID;

/** Where orders are stored. */
public interface OrderRepository {

  /**
   * Stores the order and all its lines, or nothing at all if any part fails. With an idempotency
   * key it stores them only when no order has that key yet, and returns false, storing nothing,
   * when one has (also when another request took the key a moment ago). A null key always stores.
   */
  boolean save(Order order, UUID idempotencyKey, String requestFingerprint);

  /** The stored order exactly as it was confirmed, with its lines in creation order. */
  Optional<Order> findById(UUID id);

  /** The order that was created with this key, if any, with the fingerprint of its request. */
  Optional<StoredOrder> findByIdempotencyKey(UUID idempotencyKey);
}
