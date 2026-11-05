package com.coffeedelivery.orders.interfaces;

import com.coffeedelivery.orders.application.GetCheckoutConfigUseCase;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/** {@code GET /api/v1/checkout-config}: the fee, the estimate, and the payment methods. */
@RestController
public class GetCheckoutConfigRequestHandler {

  private final GetCheckoutConfigUseCase useCase;

  public GetCheckoutConfigRequestHandler(GetCheckoutConfigUseCase useCase) {
    this.useCase = useCase;
  }

  @GetMapping("/api/v1/checkout-config")
  public CheckoutConfigResponse handle() {
    return CheckoutConfigResponse.from(useCase.execute());
  }
}
