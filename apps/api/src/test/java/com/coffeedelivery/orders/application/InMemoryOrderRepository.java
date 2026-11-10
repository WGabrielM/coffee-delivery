package com.coffeedelivery.orders.application;

import com.coffeedelivery.orders.domain.Order;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/** A fake {@link OrderRepository} for unit tests. */
public class InMemoryOrderRepository implements OrderRepository {

  private final List<Order> saved = new ArrayList<>();
  private final Map<UUID, StoredOrder> byKey = new HashMap<>();
  private boolean hideNextLookup;

  @Override
  public boolean save(Order order, UUID idempotencyKey, String requestFingerprint) {
    if (idempotencyKey != null) {
      if (byKey.containsKey(idempotencyKey)) {
        return false;
      }
      byKey.put(idempotencyKey, new StoredOrder(order, requestFingerprint));
    }
    saved.add(order);
    return true;
  }

  /** Stores an order that has no idempotency key. */
  public void save(Order order) {
    save(order, null, null);
  }

  @Override
  public Optional<Order> findById(UUID id) {
    return saved.stream().filter(order -> order.id().equals(id)).findFirst();
  }

  @Override
  public Optional<StoredOrder> findByIdempotencyKey(UUID idempotencyKey) {
    if (hideNextLookup) {
      hideNextLookup = false;
      return Optional.empty();
    }
    return Optional.ofNullable(byKey.get(idempotencyKey));
  }

  /**
   * Makes the next lookup by key find nothing, as when another request takes the key just after the
   * check and just before the save.
   */
  public void hideNextLookup() {
    hideNextLookup = true;
  }

  public List<Order> saved() {
    return List.copyOf(saved);
  }
}
