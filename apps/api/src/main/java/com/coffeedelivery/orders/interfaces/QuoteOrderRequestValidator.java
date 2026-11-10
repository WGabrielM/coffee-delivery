package com.coffeedelivery.orders.interfaces;

import com.coffeedelivery.orders.application.CreateOrderCommand.Line;
import com.coffeedelivery.orders.application.QuoteOrderCommand;
import com.coffeedelivery.shared.error.ValidationFailedException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Checks the shape of a quote request: the items follow the rules of an order, and the ZIP code is
 * optional and, when it is present, must look like {@code 12345-678}. Every problem is reported at
 * once, keyed by JSON path.
 */
final class QuoteOrderRequestValidator {

  private QuoteOrderRequestValidator() {}

  static QuoteOrderCommand toCommand(QuoteOrderRequest request) {
    Map<String, String> errors = new LinkedHashMap<>();
    List<Line> lines = CreateOrderRequestValidator.items(request.items(), errors);
    String zipCode = request.zipCode() == null ? null : request.zipCode().trim();
    if (zipCode != null && !CreateOrderRequestValidator.isZipCode(zipCode)) {
      errors.put("zipCode", "Enter a ZIP code like 12345-678.");
    }
    if (!errors.isEmpty()) {
      throw new ValidationFailedException(errors);
    }
    return new QuoteOrderCommand(lines, zipCode);
  }
}
