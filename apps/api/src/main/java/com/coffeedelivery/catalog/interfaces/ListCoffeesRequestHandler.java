package com.coffeedelivery.catalog.interfaces;

import com.coffeedelivery.catalog.application.ListCoffeesUseCase;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/** {@code GET /api/v1/coffees}: the catalog, ordered by position. */
@RestController
public class ListCoffeesRequestHandler {

  private final ListCoffeesUseCase useCase;

  public ListCoffeesRequestHandler(ListCoffeesUseCase useCase) {
    this.useCase = useCase;
  }

  @GetMapping("/api/v1/coffees")
  public CoffeesResponse handle() {
    return CoffeesResponse.from(useCase.execute());
  }
}
