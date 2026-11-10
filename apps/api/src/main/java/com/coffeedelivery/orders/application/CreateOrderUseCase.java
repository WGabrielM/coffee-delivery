package com.coffeedelivery.orders.application;

import com.coffeedelivery.orders.application.CreateOrderCommand.Line;
import com.coffeedelivery.orders.domain.Address;
import com.coffeedelivery.orders.domain.Order;
import com.coffeedelivery.orders.domain.OrderItem;
import com.coffeedelivery.shared.error.UnprocessableContentException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Clock;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;

/**
 * Creates a confirmed order. Names and prices come from the catalog, never from the client, and the
 * totals are computed by {@link Order#place}. With an idempotency key, a repeated request returns
 * the order that was created first and creates nothing; the same key with a different request is
 * refused. The unique key in the database decides, so this also holds when two requests with the
 * same key arrive at the same time and with more than one API instance.
 */
@Service
public class CreateOrderUseCase {

  static final String KEY_FIELD = "Idempotency-Key";

  private final CoffeePriceLookup prices;
  private final OrderRepository orders;
  private final Clock clock;

  public CreateOrderUseCase(CoffeePriceLookup prices, OrderRepository orders, Clock clock) {
    this.prices = prices;
    this.orders = orders;
    this.clock = clock;
  }

  public CreateOrderResult execute(CreateOrderCommand command) {
    UUID key = command.idempotencyKey();
    String fingerprint = key == null ? null : fingerprint(command);
    if (key != null) {
      Optional<CreateOrderResult> earlier = earlierOrder(key, fingerprint);
      if (earlier.isPresent()) {
        return earlier.get();
      }
    }

    List<OrderItem> items = PricedItems.price(prices, command.items());
    // PostgreSQL keeps microseconds, so cut here: the created order then equals the stored one.
    Instant createdAt = Instant.now(clock).truncatedTo(ChronoUnit.MICROS);
    Order order =
        Order.place(
            UUID.randomUUID(), items, command.address(), command.paymentMethod(), createdAt);
    if (orders.save(order, key, fingerprint)) {
      return CreateOrderResult.created(order);
    }
    // Another request took the key between the check above and the save: answer with its order.
    return earlierOrder(key, fingerprint)
        .orElseThrow(
            () -> new IllegalStateException("The idempotency key is taken but not found."));
  }

  private Optional<CreateOrderResult> earlierOrder(UUID key, String fingerprint) {
    return orders
        .findByIdempotencyKey(key)
        .map(
            stored -> {
              if (!stored.requestFingerprint().equals(fingerprint)) {
                throw new UnprocessableContentException(
                    Map.of(KEY_FIELD, "This key was already used for a different order."));
              }
              return CreateOrderResult.replayed(stored.order());
            });
  }

  /**
   * A SHA-256 of the request: the items in the order sent, the address, and the payment method. The
   * text was trimmed when the command was made, so a request that differs only in surrounding
   * spaces has the same fingerprint.
   */
  static String fingerprint(CreateOrderCommand command) {
    StringBuilder text = new StringBuilder();
    for (Line line : command.items()) {
      text.append(line.coffeeId()).append(':').append(line.quantity()).append('\n');
    }
    Address address = command.address();
    List<String> parts =
        List.of(
            address.zipCode(),
            address.street(),
            address.number(),
            address.complement() == null ? "" : address.complement(),
            address.neighborhood(),
            address.city(),
            address.state(),
            command.paymentMethod().value());
    for (String part : parts) {
      text.append(part).append((char) 0);
    }
    try {
      byte[] digest =
          MessageDigest.getInstance("SHA-256")
              .digest(text.toString().getBytes(StandardCharsets.UTF_8));
      return HexFormat.of().formatHex(digest);
    } catch (NoSuchAlgorithmException exception) {
      throw new IllegalStateException("SHA-256 is not available.", exception);
    }
  }
}
