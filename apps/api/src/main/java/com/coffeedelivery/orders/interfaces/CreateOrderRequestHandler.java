package com.coffeedelivery.orders.interfaces;

import com.coffeedelivery.orders.application.CreateOrderResult;
import com.coffeedelivery.orders.application.CreateOrderUseCase;
import java.net.URI;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

/**
 * {@code POST /api/v1/orders}: creates an order priced by the server and answers {@code 201}. With
 * an {@code Idempotency-Key} header that was used before with the same request, it answers {@code
 * 200} with the first order and creates nothing.
 */
@RestController
public class CreateOrderRequestHandler {

  private final CreateOrderUseCase useCase;

  public CreateOrderRequestHandler(CreateOrderUseCase useCase) {
    this.useCase = useCase;
  }

  @PostMapping("/api/v1/orders")
  public ResponseEntity<OrderResponse> handle(
      @RequestBody CreateOrderRequest request,
      @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey) {
    CreateOrderResult result =
        useCase.execute(CreateOrderRequestValidator.toCommand(request, idempotencyKey));
    URI location = URI.create("/api/v1/orders/" + result.order().id());
    OrderResponse body = OrderResponse.from(result.order());
    return result.created()
        ? ResponseEntity.created(location).body(body)
        : ResponseEntity.ok().location(location).body(body);
  }
}
