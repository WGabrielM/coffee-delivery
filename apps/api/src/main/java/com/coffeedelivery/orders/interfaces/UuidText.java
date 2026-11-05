package com.coffeedelivery.orders.interfaces;

import java.util.Optional;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * Reads a UUID from request text. Only the canonical form (8-4-4-4-12 hexadecimal digits, any case)
 * counts: {@link UUID#fromString} alone also accepts short forms such as {@code 1-1-1-1-1}.
 */
final class UuidText {

  private static final Pattern CANONICAL =
      Pattern.compile(
          "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}");

  private UuidText() {}

  static Optional<UUID> parse(String text) {
    return text != null && CANONICAL.matcher(text).matches()
        ? Optional.of(UUID.fromString(text))
        : Optional.empty();
  }
}
