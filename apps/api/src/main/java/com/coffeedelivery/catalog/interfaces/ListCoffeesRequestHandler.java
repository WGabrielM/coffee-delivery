package com.coffeedelivery.catalog.interfaces;

import com.coffeedelivery.catalog.application.ListCoffeesUseCase;
import com.coffeedelivery.shared.error.ValidationFailedException;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * {@code GET /api/v1/coffees}: the catalog ordered by position, optionally narrowed with {@code
 * ?tags=special,iced} (a coffee must have every tag). Only the comma-separated form is accepted.
 */
@RestController
public class ListCoffeesRequestHandler {

  private static final String TAGS = "tags";

  private final ListCoffeesUseCase useCase;

  public ListCoffeesRequestHandler(ListCoffeesUseCase useCase) {
    this.useCase = useCase;
  }

  @GetMapping("/api/v1/coffees")
  public CoffeesResponse handle(@RequestParam MultiValueMap<String, String> parameters) {
    return CoffeesResponse.from(useCase.execute(tagSlugs(parameters.get(TAGS))));
  }

  /** Splits the single comma-separated value; blank elements are ignored. */
  private static List<String> tagSlugs(List<String> values) {
    if (values == null || values.isEmpty()) {
      return List.of();
    }
    if (values.size() > 1) {
      throw new ValidationFailedException(
          Map.of(TAGS, "Send the tags as one comma-separated list, like tags=special,iced."));
    }
    return Arrays.stream(values.get(0).split(","))
        .map(String::trim)
        .filter(s -> !s.isEmpty())
        .toList();
  }
}
