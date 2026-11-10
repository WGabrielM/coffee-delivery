package com.coffeedelivery.orders.interfaces;

import java.util.List;

/**
 * The body of {@code POST /api/v1/orders/quote} as the client sent it: the same items as an order
 * and an optional ZIP code. {@link QuoteOrderRequestValidator} checks it. Unknown properties are
 * ignored.
 */
record QuoteOrderRequest(List<CreateOrderRequest.ItemRequest> items, String zipCode) {}
