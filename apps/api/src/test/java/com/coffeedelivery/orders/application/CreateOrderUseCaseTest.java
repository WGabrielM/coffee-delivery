package com.coffeedelivery.orders.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.coffeedelivery.orders.application.CreateOrderCommand.Line;
import com.coffeedelivery.orders.domain.Address;
import com.coffeedelivery.orders.domain.Order;
import com.coffeedelivery.orders.domain.OrderStatus;
import com.coffeedelivery.orders.domain.PaymentMethod;
import com.coffeedelivery.shared.error.UnprocessableContentException;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class CreateOrderUseCaseTest {

  private static final UUID LATTE = UUID.fromString("00000000-0000-0000-0000-000000000001");
  private static final UUID CUBAN = UUID.fromString("00000000-0000-0000-0000-000000000002");
  private static final UUID GHOST = UUID.fromString("00000000-0000-0000-0000-0000000000ff");
  private static final Address ADDRESS =
      new Address(
          "01310-100", "Paulista Avenue", "1000", "Apt 12", "Bela Vista", "Sao Paulo", "SP");
  private static final Instant NOW = Instant.parse("2026-11-04T12:00:00.123456789Z");

  private final InMemoryOrderRepository orders = new InMemoryOrderRepository();
  private final FakeCoffeePriceLookup prices =
      new FakeCoffeePriceLookup().with(LATTE, "Latte", 990).with(CUBAN, "Cuban", 990);
  private final CreateOrderUseCase useCase =
      new CreateOrderUseCase(prices, orders, Clock.fixed(NOW, ZoneOffset.UTC));

  @Test
  void pricesTheOrderOnTheServerFromTheCatalog() {
    Order order =
        useCase.execute(
            new CreateOrderCommand(
                List.of(new Line(LATTE, 1), new Line(CUBAN, 2)),
                ADDRESS,
                PaymentMethod.CREDIT_CARD));

    assertThat(order.subtotalInCents()).isEqualTo(2970);
    assertThat(order.deliveryFeeInCents()).isEqualTo(350);
    assertThat(order.totalInCents()).isEqualTo(3320);
    assertThat(order.status()).isEqualTo(OrderStatus.CONFIRMED);
  }

  @Test
  void theLinesTakeTheCatalogNameAndPriceAndKeepTheRequestOrder() {
    Order order =
        useCase.execute(
            new CreateOrderCommand(
                List.of(new Line(CUBAN, 3), new Line(LATTE, 1)), ADDRESS, PaymentMethod.CASH));

    assertThat(order.items()).hasSize(2);
    assertThat(order.items().get(0).coffeeId()).isEqualTo(CUBAN);
    assertThat(order.items().get(0).name()).isEqualTo("Cuban");
    assertThat(order.items().get(0).unitPriceInCents()).isEqualTo(990);
    assertThat(order.items().get(0).quantity()).isEqualTo(3);
    assertThat(order.items().get(0).lineTotalInCents()).isEqualTo(2970);
    assertThat(order.items().get(1).coffeeId()).isEqualTo(LATTE);
  }

  @Test
  void savesTheOrderAndReturnsTheSavedOne() {
    Order order =
        useCase.execute(
            new CreateOrderCommand(List.of(new Line(LATTE, 1)), ADDRESS, PaymentMethod.DEBIT_CARD));

    assertThat(orders.saved()).containsExactly(order);
    assertThat(order.address()).isEqualTo(ADDRESS);
    assertThat(order.paymentMethod()).isEqualTo(PaymentMethod.DEBIT_CARD);
  }

  @Test
  void createsANewIdAndCutsTheTimeToMicroseconds() {
    CreateOrderCommand command =
        new CreateOrderCommand(List.of(new Line(LATTE, 1)), ADDRESS, PaymentMethod.CASH);

    Order first = useCase.execute(command);
    Order second = useCase.execute(command);

    assertThat(first.id()).isNotNull().isNotEqualTo(second.id());
    assertThat(first.createdAt()).isEqualTo(Instant.parse("2026-11-04T12:00:00.123456Z"));
  }

  @Test
  void aCoffeeThatIsNotInTheCatalogIsUnprocessableAndNothingIsSaved() {
    CreateOrderCommand command =
        new CreateOrderCommand(
            List.of(new Line(LATTE, 1), new Line(GHOST, 2)), ADDRESS, PaymentMethod.CASH);

    assertThatThrownBy(() -> useCase.execute(command))
        .isInstanceOfSatisfying(
            UnprocessableContentException.class,
            exception -> {
              assertThat(exception.fields()).containsOnlyKeys("items");
              assertThat(exception.fields().get("items")).contains(GHOST.toString());
              assertThat(exception.fields().get("items")).doesNotContain(LATTE.toString());
            });
    assertThat(orders.saved()).isEmpty();
  }
}
