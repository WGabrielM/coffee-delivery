package com.coffeedelivery.orders.interfaces;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.coffeedelivery.orders.application.FakeCoffeePriceLookup;
import com.coffeedelivery.orders.application.QuoteOrderUseCase;
import com.coffeedelivery.shared.error.ApiExceptionHandler;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class QuoteOrderRequestHandlerTest {

  private static final UUID LATTE = UUID.fromString("11111111-1111-1111-1111-111111111111");
  private static final UUID CUBAN = UUID.fromString("22222222-2222-2222-2222-222222222222");
  private static final String GHOST = "33333333-3333-3333-3333-333333333333";

  private final MockMvc mvc =
      MockMvcBuilders.standaloneSetup(
              new QuoteOrderRequestHandler(
                  new QuoteOrderUseCase(
                      new FakeCoffeePriceLookup()
                          .with(LATTE, "Latte", 990)
                          .with(CUBAN, "Cuban", 990))))
          .setControllerAdvice(new ApiExceptionHandler())
          .build();

  private static MockHttpServletRequestBuilder quote(String json) {
    return post("/api/v1/orders/quote").contentType(MediaType.APPLICATION_JSON).content(json);
  }

  private static final String ITEMS =
      "[{\"coffeeId\": \""
          + LATTE
          + "\", \"quantity\": 2}, {\"coffeeId\": \""
          + CUBAN
          + "\", \"quantity\": 1}]";

  @Test
  void answers200WithTheLinesInTheOrderSentAndTheTotals() throws Exception {
    mvc.perform(quote("{\"items\": " + ITEMS + "}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.items.length()").value(2))
        .andExpect(jsonPath("$.items[0].coffeeId").value(LATTE.toString()))
        .andExpect(jsonPath("$.items[0].name").value("Latte"))
        .andExpect(jsonPath("$.items[0].quantity").value(2))
        .andExpect(jsonPath("$.items[0].unitPriceInCents").value(990))
        .andExpect(jsonPath("$.items[0].lineTotalInCents").value(1980))
        .andExpect(jsonPath("$.items[1].lineTotalInCents").value(990))
        .andExpect(jsonPath("$.subtotalInCents").value(2970))
        .andExpect(jsonPath("$.deliveryFeeInCents").value(350))
        .andExpect(jsonPath("$.totalInCents").value(3320))
        .andExpect(jsonPath("$.currency").value("USD"));
  }

  @Test
  void aZipCodeIsAcceptedAndChangesNothingToday() throws Exception {
    mvc.perform(quote("{\"items\": " + ITEMS + ", \"zipCode\": \"90250-440\"}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.totalInCents").value(3320));
  }

  @Test
  void pricesSentByTheClientAreIgnored() throws Exception {
    String body =
        "{\"items\": [{\"coffeeId\": \""
            + LATTE
            + "\", \"quantity\": 1, \"priceInCents\": 1, \"unitPriceInCents\": 1}],"
            + " \"totalInCents\": 1}";

    mvc.perform(quote(body))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.items[0].unitPriceInCents").value(990))
        .andExpect(jsonPath("$.totalInCents").value(1340));
  }

  @Test
  void aBadZipCodeAndBadItemsAreA400WithOneEntryPerPath() throws Exception {
    String body = "{\"items\": [{\"coffeeId\": \"x\", \"quantity\": 0}], \"zipCode\": \"123\"}";

    mvc.perform(quote(body))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error.code").value("validation_failed"))
        .andExpect(jsonPath("$.error.fields['items[0].coffeeId']").isNotEmpty())
        .andExpect(jsonPath("$.error.fields['items[0].quantity']").isNotEmpty())
        .andExpect(jsonPath("$.error.fields.zipCode").value("Enter a ZIP code like 12345-678."));
  }

  @Test
  void anEmptyListOfItemsAndARepeatedCoffeeAreA400() throws Exception {
    mvc.perform(quote("{\"items\": []}"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error.fields.items").isNotEmpty());
    mvc.perform(
            quote(
                "{\"items\": [{\"coffeeId\": \""
                    + LATTE
                    + "\", \"quantity\": 1},"
                    + " {\"coffeeId\": \""
                    + LATTE
                    + "\", \"quantity\": 2}]}"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error.fields.items").value("Each coffee can appear only once."));
  }

  @Test
  void aCoffeeThatIsNotInTheCatalogIs422WithTheIdInItems() throws Exception {
    mvc.perform(quote("{\"items\": [{\"coffeeId\": \"" + GHOST + "\", \"quantity\": 1}]}"))
        .andExpect(status().isUnprocessableContent())
        .andExpect(jsonPath("$.error.code").value("unprocessable_content"))
        .andExpect(jsonPath("$.error.fields.items").value(containsString(GHOST)));
  }

  @Test
  void aBodyThatIsNotJsonIsA400() throws Exception {
    mvc.perform(quote("{not json"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error.fields.body").isNotEmpty());
  }
}
