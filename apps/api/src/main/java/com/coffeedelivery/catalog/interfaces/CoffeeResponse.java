package com.coffeedelivery.catalog.interfaces;

import com.coffeedelivery.catalog.domain.Coffee;
import java.util.List;

record CoffeeResponse(
    String id,
    String slug,
    String name,
    String description,
    int priceInCents,
    List<TagResponse> tags) {

  static CoffeeResponse from(Coffee coffee) {
    return new CoffeeResponse(
        coffee.id().toString(),
        coffee.slug(),
        coffee.name(),
        coffee.description(),
        coffee.priceInCents(),
        coffee.tags().stream().map(TagResponse::from).toList());
  }
}
