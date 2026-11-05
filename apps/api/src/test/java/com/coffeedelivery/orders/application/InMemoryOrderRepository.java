package com.coffeedelivery.orders.application;

import com.coffeedelivery.orders.domain.Order;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/** A fake {@link OrderRepository} for unit tests. */
public class InMemoryOrderRepository implements OrderRepository {

  private final List<Order> saved = new ArrayList<>();

  @Override
  public void save(Order order) {
    saved.add(order);
  }

  @Override
  public Optional<Order> findById(UUID id) {
    return saved.stream().filter(order -> order.id().equals(id)).findFirst();
  }

  public List<Order> saved() {
    return List.copyOf(saved);
  }
}
