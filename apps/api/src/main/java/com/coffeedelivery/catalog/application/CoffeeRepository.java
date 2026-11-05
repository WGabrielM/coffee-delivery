package com.coffeedelivery.catalog.application;

import com.coffeedelivery.catalog.domain.Coffee;
import java.util.List;

/** Where the use cases read coffees from. */
public interface CoffeeRepository {

  /** Every coffee, ordered by position, each with its tags in tag order. */
  List<Coffee> findAll();
}
