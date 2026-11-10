package com.coffeedelivery.orders.interfaces;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.startsWith;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.coffeedelivery.orders.application.CreateOrderUseCase;
import com.coffeedelivery.orders.application.FakeCoffeePriceLookup;
import com.coffeedelivery.orders.application.InMemoryOrderRepository;
import com.coffeedelivery.orders.application.RetentionPolicy;
import com.coffeedelivery.shared.error.ApiExceptionHandler;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class CreateOrderRequestHandlerTest {

  private static final UUID LATTE = UUID.fromString("11111111-1111-1111-1111-111111111111");
  private static final UUID CUBAN = UUID.fromString("22222222-2222-2222-2222-222222222222");
  private static final String GHOST = "33333333-3333-3333-3333-333333333333";

  private final InMemoryOrderRepository orders = new InMemoryOrderRepository();
  private final MockMvc mvc =
      MockMvcBuilders.standaloneSetup(
              new CreateOrderRequestHandler(
                  new CreateOrderUseCase(
                      new FakeCoffeePriceLookup()
                          .with(LATTE, "Latte", 990)
                          .with(CUBAN, "Cuban", 990),
                      orders,
                      Clock.fixed(Instant.parse("2026-11-04T12:00:00Z"), ZoneOffset.UTC)),
                  new RetentionPolicy(90)))
          .setControllerAdvice(new ApiExceptionHandler())
          .build();

  private static String body(String items, String paymentMethod) {
    return """
        {
          "items": %s,
          "address": {
            "zipCode": "01310-100", "street": "Paulista Avenue", "number": "1000",
            "neighborhood": "Bela Vista", "city": "Sao Paulo", "state": "SP"
          },
          "paymentMethod": "%s"
        }
        """
        .formatted(items, paymentMethod);
  }

  private static final String VALID_ITEMS =
      """
      [ {"coffeeId": "%s", "quantity": 1}, {"coffeeId": "%s", "quantity": 2} ]
      """
          .formatted(LATTE, CUBAN);

  private static MockHttpServletRequestBuilder json(String content) {
    return post("/api/v1/orders").contentType(MediaType.APPLICATION_JSON).content(content);
  }

  @Test
  void createsTheOrderAndAnswers201WithLocationAndTheOrder() throws Exception {
    mvc.perform(json(body(VALID_ITEMS, "credit_card")))
        .andExpect(status().isCreated())
        .andExpect(header().string("Location", startsWith("/api/v1/orders/")))
        .andExpect(jsonPath("$.id").isNotEmpty())
        .andExpect(jsonPath("$.status").value("confirmed"))
        .andExpect(jsonPath("$.items.length()").value(2))
        .andExpect(jsonPath("$.items[0].coffeeId").value(LATTE.toString()))
        .andExpect(jsonPath("$.items[0].name").value("Latte"))
        .andExpect(jsonPath("$.items[0].quantity").value(1))
        .andExpect(jsonPath("$.items[0].unitPriceInCents").value(990))
        .andExpect(jsonPath("$.items[0].lineTotalInCents").value(990))
        .andExpect(jsonPath("$.items[1].lineTotalInCents").value(1980))
        .andExpect(jsonPath("$.address.zipCode").value("01310-100"))
        .andExpect(jsonPath("$.address.complement").doesNotExist())
        .andExpect(jsonPath("$.paymentMethod").value("credit_card"))
        .andExpect(jsonPath("$.subtotalInCents").value(2970))
        .andExpect(jsonPath("$.deliveryFeeInCents").value(350))
        .andExpect(jsonPath("$.totalInCents").value(3320))
        .andExpect(jsonPath("$.currency").value("USD"))
        .andExpect(jsonPath("$.estimatedDeliveryMinutes.min").value(20))
        .andExpect(jsonPath("$.estimatedDeliveryMinutes.max").value(30))
        .andExpect(jsonPath("$.createdAt").value("2026-11-04T12:00:00Z"))
        .andExpect(jsonPath("$.addressRetentionDays").value(90));
  }

  @Test
  void theLocationPointsAtTheNewOrder() throws Exception {
    String location =
        mvc.perform(json(body(VALID_ITEMS, "cash")))
            .andExpect(status().isCreated())
            .andReturn()
            .getResponse()
            .getHeader("Location");

    org.assertj.core.api.Assertions.assertThat(orders.saved()).hasSize(1);
    org.assertj.core.api.Assertions.assertThat(location)
        .isEqualTo("/api/v1/orders/" + orders.saved().get(0).id());
  }

  @Test
  void pricesSentByTheClientAreIgnored() throws Exception {
    String withPrices =
        """
        {
          "items": [ {"coffeeId": "%s", "quantity": 1, "priceInCents": 1, "unitPriceInCents": 1,
                      "lineTotalInCents": 1},
                     {"coffeeId": "%s", "quantity": 2, "price": 0.01} ],
          "address": { "zipCode": "01310-100", "street": "S", "number": "1", "neighborhood": "N",
                       "city": "C", "state": "SP", "totalInCents": 5 },
          "paymentMethod": "cash",
          "subtotalInCents": 1, "deliveryFeeInCents": 0, "totalInCents": 1
        }
        """
            .formatted(LATTE, CUBAN);

    mvc.perform(json(withPrices))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.items[0].unitPriceInCents").value(990))
        .andExpect(jsonPath("$.subtotalInCents").value(2970))
        .andExpect(jsonPath("$.deliveryFeeInCents").value(350))
        .andExpect(jsonPath("$.totalInCents").value(3320));
  }

  @Test
  void invalidFieldsAreA400WithOneEntryPerPath() throws Exception {
    String bad =
        """
        { "items": [ {"coffeeId": "x", "quantity": 0} ],
          "address": { "zipCode": "1", "street": "S", "number": "1", "neighborhood": "N",
                       "city": "C", "state": "SP" },
          "paymentMethod": "bitcoin" }
        """;

    mvc.perform(json(bad))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error.code").value("validation_failed"))
        .andExpect(jsonPath("$.error.fields['items[0].coffeeId']").isNotEmpty())
        .andExpect(jsonPath("$.error.fields['items[0].quantity']").isNotEmpty())
        .andExpect(
            jsonPath("$.error.fields['address.zipCode']").value("Enter a ZIP code like 12345-678."))
        .andExpect(jsonPath("$.error.fields.paymentMethod").isNotEmpty());
    org.assertj.core.api.Assertions.assertThat(orders.saved()).isEmpty();
  }

  @Test
  void aCoffeeThatIsNotInTheCatalogIs422WithTheIdInItems() throws Exception {
    String items =
        """
        [ {"coffeeId": "%s", "quantity": 1}, {"coffeeId": "%s", "quantity": 1} ]
        """
            .formatted(LATTE, GHOST);

    mvc.perform(json(body(items, "cash")))
        .andExpect(status().isUnprocessableContent())
        .andExpect(jsonPath("$.error.code").value("unprocessable_content"))
        .andExpect(jsonPath("$.error.fields.items").value(containsString(GHOST)));
    org.assertj.core.api.Assertions.assertThat(orders.saved()).isEmpty();
  }

  private static final String KEY = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

  private static MockHttpServletRequestBuilder withKey(String key, String content) {
    return json(content).header("Idempotency-Key", key);
  }

  @Test
  void theSameKeyAndRequestAnswers201ThenTheSameOrderWith200() throws Exception {
    String content = body(VALID_ITEMS, "credit_card");

    var first =
        mvc.perform(withKey(KEY, content))
            .andExpect(status().isCreated())
            .andReturn()
            .getResponse();
    var second =
        mvc.perform(withKey(KEY, content)).andExpect(status().isOk()).andReturn().getResponse();

    org.assertj.core.api.Assertions.assertThat(second.getContentAsString())
        .isEqualTo(first.getContentAsString());
    org.assertj.core.api.Assertions.assertThat(second.getHeader("Location"))
        .isEqualTo(first.getHeader("Location"));
    org.assertj.core.api.Assertions.assertThat(orders.saved()).hasSize(1);
  }

  @Test
  void theSameKeyWithAnotherRequestIs422OnTheKeyAndStoresNothingMore() throws Exception {
    mvc.perform(withKey(KEY, body(VALID_ITEMS, "credit_card"))).andExpect(status().isCreated());

    mvc.perform(withKey(KEY, body(VALID_ITEMS, "cash")))
        .andExpect(status().isUnprocessableContent())
        .andExpect(jsonPath("$.error.code").value("unprocessable_content"))
        .andExpect(jsonPath("$.error.fields['Idempotency-Key']").isNotEmpty());
    org.assertj.core.api.Assertions.assertThat(orders.saved()).hasSize(1);
  }

  @Test
  void aKeyThatIsNotAUuidIsA400OnTheKeyAndStoresNothing() throws Exception {
    mvc.perform(withKey("not-a-uuid", body(VALID_ITEMS, "cash")))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error.code").value("validation_failed"))
        .andExpect(jsonPath("$.error.fields['Idempotency-Key']").isNotEmpty());
    org.assertj.core.api.Assertions.assertThat(orders.saved()).isEmpty();
  }

  @Test
  void withoutAKeyTheSameRequestCreatesTwoOrders() throws Exception {
    String content = body(VALID_ITEMS, "cash");

    mvc.perform(json(content)).andExpect(status().isCreated());
    mvc.perform(json(content)).andExpect(status().isCreated());

    org.assertj.core.api.Assertions.assertThat(orders.saved()).hasSize(2);
  }

  @Test
  void aBodyThatIsNotJsonIsA400() throws Exception {
    mvc.perform(json("{not json"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error.code").value("validation_failed"))
        .andExpect(jsonPath("$.error.fields.body").isNotEmpty());
  }

  @Test
  void aMissingBodyIsA400() throws Exception {
    mvc.perform(post("/api/v1/orders").contentType(MediaType.APPLICATION_JSON))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error.code").value("validation_failed"));
  }

  @Test
  void anEmptyObjectReportsTheRequiredFields() throws Exception {
    mvc.perform(json("{}"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error.fields.items").isNotEmpty())
        .andExpect(jsonPath("$.error.fields.address").isNotEmpty())
        .andExpect(jsonPath("$.error.fields.paymentMethod").isNotEmpty());
  }
}
