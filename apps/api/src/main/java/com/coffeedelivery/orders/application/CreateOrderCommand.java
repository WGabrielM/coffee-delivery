package com.coffeedelivery.orders.application;

import com.coffeedelivery.orders.domain.Address;
import com.coffeedelivery.orders.domain.PaymentMethod;
import java.util.List;
import java.util.UUID;

/**
 * A checked request to create an order: coffee ids and quantities, never prices. The idempotency
 * key is optional: a request that repeats a key with the same content gets the first order back.
 */
public record CreateOrderCommand(
    List<Line> items, Address address, PaymentMethod paymentMethod, UUID idempotencyKey) {

  public CreateOrderCommand {
    items = List.copyOf(items);
  }

  /** A command without an idempotency key: every call creates an order. */
  public CreateOrderCommand(List<Line> items, Address address, PaymentMethod paymentMethod) {
    this(items, address, paymentMethod, null);
  }

  public record Line(UUID coffeeId, int quantity) {}
}
