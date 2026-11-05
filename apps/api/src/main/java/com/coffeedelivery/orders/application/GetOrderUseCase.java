package com.coffeedelivery.orders.application;

import com.coffeedelivery.orders.domain.Order;
import com.coffeedelivery.shared.error.NotFoundException;
import java.util.UUID;
import org.springframework.stereotype.Service;

/** Reads a confirmed order, as it was stored, by its id. */
@Service
public class GetOrderUseCase {

  private final OrderRepository orders;

  public GetOrderUseCase(OrderRepository orders) {
    this.orders = orders;
  }

  public Order execute(UUID id) {
    return orders.findById(id).orElseThrow(NotFoundException::new);
  }
}
