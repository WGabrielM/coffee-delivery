package com.coffeedelivery.orders.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.coffeedelivery.orders.domain.Address;
import com.coffeedelivery.orders.domain.Order;
import com.coffeedelivery.orders.domain.OrderItem;
import com.coffeedelivery.orders.domain.PaymentMethod;
import com.coffeedelivery.shared.error.NotFoundException;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class GetOrderUseCaseTest {

  private final InMemoryOrderRepository orders = new InMemoryOrderRepository();
  private final GetOrderUseCase useCase = new GetOrderUseCase(orders);

  private static Order anOrder() {
    return Order.place(
        UUID.randomUUID(),
        List.of(OrderItem.of(UUID.randomUUID(), "Latte", 990, 2)),
        new Address("01310-100", "Paulista Avenue", "1000", null, "Bela Vista", "Sao Paulo", "SP"),
        PaymentMethod.CASH,
        Instant.parse("2026-11-04T12:00:00Z"));
  }

  @Test
  void returnsTheStoredOrder() {
    Order order = anOrder();
    orders.save(order);

    assertThat(useCase.execute(order.id())).isEqualTo(order);
  }

  @Test
  void returnsTheRequestedOrderAmongSeveral() {
    Order first = anOrder();
    Order second = anOrder();
    orders.save(first);
    orders.save(second);

    assertThat(useCase.execute(second.id())).isEqualTo(second);
  }

  @Test
  void anIdThatDoesNotExistIsNotFound() {
    orders.save(anOrder());

    assertThatThrownBy(() -> useCase.execute(UUID.randomUUID()))
        .isInstanceOf(NotFoundException.class);
  }
}
