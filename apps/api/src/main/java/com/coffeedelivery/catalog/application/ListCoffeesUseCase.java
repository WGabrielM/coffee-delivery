package com.coffeedelivery.catalog.application;

import com.coffeedelivery.catalog.domain.Coffee;
import com.coffeedelivery.shared.error.ValidationFailedException;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Service;

/**
 * Lists the coffees of the catalog in the order the design shows them, optionally narrowed to the
 * coffees that have every given tag. A slug that is not a stored tag is a validation failure.
 */
@Service
public class ListCoffeesUseCase {

  private final CoffeeRepository coffees;

  public ListCoffeesUseCase(CoffeeRepository coffees) {
    this.coffees = coffees;
  }

  public List<Coffee> execute(List<String> tagSlugs) {
    Set<String> required = new LinkedHashSet<>(tagSlugs);
    if (required.isEmpty()) {
      return coffees.findAll(required);
    }
    List<String> known = coffees.findTagSlugs();
    List<String> unknown = required.stream().filter(slug -> !known.contains(slug)).toList();
    if (!unknown.isEmpty()) {
      throw new ValidationFailedException(Map.of("tags", unknownTagsMessage(unknown, known)));
    }
    return coffees.findAll(required);
  }

  private static String unknownTagsMessage(List<String> unknown, List<String> known) {
    String label = unknown.size() == 1 ? "Unknown tag: " : "Unknown tags: ";
    return label + String.join(", ", unknown) + ". Use: " + String.join(", ", known) + ".";
  }
}
