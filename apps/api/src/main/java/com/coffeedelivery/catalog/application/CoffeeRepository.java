package com.coffeedelivery.catalog.application;

import com.coffeedelivery.catalog.domain.Coffee;
import java.util.List;
import java.util.Set;

/** Where the use cases read coffees from. */
public interface CoffeeRepository {

  /**
   * The coffees that have <em>all</em> the given tags, ordered by position, each with all its tags
   * in tag order. An empty set means no filter.
   */
  List<Coffee> findAll(Set<String> requiredTagSlugs);

  /** The slugs of every tag, ordered by tag position. */
  List<String> findTagSlugs();
}
