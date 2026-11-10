package com.coffeedelivery.orders.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.coffeedelivery.orders.application.CreateOrderCommand.Line;
import com.coffeedelivery.orders.domain.Address;
import com.coffeedelivery.orders.domain.Order;
import com.coffeedelivery.orders.domain.PaymentMethod;
import com.coffeedelivery.shared.error.UnprocessableContentException;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class QuoteOrderUseCaseTest {

  private static final UUID LATTE = UUID.fromString("00000000-0000-0000-0000-000000000001");
  private static final UUID CUBAN = UUID.fromString("00000000-0000-0000-0000-000000000002");
  private static final UUID GHOST = UUID.fromString("00000000-0000-0000-0000-0000000000ff");
  private static final Address ADDRESS =
      new Address("01310-100", "Paulista Avenue", "1000", null, "Bela Vista", "Sao Paulo", "SP");

  private final FakeCoffeePriceLookup prices =
      new FakeCoffeePriceLookup().with(LATTE, "Latte", 990).with(CUBAN, "Cuban", 990);
  private final QuoteOrderUseCase useCase = new QuoteOrderUseCase(prices);

  @Test
  void quotesTheLinesInTheOrderSentWithPricesFromTheCatalog() {
    OrderQuote quote =
        useCase.execute(
            new QuoteOrderCommand(List.of(new Line(CUBAN, 3), new Line(LATTE, 1)), null));

    assertThat(quote.items()).hasSize(2);
    assertThat(quote.items().get(0).coffeeId()).isEqualTo(CUBAN);
    assertThat(quote.items().get(0).name()).isEqualTo("Cuban");
    assertThat(quote.items().get(0).unitPriceInCents()).isEqualTo(990);
    assertThat(quote.items().get(0).lineTotalInCents()).isEqualTo(2970);
    assertThat(quote.items().get(1).coffeeId()).isEqualTo(LATTE);
    assertThat(quote.totals().subtotalInCents()).isEqualTo(3960);
    assertThat(quote.totals().deliveryFeeInCents()).isEqualTo(350);
    assertThat(quote.totals().totalInCents()).isEqualTo(4310);
  }

  @Test
  void theQuoteAndThePlacedOrderHaveTheSameNumbersForTheSameItems() {
    List<Line> lines = List.of(new Line(LATTE, 2), new Line(CUBAN, 1));
    OrderQuote quote = useCase.execute(new QuoteOrderCommand(lines, ADDRESS.zipCode()));
    InMemoryOrderRepository orders = new InMemoryOrderRepository();
    CreateOrderUseCase create =
        new CreateOrderUseCase(
            prices, orders, Clock.fixed(Instant.parse("2026-11-10T12:00:00Z"), ZoneOffset.UTC));

    Order order =
        create.execute(new CreateOrderCommand(lines, ADDRESS, PaymentMethod.CREDIT_CARD)).order();

    assertThat(order.items()).isEqualTo(quote.items());
    assertThat(order.subtotalInCents()).isEqualTo(quote.totals().subtotalInCents());
    assertThat(order.deliveryFeeInCents()).isEqualTo(quote.totals().deliveryFeeInCents());
    assertThat(order.totalInCents()).isEqualTo(quote.totals().totalInCents());
    assertThat(quote.totals().totalInCents()).isEqualTo(2970 + 350);
  }

  @Test
  void theFeeDoesNotDependOnTheZipCode() {
    List<Line> lines = List.of(new Line(LATTE, 1));

    OrderQuote without = useCase.execute(new QuoteOrderCommand(lines, null));
    OrderQuote with = useCase.execute(new QuoteOrderCommand(lines, "90250-440"));

    assertThat(with).isEqualTo(without);
  }

  @Test
  void aCoffeeThatIsNotInTheCatalogIsUnprocessableAndNamesTheId() {
    assertThatThrownBy(
            () ->
                useCase.execute(
                    new QuoteOrderCommand(List.of(new Line(LATTE, 1), new Line(GHOST, 1)), null)))
        .isInstanceOfSatisfying(
            UnprocessableContentException.class,
            exception -> assertThat(exception.fields().get("items")).contains(GHOST.toString()));
  }
}
