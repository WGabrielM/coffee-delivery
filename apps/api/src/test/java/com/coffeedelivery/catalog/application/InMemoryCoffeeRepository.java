package com.coffeedelivery.catalog.application;

import com.coffeedelivery.catalog.domain.Coffee;
import java.util.List;

/** A fake {@link CoffeeRepository} for unit tests: it returns the coffees it was given. */
public class InMemoryCoffeeRepository implements CoffeeRepository {

  private final List<Coffee> coffees;

  public InMemoryCoffeeRepository(List<Coffee> coffees) {
    this.coffees = List.copyOf(coffees);
  }

  @Override
  public List<Coffee> findAll() {
    return coffees;
  }
}
