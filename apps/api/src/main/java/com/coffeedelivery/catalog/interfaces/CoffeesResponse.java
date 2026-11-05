package com.coffeedelivery.catalog.interfaces;

import com.coffeedelivery.catalog.domain.Coffee;
import java.util.List;

record CoffeesResponse(List<CoffeeResponse> coffees) {

  static CoffeesResponse from(List<Coffee> coffees) {
    return new CoffeesResponse(coffees.stream().map(CoffeeResponse::from).toList());
  }
}
