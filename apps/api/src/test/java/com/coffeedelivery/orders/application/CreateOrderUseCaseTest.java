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

  /** Creates an order and returns it, for the tests that look at the order only. */
  private Order create(CreateOrderCommand command) {
    return useCase.execute(command).order();
  }

  @Test
  void pricesTheOrderOnTheServerFromTheCatalog() {
    Order order =
        create(
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
        create(
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
        create(
            new CreateOrderCommand(List.of(new Line(LATTE, 1)), ADDRESS, PaymentMethod.DEBIT_CARD));

    assertThat(orders.saved()).containsExactly(order);
    assertThat(order.address()).isEqualTo(ADDRESS);
    assertThat(order.paymentMethod()).isEqualTo(PaymentMethod.DEBIT_CARD);
  }

  @Test
  void createsANewIdAndCutsTheTimeToMicroseconds() {
    CreateOrderCommand command =
        new CreateOrderCommand(List.of(new Line(LATTE, 1)), ADDRESS, PaymentMethod.CASH);

    Order first = create(command);
    Order second = create(command);

    assertThat(first.id()).isNotNull().isNotEqualTo(second.id());
    assertThat(first.createdAt()).isEqualTo(Instant.parse("2026-11-04T12:00:00.123456Z"));
  }

  @Test
  void aCoffeeThatIsNotInTheCatalogIsUnprocessableAndNothingIsSaved() {
    CreateOrderCommand command =
        new CreateOrderCommand(
            List.of(new Line(LATTE, 1), new Line(GHOST, 2)), ADDRESS, PaymentMethod.CASH);

    assertThatThrownBy(() -> create(command))
        .isInstanceOfSatisfying(
            UnprocessableContentException.class,
            exception -> {
              assertThat(exception.fields()).containsOnlyKeys("items");
              assertThat(exception.fields().get("items")).contains(GHOST.toString());
              assertThat(exception.fields().get("items")).doesNotContain(LATTE.toString());
            });
    assertThat(orders.saved()).isEmpty();
  }

  private static final UUID KEY = UUID.fromString("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");

  private static CreateOrderCommand withKey(UUID key, int latteQuantity) {
    return new CreateOrderCommand(
        List.of(new Line(LATTE, latteQuantity)), ADDRESS, PaymentMethod.CREDIT_CARD, key);
  }

  @Test
  void aNewKeyCreatesTheOrderAndStoresTheKeyWithTheFingerprintOfTheRequest() {
    CreateOrderResult result = useCase.execute(withKey(KEY, 2));

    assertThat(result.created()).isTrue();
    assertThat(orders.saved()).containsExactly(result.order());
    StoredOrder stored = orders.findByIdempotencyKey(KEY).orElseThrow();
    assertThat(stored.order()).isEqualTo(result.order());
    assertThat(stored.requestFingerprint())
        .isEqualTo(CreateOrderUseCase.fingerprint(withKey(KEY, 2)))
        .hasSize(64);
  }

  @Test
  void theSameKeyWithTheSameRequestReturnsTheFirstOrderAndCreatesNothing() {
    CreateOrderResult first = useCase.execute(withKey(KEY, 2));

    CreateOrderResult second = useCase.execute(withKey(KEY, 2));

    assertThat(second.created()).isFalse();
    assertThat(second.order()).isEqualTo(first.order());
    assertThat(orders.saved()).hasSize(1);
  }

  @Test
  void theSameKeyWithADifferentRequestIsRefusedAndCreatesNothing() {
    useCase.execute(withKey(KEY, 2));

    assertThatThrownBy(() -> useCase.execute(withKey(KEY, 3)))
        .isInstanceOfSatisfying(
            UnprocessableContentException.class,
            exception -> assertThat(exception.fields()).containsOnlyKeys("Idempotency-Key"));
    assertThat(orders.saved()).hasSize(1);
  }

  @Test
  void theFingerprintChangesWithTheItemsTheAddressOrThePaymentAndNotWithTheKey() {
    String base = CreateOrderUseCase.fingerprint(withKey(KEY, 1));
    UUID otherKey = UUID.fromString("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb");

    assertThat(CreateOrderUseCase.fingerprint(withKey(otherKey, 1))).isEqualTo(base);
    assertThat(CreateOrderUseCase.fingerprint(withKey(KEY, 2))).isNotEqualTo(base);
    assertThat(
            CreateOrderUseCase.fingerprint(
                new CreateOrderCommand(
                    List.of(new Line(LATTE, 1)), ADDRESS, PaymentMethod.CASH, KEY)))
        .isNotEqualTo(base);
    Address elsewhere =
        new Address("01310-100", "Other Street", "1000", "Apt 12", "Bela Vista", "Sao Paulo", "SP");
    assertThat(
            CreateOrderUseCase.fingerprint(
                new CreateOrderCommand(
                    List.of(new Line(LATTE, 1)), elsewhere, PaymentMethod.CREDIT_CARD, KEY)))
        .isNotEqualTo(base);
  }

  @Test
  void aCommandWithoutAKeyAlwaysCreatesAnOrder() {
    CreateOrderCommand command =
        new CreateOrderCommand(List.of(new Line(LATTE, 1)), ADDRESS, PaymentMethod.CASH);

    CreateOrderResult first = useCase.execute(command);
    CreateOrderResult second = useCase.execute(command);

    assertThat(first.created()).isTrue();
    assertThat(second.created()).isTrue();
    assertThat(orders.saved()).hasSize(2);
  }

  @Test
  void aCoffeeThatIsNotInTheCatalogDoesNotUseUpTheKey() {
    CreateOrderCommand unknown =
        new CreateOrderCommand(
            List.of(new Line(GHOST, 1)), ADDRESS, PaymentMethod.CREDIT_CARD, KEY);

    assertThatThrownBy(() -> useCase.execute(unknown))
        .isInstanceOf(UnprocessableContentException.class);
    CreateOrderResult result = useCase.execute(withKey(KEY, 1));

    assertThat(result.created()).isTrue();
    assertThat(orders.saved()).hasSize(1);
  }

  @Test
  void whenAnotherRequestTakesTheKeyBetweenTheCheckAndTheSaveItsOrderIsReturned() {
    CreateOrderResult winner = useCase.execute(withKey(KEY, 2));
    orders.hideNextLookup();

    CreateOrderResult loser = useCase.execute(withKey(KEY, 2));

    assertThat(loser.created()).isFalse();
    assertThat(loser.order()).isEqualTo(winner.order());
    assertThat(orders.saved()).hasSize(1);
  }
}
