package com.coffeedelivery.orders.application;

import com.coffeedelivery.orders.domain.OrderItem;
import com.coffeedelivery.orders.domain.OrderTotals;
import java.util.List;
import org.springframework.stereotype.Service;

/**
 * Quotes an order: the names and prices of the catalog, the line totals, the subtotal, the fee, and
 * the total, from the same rule as {@code Order.place}. It stores nothing and returns no id.
 */
@Service
public class QuoteOrderUseCase {

  private final CoffeePriceLookup prices;

  public QuoteOrderUseCase(CoffeePriceLookup prices) {
    this.prices = prices;
  }

  public OrderQuote execute(QuoteOrderCommand command) {
    List<OrderItem> items = PricedItems.price(prices, command.items());
    return new OrderQuote(items, OrderTotals.of(items, command.zipCode()));
  }
}
