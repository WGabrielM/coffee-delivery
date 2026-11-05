package com.coffeedelivery.orders.application;

import com.coffeedelivery.orders.application.CreateOrderCommand.Line;
import com.coffeedelivery.orders.domain.Order;
import com.coffeedelivery.orders.domain.OrderItem;
import com.coffeedelivery.shared.error.UnprocessableContentException;
import java.time.Clock;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

/**
 * Creates a confirmed order. Names and prices come from the catalog, never from the client, and the
 * totals are computed by {@link Order#place}.
 */
@Service
public class CreateOrderUseCase {

  private final CoffeePriceLookup prices;
  private final OrderRepository orders;
  private final Clock clock;

  public CreateOrderUseCase(CoffeePriceLookup prices, OrderRepository orders, Clock clock) {
    this.prices = prices;
    this.orders = orders;
    this.clock = clock;
  }

  public Order execute(CreateOrderCommand command) {
    List<UUID> ids = command.items().stream().map(Line::coffeeId).toList();
    Map<UUID, CoffeePrice> found = prices.findByIds(ids);
    List<UUID> missing = ids.stream().filter(id -> !found.containsKey(id)).toList();
    if (!missing.isEmpty()) {
      throw new UnprocessableContentException(
          Map.of("items", "These coffees are not in the catalog: " + join(missing) + "."));
    }
    List<OrderItem> items =
        command.items().stream()
            .map(
                line -> {
                  CoffeePrice coffee = found.get(line.coffeeId());
                  return OrderItem.of(
                      coffee.id(), coffee.name(), coffee.priceInCents(), line.quantity());
                })
            .toList();
    // PostgreSQL keeps microseconds, so cut here: the created order then equals the stored one.
    Instant createdAt = Instant.now(clock).truncatedTo(ChronoUnit.MICROS);
    Order order =
        Order.place(
            UUID.randomUUID(), items, command.address(), command.paymentMethod(), createdAt);
    orders.save(order);
    return order;
  }

  private static String join(List<UUID> ids) {
    return ids.stream().map(UUID::toString).collect(Collectors.joining(", "));
  }
}
