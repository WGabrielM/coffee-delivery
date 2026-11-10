package com.coffeedelivery.orders.interfaces;

import com.coffeedelivery.orders.application.GetOrderUseCase;
import com.coffeedelivery.orders.application.RetentionPolicy;
import com.coffeedelivery.shared.error.NotFoundException;
import java.util.UUID;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

/**
 * {@code GET /api/v1/orders/{id}}: the confirmed order, in the same shape as the {@code 201} of
 * {@code POST /api/v1/orders}. An id that is not a UUID is a {@code 404}, like an id that does not
 * exist: to the client there is no such order. The {@code address} is {@code null} for an order
 * whose address was cleared after the retention period (spec 038).
 */
@RestController
public class GetOrderRequestHandler {

  private final GetOrderUseCase useCase;
  private final RetentionPolicy retention;

  public GetOrderRequestHandler(GetOrderUseCase useCase, RetentionPolicy retention) {
    this.useCase = useCase;
    this.retention = retention;
  }

  @GetMapping("/api/v1/orders/{id}")
  public OrderResponse handle(@PathVariable String id) {
    UUID orderId = UuidText.parse(id).orElseThrow(NotFoundException::new);
    return OrderResponse.from(useCase.execute(orderId), retention.days());
  }
}
