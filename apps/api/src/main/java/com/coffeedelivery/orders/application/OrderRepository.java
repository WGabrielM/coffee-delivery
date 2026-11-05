package com.coffeedelivery.orders.application;

import com.coffeedelivery.orders.domain.Order;
import java.util.Optional;
import java.util.UUID;

/** Where orders are stored. */
public interface OrderRepository {

  /** Stores the order and all its lines, or nothing at all if any part fails. */
  void save(Order order);

  /** The stored order exactly as it was confirmed, with its lines in creation order. */
  Optional<Order> findById(UUID id);
}
