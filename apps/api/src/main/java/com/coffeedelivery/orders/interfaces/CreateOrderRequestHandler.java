package com.coffeedelivery.orders.interfaces;

import com.coffeedelivery.orders.application.CreateOrderResult;
import com.coffeedelivery.orders.application.CreateOrderUseCase;
import com.coffeedelivery.orders.application.RetentionPolicy;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import java.net.URI;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

/**
 * {@code POST /api/v1/orders}: creates an order priced by the server and answers {@code 201}. With
 * an {@code Idempotency-Key} header that was used before with the same request, it answers {@code
 * 200} with the first order and creates nothing. It counts its answers in the metric {@code
 * orders.created}, tagged {@code outcome=created} or {@code outcome=replayed}, so the dashboard
 * shows the business traffic next to the HTTP traffic.
 */
@RestController
public class CreateOrderRequestHandler {

  private final CreateOrderUseCase useCase;
  private final RetentionPolicy retention;
  private final Counter created;
  private final Counter replayed;

  public CreateOrderRequestHandler(
      CreateOrderUseCase useCase, RetentionPolicy retention, MeterRegistry registry) {
    this.useCase = useCase;
    this.retention = retention;
    this.created = counter(registry, "created");
    this.replayed = counter(registry, "replayed");
  }

  private static Counter counter(MeterRegistry registry, String outcome) {
    return Counter.builder("orders.created")
        .description("Answers of POST /api/v1/orders that created an order or replayed one")
        .tag("outcome", outcome)
        .register(registry);
  }

  @PostMapping("/api/v1/orders")
  public ResponseEntity<OrderResponse> handle(
      @RequestBody CreateOrderRequest request,
      @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey) {
    CreateOrderResult result =
        useCase.execute(CreateOrderRequestValidator.toCommand(request, idempotencyKey));
    URI location = URI.create("/api/v1/orders/" + result.order().id());
    OrderResponse body = OrderResponse.from(result.order(), retention.days());
    (result.created() ? created : replayed).increment();
    return result.created()
        ? ResponseEntity.created(location).body(body)
        : ResponseEntity.ok().location(location).body(body);
  }
}
