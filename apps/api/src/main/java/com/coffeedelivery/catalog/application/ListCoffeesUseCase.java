package com.coffeedelivery.catalog.application;

import com.coffeedelivery.catalog.domain.Coffee;
import java.util.List;
import org.springframework.stereotype.Service;

/** Lists the coffees of the catalog in the order the design shows them. */
@Service
public class ListCoffeesUseCase {

  private final CoffeeRepository coffees;

  public ListCoffeesUseCase(CoffeeRepository coffees) {
    this.coffees = coffees;
  }

  public List<Coffee> execute() {
    return coffees.findAll();
  }
}
