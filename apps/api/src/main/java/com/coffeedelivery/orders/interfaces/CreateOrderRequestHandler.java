package com.coffeedelivery.orders.interfaces;

import com.coffeedelivery.orders.application.CreateOrderUseCase;
import com.coffeedelivery.orders.domain.Order;
import java.net.URI;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

/** {@code POST /api/v1/orders}: creates an order priced by the server and answers {@code 201}. */
@RestController
public class CreateOrderRequestHandler {

  private final CreateOrderUseCase useCase;

  public CreateOrderRequestHandler(CreateOrderUseCase useCase) {
    this.useCase = useCase;
  }

  @PostMapping("/api/v1/orders")
  public ResponseEntity<OrderResponse> handle(@RequestBody CreateOrderRequest request) {
    Order order = useCase.execute(CreateOrderRequestValidator.toCommand(request));
    return ResponseEntity.created(URI.create("/api/v1/orders/" + order.id()))
        .body(OrderResponse.from(order));
  }
}
