package com.coffeedelivery.catalog.application;

import com.coffeedelivery.catalog.domain.Coffee;
import com.coffeedelivery.catalog.domain.Tag;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/** A fake {@link CoffeeRepository} for unit tests: it filters its coffees in memory. */
public class InMemoryCoffeeRepository implements CoffeeRepository {

  private final List<Coffee> coffees;

  public InMemoryCoffeeRepository(List<Coffee> coffees) {
    this.coffees = List.copyOf(coffees);
  }

  @Override
  public List<Coffee> findAll(Set<String> requiredTagSlugs) {
    return coffees.stream()
        .filter(
            coffee ->
                coffee.tags().stream()
                    .map(Tag::slug)
                    .collect(java.util.stream.Collectors.toSet())
                    .containsAll(requiredTagSlugs))
        .toList();
  }

  @Override
  public List<String> findTagSlugs() {
    Set<String> slugs = new LinkedHashSet<>();
    coffees.forEach(coffee -> coffee.tags().forEach(tag -> slugs.add(tag.slug())));
    return List.copyOf(slugs);
  }
}
