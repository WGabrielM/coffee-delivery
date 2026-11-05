package com.coffeedelivery.orders.interfaces;

import java.util.List;
import tools.jackson.databind.JsonNode;

/**
 * The body of {@code POST /api/v1/orders} as the client sent it: every field may be missing or
 * wrong, and {@link CreateOrderRequestValidator} checks it. Unknown properties (such as a price)
 * are ignored. The quantity stays a JSON node so that only a whole number is accepted.
 */
record CreateOrderRequest(List<ItemRequest> items, AddressRequest address, String paymentMethod) {

  record ItemRequest(String coffeeId, JsonNode quantity) {}

  record AddressRequest(
      String zipCode,
      String street,
      String number,
      String complement,
      String neighborhood,
      String city,
      String state) {}
}
