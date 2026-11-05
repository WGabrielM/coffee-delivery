package com.coffeedelivery.orders.application;

import java.util.Collection;
import java.util.Map;
import java.util.UUID;

/**
 * Where an order reads coffee names and prices from. The orders slice owns this port, so it never
 * imports the catalog slice.
 */
public interface CoffeePriceLookup {

  /** The coffees that exist among the given ids, by id; ids that do not exist are left out. */
  Map<UUID, CoffeePrice> findByIds(Collection<UUID> ids);
}
