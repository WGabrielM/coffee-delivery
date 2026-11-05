package com.coffeedelivery.orders.interfaces;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.coffeedelivery.orders.application.GetCheckoutConfigUseCase;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class GetCheckoutConfigRequestHandlerTest {

  private final MockMvc mvc =
      MockMvcBuilders.standaloneSetup(
              new GetCheckoutConfigRequestHandler(new GetCheckoutConfigUseCase()))
          .build();

  @Test
  void answersExactlyTheCheckoutConfiguration() throws Exception {
    mvc.perform(get("/api/v1/checkout-config"))
        .andExpect(status().isOk())
        .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
        .andExpect(
            content()
                .json(
                    """
                    {
                      "currency": "USD",
                      "deliveryFeeInCents": 350,
                      "estimatedDeliveryMinutes": { "min": 20, "max": 30 },
                      "paymentMethods": ["credit_card", "debit_card", "cash"]
                    }
                    """,
                    true));
  }
}
