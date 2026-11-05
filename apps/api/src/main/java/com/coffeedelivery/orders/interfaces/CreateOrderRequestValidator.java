package com.coffeedelivery.orders.interfaces;

import com.coffeedelivery.orders.application.CreateOrderCommand;
import com.coffeedelivery.orders.application.CreateOrderCommand.Line;
import com.coffeedelivery.orders.domain.Address;
import com.coffeedelivery.orders.domain.PaymentMethod;
import com.coffeedelivery.shared.error.ValidationFailedException;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;
import tools.jackson.databind.JsonNode;

/**
 * Checks the shape of a create-order request and turns it into a command. It reports every problem
 * at once, keyed by JSON path ({@code items[0].quantity}, {@code address.zipCode}), with messages a
 * person can read. Text is trimmed.
 */
final class CreateOrderRequestValidator {

  private static final Pattern UUID_FORMAT =
      Pattern.compile(
          "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}");
  private static final Pattern ZIP_CODE = Pattern.compile("\\d{5}-\\d{3}");
  private static final Pattern STATE = Pattern.compile("[A-Z]{2}");
  private static final int MAX_COMPLEMENT_LENGTH = 60;
  private static final int MIN_QUANTITY = 1;
  private static final int MAX_QUANTITY = 99;

  private CreateOrderRequestValidator() {}

  static CreateOrderCommand toCommand(CreateOrderRequest request) {
    Map<String, String> errors = new LinkedHashMap<>();
    List<Line> lines = items(request.items(), errors);
    Address address = address(request.address(), errors);
    PaymentMethod paymentMethod = paymentMethod(request.paymentMethod(), errors);
    if (!errors.isEmpty()) {
      throw new ValidationFailedException(errors);
    }
    return new CreateOrderCommand(lines, address, paymentMethod);
  }

  private static List<Line> items(
      List<CreateOrderRequest.ItemRequest> items, Map<String, String> errors) {
    if (items == null || items.isEmpty()) {
      errors.put("items", "Add at least one coffee.");
      return List.of();
    }
    List<Line> lines = new ArrayList<>();
    Set<UUID> seen = new HashSet<>();
    boolean repeated = false;
    for (int index = 0; index < items.size(); index++) {
      CreateOrderRequest.ItemRequest item = items.get(index);
      String path = "items[" + index + "]";
      if (item == null) {
        errors.put(path, "Send a coffee id and a quantity.");
        continue;
      }
      UUID coffeeId = coffeeId(item.coffeeId());
      if (coffeeId == null) {
        errors.put(path + ".coffeeId", "Enter a valid coffee id.");
      } else if (!seen.add(coffeeId)) {
        repeated = true;
      }
      Integer quantity = quantity(item.quantity());
      if (quantity == null) {
        errors.put(path + ".quantity", "Enter a whole number from 1 to 99.");
      }
      if (coffeeId != null && quantity != null) {
        lines.add(new Line(coffeeId, quantity));
      }
    }
    if (repeated) {
      errors.put("items", "Each coffee can appear only once.");
    }
    return lines;
  }

  private static UUID coffeeId(String value) {
    return value != null && UUID_FORMAT.matcher(value).matches() ? UUID.fromString(value) : null;
  }

  /** The quantity when it is a JSON whole number from 1 to 99, otherwise null. */
  private static Integer quantity(JsonNode node) {
    if (node == null || !node.isIntegralNumber() || !node.canConvertToInt()) {
      return null;
    }
    int quantity = node.intValue();
    return quantity >= MIN_QUANTITY && quantity <= MAX_QUANTITY ? quantity : null;
  }

  private static Address address(
      CreateOrderRequest.AddressRequest request, Map<String, String> errors) {
    if (request == null) {
      errors.put("address", "Enter the delivery address.");
      return null;
    }
    String zipCode = trimmed(request.zipCode());
    String street = trimmed(request.street());
    String number = trimmed(request.number());
    String neighborhood = trimmed(request.neighborhood());
    String city = trimmed(request.city());
    String state = trimmed(request.state());
    String complement = trimmed(request.complement());
    if (!ZIP_CODE.matcher(zipCode).matches()) {
      errors.put("address.zipCode", "Enter a ZIP code like 12345-678.");
    }
    required(street, "address.street", "Enter the street.", errors);
    required(number, "address.number", "Enter the number.", errors);
    required(neighborhood, "address.neighborhood", "Enter the neighborhood.", errors);
    required(city, "address.city", "Enter the city.", errors);
    if (!STATE.matcher(state).matches()) {
      errors.put("address.state", "Enter the state as two uppercase letters, like SP.");
    }
    if (complement.length() > MAX_COMPLEMENT_LENGTH) {
      errors.put("address.complement", "Use at most 60 characters.");
    }
    return new Address(
        zipCode,
        street,
        number,
        complement.isEmpty() ? null : complement,
        neighborhood,
        city,
        state);
  }

  private static void required(
      String value, String path, String message, Map<String, String> errors) {
    if (value.isEmpty()) {
      errors.put(path, message);
    }
  }

  private static PaymentMethod paymentMethod(String value, Map<String, String> errors) {
    return PaymentMethod.fromValue(value)
        .orElseGet(
            () -> {
              errors.put("paymentMethod", "Choose credit_card, debit_card, or cash.");
              return null;
            });
  }

  private static String trimmed(String value) {
    return value == null ? "" : value.trim();
  }
}
