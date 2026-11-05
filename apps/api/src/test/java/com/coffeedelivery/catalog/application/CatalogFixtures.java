package com.coffeedelivery.catalog.application;

import com.coffeedelivery.catalog.domain.Coffee;
import com.coffeedelivery.catalog.domain.Tag;
import java.util.List;
import java.util.UUID;

/** A small catalog for unit tests, with the tag combinations the filter rules care about. */
public final class CatalogFixtures {

  public static final Tag TRADITIONAL = new Tag("traditional", "Traditional");
  public static final Tag SPECIAL = new Tag("special", "Special");
  public static final Tag ALCOHOLIC = new Tag("alcoholic", "Alcoholic");
  public static final Tag ICED = new Tag("iced", "Iced");

  public static final Coffee ESPRESSO = coffee("espresso", TRADITIONAL);
  public static final Coffee ICED_ESPRESSO = coffee("iced-espresso", TRADITIONAL, ICED);
  public static final Coffee CUBAN = coffee("cuban", SPECIAL, ALCOHOLIC, ICED);
  public static final Coffee IRISH = coffee("irish", SPECIAL, ALCOHOLIC);

  private CatalogFixtures() {}

  public static List<Coffee> catalog() {
    return List.of(ESPRESSO, ICED_ESPRESSO, CUBAN, IRISH);
  }

  private static Coffee coffee(String slug, Tag... tags) {
    return new Coffee(UUID.randomUUID(), slug, slug, "Description of " + slug, 990, List.of(tags));
  }
}
