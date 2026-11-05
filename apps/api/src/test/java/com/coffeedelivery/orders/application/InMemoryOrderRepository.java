package com.coffeedelivery.orders.application;

import com.coffeedelivery.orders.domain.Order;
import java.util.ArrayList;
import java.util.List;

/** A fake {@link OrderRepository} for unit tests. */
public class InMemoryOrderRepository implements OrderRepository {

  private final List<Order> saved = new ArrayList<>();

  @Override
  public void save(Order order) {
    saved.add(order);
  }

  public List<Order> saved() {
    return List.copyOf(saved);
  }
}
