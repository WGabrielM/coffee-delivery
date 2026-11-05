package com.coffeedelivery.orders.application;

import java.util.Collection;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/** A fake {@link CoffeePriceLookup} for unit tests: it knows only the coffees it was given. */
public class FakeCoffeePriceLookup implements CoffeePriceLookup {

  private final Map<UUID, CoffeePrice> coffees = new HashMap<>();

  public FakeCoffeePriceLookup with(UUID id, String name, int priceInCents) {
    coffees.put(id, new CoffeePrice(id, name, priceInCents));
    return this;
  }

  @Override
  public Map<UUID, CoffeePrice> findByIds(Collection<UUID> ids) {
    Map<UUID, CoffeePrice> found = new HashMap<>();
    ids.stream().filter(coffees::containsKey).forEach(id -> found.put(id, coffees.get(id)));
    return found;
  }
}
