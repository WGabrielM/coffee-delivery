package com.coffeedelivery.orders.interfaces;

import com.coffeedelivery.orders.application.OrderQuote;
import com.coffeedelivery.orders.domain.DeliveryPolicy;
import java.util.List;

/** The answer of {@code POST /api/v1/orders/quote}: the lines in the order sent and the totals. */
record QuoteResponse(
    List<OrderResponse.ItemResponse> items,
    int subtotalInCents,
    int deliveryFeeInCents,
    int totalInCents,
    String currency) {

  static QuoteResponse from(OrderQuote quote) {
    return new QuoteResponse(
        quote.items().stream().map(OrderResponse.ItemResponse::from).toList(),
        quote.totals().subtotalInCents(),
        quote.totals().deliveryFeeInCents(),
        quote.totals().totalInCents(),
        DeliveryPolicy.CURRENCY);
  }
}
