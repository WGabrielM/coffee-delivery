package com.coffeedelivery.orders.application;

import com.coffeedelivery.orders.domain.Order;

/**
 * The outcome of creating an order. {@code created} is false when the request repeated an
 * idempotency key with the same content, so {@code order} is the one that was created before.
 */
public record CreateOrderResult(Order order, boolean created) {

  static CreateOrderResult created(Order order) {
    return new CreateOrderResult(order, true);
  }

  static CreateOrderResult replayed(Order order) {
    return new CreateOrderResult(order, false);
  }
}
