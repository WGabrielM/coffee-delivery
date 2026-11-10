package com.coffeedelivery.orders.interfaces;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.coffeedelivery.orders.application.CreateOrderCommand;
import com.coffeedelivery.orders.domain.PaymentMethod;
import com.coffeedelivery.shared.error.ValidationFailedException;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

class CreateOrderRequestValidatorTest {

  private static final JsonMapper JSON = JsonMapper.builder().build();
  private static final String LATTE = "11111111-1111-1111-1111-111111111111";
  private static final String CUBAN = "22222222-2222-2222-2222-222222222222";

  private static JsonNode node(String json) {
    return JSON.readTree(json);
  }

  private static CreateOrderRequest.ItemRequest item(String coffeeId, String quantityJson) {
    return new CreateOrderRequest.ItemRequest(coffeeId, node(quantityJson));
  }

  private static CreateOrderRequest.AddressRequest address() {
    return new CreateOrderRequest.AddressRequest(
        "01310-100", "Paulista Avenue", "1000", null, "Bela Vista", "Sao Paulo", "SP");
  }

  private static CreateOrderRequest valid() {
    return new CreateOrderRequest(
        List.of(item(LATTE, "1"), item(CUBAN, "2")), address(), "credit_card");
  }

  private static CreateOrderRequest withAddress(CreateOrderRequest.AddressRequest address) {
    return new CreateOrderRequest(valid().items(), address, "cash");
  }

  private static CreateOrderRequest.AddressRequest address(
      String zip,
      String street,
      String number,
      String complement,
      String neighborhood,
      String city,
      String state) {
    return new CreateOrderRequest.AddressRequest(
        zip, street, number, complement, neighborhood, city, state);
  }

  private static Map<String, String> fieldsOf(CreateOrderRequest request) {
    ValidationFailedException[] thrown = new ValidationFailedException[1];
    assertThatThrownBy(() -> CreateOrderRequestValidator.toCommand(request))
        .isInstanceOfSatisfying(ValidationFailedException.class, e -> thrown[0] = e);
    return thrown[0].fields();
  }

  @Test
  void aValidRequestBecomesACommand() {
    CreateOrderCommand command = CreateOrderRequestValidator.toCommand(valid());

    assertThat(command.items()).hasSize(2);
    assertThat(command.items().get(0).coffeeId()).isEqualTo(UUID.fromString(LATTE));
    assertThat(command.items().get(0).quantity()).isEqualTo(1);
    assertThat(command.items().get(1).quantity()).isEqualTo(2);
    assertThat(command.paymentMethod()).isEqualTo(PaymentMethod.CREDIT_CARD);
    assertThat(command.address().zipCode()).isEqualTo("01310-100");
    assertThat(command.address().complement()).isNull();
  }

  @Test
  void textFieldsAreTrimmedAndABlankComplementBecomesNull() {
    CreateOrderRequest request =
        withAddress(
            address(
                "01310-100",
                "  Paulista Avenue ",
                " 1000",
                "   ",
                " Bela Vista ",
                "Sao Paulo ",
                "SP"));

    CreateOrderCommand command = CreateOrderRequestValidator.toCommand(request);

    assertThat(command.address().street()).isEqualTo("Paulista Avenue");
    assertThat(command.address().number()).isEqualTo("1000");
    assertThat(command.address().neighborhood()).isEqualTo("Bela Vista");
    assertThat(command.address().city()).isEqualTo("Sao Paulo");
    assertThat(command.address().complement()).isNull();
  }

  @Test
  void aComplementIsKeptTrimmed() {
    CreateOrderRequest request =
        withAddress(address("01310-100", "Street", "1", " Apt 12 ", "Neighborhood", "City", "SP"));

    assertThat(CreateOrderRequestValidator.toCommand(request).address().complement())
        .isEqualTo("Apt 12");
  }

  @Test
  void aComplementOfSixtyCharactersIsAcceptedAndSixtyOneIsNot() {
    String sixty = "x".repeat(60);
    CreateOrderRequest ok =
        withAddress(address("01310-100", "Street", "1", sixty, "Neighborhood", "City", "SP"));
    CreateOrderRequest tooLong =
        withAddress(address("01310-100", "Street", "1", sixty + "x", "Neighborhood", "City", "SP"));

    assertThat(CreateOrderRequestValidator.toCommand(ok).address().complement()).isEqualTo(sixty);
    assertThat(fieldsOf(tooLong)).containsOnlyKeys("address.complement");
  }

  @Test
  void anOrderWithNoItemsIsRejected() {
    assertThat(fieldsOf(new CreateOrderRequest(List.of(), address(), "cash")))
        .containsOnlyKeys("items");
    assertThat(fieldsOf(new CreateOrderRequest(null, address(), "cash"))).containsOnlyKeys("items");
  }

  @Test
  void aCoffeeIdThatIsNotAUuidIsRejectedAtItsPath() {
    CreateOrderRequest request =
        new CreateOrderRequest(
            List.of(item(LATTE, "1"), item("not-a-uuid", "1"), item(null, "1")), address(), "cash");

    assertThat(fieldsOf(request)).containsOnlyKeys("items[1].coffeeId", "items[2].coffeeId");
  }

  @Test
  void aQuantityMustBeAnIntegerFromOneToNinetyNine() {
    for (String bad : List.of("0", "100", "-1", "1.5", "\"2\"", "null", "true", "{}", "2.0e0")) {
      CreateOrderRequest request =
          new CreateOrderRequest(List.of(item(LATTE, bad)), address(), "cash");

      assertThat(fieldsOf(request)).as("quantity " + bad).containsOnlyKeys("items[0].quantity");
    }
    for (String good : List.of("1", "50", "99")) {
      CreateOrderRequest request =
          new CreateOrderRequest(List.of(item(LATTE, good)), address(), "cash");

      assertThat(CreateOrderRequestValidator.toCommand(request).items().get(0).quantity())
          .isEqualTo(Integer.parseInt(good));
    }
  }

  @Test
  void aMissingQuantityIsRejected() {
    CreateOrderRequest request =
        new CreateOrderRequest(
            List.of(new CreateOrderRequest.ItemRequest(LATTE, null)), address(), "cash");

    assertThat(fieldsOf(request)).containsOnlyKeys("items[0].quantity");
  }

  @Test
  void theSameCoffeeTwiceIsRejectedInItems() {
    CreateOrderRequest request =
        new CreateOrderRequest(
            List.of(item(LATTE, "1"), item(CUBAN, "1"), item(LATTE.toUpperCase(), "2")),
            address(),
            "cash");

    assertThat(fieldsOf(request)).containsOnlyKeys("items");
  }

  @Test
  void aNullItemIsRejected() {
    java.util.ArrayList<CreateOrderRequest.ItemRequest> items = new java.util.ArrayList<>();
    items.add(null);

    assertThat(fieldsOf(new CreateOrderRequest(items, address(), "cash")))
        .containsOnlyKeys("items[0]");
  }

  @Test
  void theZipCodeMustLookLikeFiveDigitsDashThree() {
    for (String bad :
        List.of("01310100", "1310-100", "01310-10", "01310-1000", "abcde-fgh", "", " ")) {
      CreateOrderRequest request =
          withAddress(address(bad, "Street", "1", null, "Neighborhood", "City", "SP"));

      assertThat(fieldsOf(request)).as("zip " + bad).containsOnlyKeys("address.zipCode");
    }
    assertThat(fieldsOf(withAddress(address(null, "Street", "1", null, "N", "C", "SP"))))
        .containsOnlyKeys("address.zipCode");
  }

  @Test
  void theStateMustBeTwoUppercaseLetters() {
    for (String bad : List.of("sp", "S", "SPA", "S1", "", "Sp")) {
      CreateOrderRequest request =
          withAddress(address("01310-100", "Street", "1", null, "Neighborhood", "City", bad));

      assertThat(fieldsOf(request)).as("state " + bad).containsOnlyKeys("address.state");
    }
  }

  @Test
  void streetNumberNeighborhoodAndCityMustNotBeBlank() {
    CreateOrderRequest request = withAddress(address("01310-100", " ", "", null, null, "\t", "SP"));

    assertThat(fieldsOf(request))
        .containsOnlyKeys(
            "address.street", "address.number", "address.neighborhood", "address.city");
  }

  @Test
  void aMissingAddressIsRejectedAsAWhole() {
    assertThat(fieldsOf(new CreateOrderRequest(valid().items(), null, "cash")))
        .containsOnlyKeys("address");
  }

  @Test
  void thePaymentMethodMustBeOneOfTheThree() {
    for (String bad : List.of("bitcoin", "CASH", "", " ")) {
      assertThat(fieldsOf(new CreateOrderRequest(valid().items(), address(), bad)))
          .as("payment " + bad)
          .containsOnlyKeys("paymentMethod");
    }
    assertThat(fieldsOf(new CreateOrderRequest(valid().items(), address(), null)))
        .containsOnlyKeys("paymentMethod");
    for (PaymentMethod method : PaymentMethod.values()) {
      CreateOrderRequest request =
          new CreateOrderRequest(valid().items(), address(), method.value());

      assertThat(CreateOrderRequestValidator.toCommand(request).paymentMethod()).isEqualTo(method);
    }
  }

  @Test
  void everyProblemIsReportedAtOnceWithAMessageAPersonCanRead() {
    CreateOrderRequest request =
        new CreateOrderRequest(
            List.of(), address("1", "", "1", "x".repeat(61), "N", "C", "sp"), "bitcoin");

    Map<String, String> fields = fieldsOf(request);

    assertThat(fields)
        .containsOnlyKeys(
            "items",
            "address.zipCode",
            "address.street",
            "address.complement",
            "address.state",
            "paymentMethod");
    assertThat(fields.get("address.zipCode")).isEqualTo("Enter a ZIP code like 12345-678.");
    assertThat(fields.get("address.state"))
        .isEqualTo("Enter the state as two uppercase letters, like SP.");
    assertThat(fields.get("items")).isEqualTo("Add at least one coffee.");
    assertThat(fields.get("paymentMethod")).contains("credit_card", "debit_card", "cash");
  }

  private static final String KEY = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

  @Test
  void noKeyHeaderMeansNoKey() {
    assertThat(CreateOrderRequestValidator.toCommand(valid(), null).idempotencyKey()).isNull();
    assertThat(CreateOrderRequestValidator.toCommand(valid()).idempotencyKey()).isNull();
  }

  @Test
  void aUuidKeyIsReadAndTrimmed() {
    CreateOrderCommand command = CreateOrderRequestValidator.toCommand(valid(), "  " + KEY + " ");

    assertThat(command.idempotencyKey()).isEqualTo(UUID.fromString(KEY));
  }

  @Test
  void aKeyThatIsNotAUuidIsAFieldErrorNamedAfterTheHeader() {
    for (String bad : new String[] {"", "   ", "not-a-uuid", KEY + "0"}) {
      assertThatThrownBy(() -> CreateOrderRequestValidator.toCommand(valid(), bad))
          .isInstanceOfSatisfying(
              ValidationFailedException.class,
              e ->
                  assertThat(e.fields())
                      .containsOnlyKeys("Idempotency-Key")
                      .containsEntry(
                          "Idempotency-Key", "Send the Idempotency-Key header as a UUID."));
    }
  }

  @Test
  void aBadKeyAndABadBodyAreReportedTogether() {
    CreateOrderRequest request = new CreateOrderRequest(List.of(), address(), "credit_card");

    assertThatThrownBy(() -> CreateOrderRequestValidator.toCommand(request, "nope"))
        .isInstanceOfSatisfying(
            ValidationFailedException.class,
            e -> assertThat(e.fields()).containsOnlyKeys("Idempotency-Key", "items"));
  }
}
