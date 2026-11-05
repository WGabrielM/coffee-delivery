package com.coffeedelivery.orders.application;

import com.coffeedelivery.orders.domain.Order;

/** Where orders are stored. */
public interface OrderRepository {

  /** Stores the order and all its lines, or nothing at all if any part fails. */
  void save(Order order);
}
