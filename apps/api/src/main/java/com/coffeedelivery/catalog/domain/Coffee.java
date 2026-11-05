package com.coffeedelivery.catalog.domain;

import java.util.List;
import java.util.UUID;

/**
 * A drink in the catalog. The price is an integer in cents (USD); the tags are in tag order. The
 * app finds the photo by {@code slug}, so the coffee carries no image.
 */
public record Coffee(
    UUID id, String slug, String name, String description, int priceInCents, List<Tag> tags) {

  public Coffee {
    tags = List.copyOf(tags);
  }
}
