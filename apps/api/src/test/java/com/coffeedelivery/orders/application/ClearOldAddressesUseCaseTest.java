package com.coffeedelivery.orders.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.coffeedelivery.orders.domain.Address;
import com.coffeedelivery.orders.domain.Order;
import com.coffeedelivery.orders.domain.OrderItem;
import com.coffeedelivery.orders.domain.PaymentMethod;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class ClearOldAddressesUseCaseTest {

  private static final Instant NOW = Instant.parse("2026-11-10T03:00:00Z");

  private final InMemoryOrderRepository orders = new InMemoryOrderRepository();
  private final ClearOldAddressesUseCase useCase =
      new ClearOldAddressesUseCase(
          orders, new RetentionPolicy(90), Clock.fixed(NOW, ZoneOffset.UTC));

  private Order storedOrderOfAge(long days) {
    Order order =
        Order.place(
            UUID.randomUUID(),
            List.of(OrderItem.of(UUID.randomUUID(), "Latte", 990, 2)),
            new Address(
                "01310-100", "Paulista Avenue", "1000", null, "Bela Vista", "Sao Paulo", "SP"),
            PaymentMethod.CASH,
            NOW.minus(days, ChronoUnit.DAYS));
    orders.save(order);
    return order;
  }

  @Test
  void anOrderOf89DaysKeepsItsAddress() {
    Order young = storedOrderOfAge(89);

    int cleared = useCase.execute();

    assertThat(cleared).isZero();
    assertThat(orders.findById(young.id()).orElseThrow().address()).isNotNull();
  }

  @Test
  void anOrderOf91DaysLosesItsAddressAndKeepsTheRest() {
    Order old = storedOrderOfAge(91);

    int cleared = useCase.execute();

    assertThat(cleared).isEqualTo(1);
    Order stored = orders.findById(old.id()).orElseThrow();
    assertThat(stored.address()).isNull();
    assertThat(stored.items()).isEqualTo(old.items());
    assertThat(stored.totalInCents()).isEqualTo(old.totalInCents());
    assertThat(stored.paymentMethod()).isEqualTo(old.paymentMethod());
    assertThat(stored.createdAt()).isEqualTo(old.createdAt());
  }

  @Test
  void onlyTheOldOrdersAreClearedAndTheSameOrderIsNotClearedTwice() {
    Order young = storedOrderOfAge(89);
    storedOrderOfAge(91);
    storedOrderOfAge(400);

    int first = useCase.execute();
    int second = useCase.execute();

    assertThat(first).isEqualTo(2);
    assertThat(second).isZero();
    assertThat(orders.findById(young.id()).orElseThrow().address()).isNotNull();
  }

  @Test
  void theRetentionIsTheOneOfTheSetting() {
    ClearOldAddressesUseCase oneDay =
        new ClearOldAddressesUseCase(
            orders, new RetentionPolicy(1), Clock.fixed(NOW, ZoneOffset.UTC));
    storedOrderOfAge(2);

    assertThat(oneDay.execute()).isEqualTo(1);
  }

  @Test
  void aRetentionOfLessThanOneDayIsRefused() {
    assertThatThrownBy(() -> new RetentionPolicy(0))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("orders.retention.days");
    assertThatThrownBy(() -> new RetentionPolicy(-5)).isInstanceOf(IllegalArgumentException.class);
    assertThat(new RetentionPolicy(1).days()).isEqualTo(1);
  }
}
