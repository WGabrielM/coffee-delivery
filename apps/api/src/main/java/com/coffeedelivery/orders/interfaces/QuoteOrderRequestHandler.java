package com.coffeedelivery.orders.interfaces;

import com.coffeedelivery.orders.application.QuoteOrderUseCase;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

/**
 * {@code POST /api/v1/orders/quote}: what an order would cost now, by the rule of the server,
 * before it is sent. It answers {@code 200} with the priced lines, the subtotal, the fee, the
 * total, and the currency, and stores nothing. A coffee that is not in the catalog is a {@code
 * 422}; an invalid body is a {@code 400} with {@code fields} by JSON path.
 */
@RestController
public class QuoteOrderRequestHandler {

  private final QuoteOrderUseCase useCase;

  public QuoteOrderRequestHandler(QuoteOrderUseCase useCase) {
    this.useCase = useCase;
  }

  @PostMapping("/api/v1/orders/quote")
  public QuoteResponse handle(@RequestBody QuoteOrderRequest request) {
    return QuoteResponse.from(useCase.execute(QuoteOrderRequestValidator.toCommand(request)));
  }
}
