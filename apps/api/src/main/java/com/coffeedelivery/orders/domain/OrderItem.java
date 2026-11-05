package com.coffeedelivery.orders.domain;

import java.util.UUID;

/** One line of an order, with the coffee name and unit price as they were when it was sold. */
public record OrderItem(
    UUID coffeeId, String name, int quantity, int unitPriceInCents, int lineTotalInCents) {

  public static OrderItem of(UUID coffeeId, String name, int unitPriceInCents, int quantity) {
    return new OrderItem(coffeeId, name, quantity, unitPriceInCents, unitPriceInCents * quantity);
  }
}
