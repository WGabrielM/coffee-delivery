package com.coffeedelivery.orders.application;

import com.coffeedelivery.orders.domain.Address;
import com.coffeedelivery.orders.domain.PaymentMethod;
import java.util.List;
import java.util.UUID;

/** A checked request to create an order: coffee ids and quantities, never prices. */
public record CreateOrderCommand(List<Line> items, Address address, PaymentMethod paymentMethod) {

  public CreateOrderCommand {
    items = List.copyOf(items);
  }

  public record Line(UUID coffeeId, int quantity) {}
}
