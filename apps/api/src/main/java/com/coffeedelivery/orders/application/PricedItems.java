package com.coffeedelivery.orders.application;

import com.coffeedelivery.orders.application.CreateOrderCommand.Line;
import com.coffeedelivery.orders.domain.OrderItem;
import com.coffeedelivery.shared.error.UnprocessableContentException;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Prices the lines of a request from the catalog, never from the client: the order and its quote
 * (spec 039) read names and prices the same way. A coffee that is not in the catalog is a {@code
 * 422} with {@code fields.items}.
 */
final class PricedItems {

  private PricedItems() {}

  static List<OrderItem> price(CoffeePriceLookup prices, List<Line> lines) {
    List<UUID> ids = lines.stream().map(Line::coffeeId).toList();
    Map<UUID, CoffeePrice> found = prices.findByIds(ids);
    List<UUID> missing = ids.stream().filter(id -> !found.containsKey(id)).toList();
    if (!missing.isEmpty()) {
      throw new UnprocessableContentException(
          Map.of("items", "These coffees are not in the catalog: " + join(missing) + "."));
    }
    return lines.stream()
        .map(
            line -> {
              CoffeePrice coffee = found.get(line.coffeeId());
              return OrderItem.of(
                  coffee.id(), coffee.name(), coffee.priceInCents(), line.quantity());
            })
        .toList();
  }

  private static String join(List<UUID> ids) {
    return ids.stream().map(UUID::toString).collect(Collectors.joining(", "));
  }
}
