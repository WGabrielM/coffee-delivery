package com.coffeedelivery.orders.application;

import com.coffeedelivery.orders.application.CreateOrderCommand.Line;
import java.util.List;

/** A checked request to quote an order: coffee ids and quantities, and a ZIP code when known. */
public record QuoteOrderCommand(List<Line> items, String zipCode) {

  public QuoteOrderCommand {
    items = List.copyOf(items);
  }
}
