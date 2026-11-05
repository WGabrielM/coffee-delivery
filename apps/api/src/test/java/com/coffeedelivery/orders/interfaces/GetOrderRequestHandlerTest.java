package com.coffeedelivery.orders.interfaces;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.coffeedelivery.orders.application.GetOrderUseCase;
import com.coffeedelivery.orders.application.InMemoryOrderRepository;
import com.coffeedelivery.orders.domain.Address;
import com.coffeedelivery.orders.domain.Order;
import com.coffeedelivery.orders.domain.OrderItem;
import com.coffeedelivery.orders.domain.PaymentMethod;
import com.coffeedelivery.shared.error.ApiExceptionHandler;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class GetOrderRequestHandlerTest {

  private static final UUID ID = UUID.fromString("c346dbc9-d806-4351-95cc-1e447edf36d0");

  private final InMemoryOrderRepository orders = new InMemoryOrderRepository();
  private final MockMvc mvc =
      MockMvcBuilders.standaloneSetup(new GetOrderRequestHandler(new GetOrderUseCase(orders)))
          .setControllerAdvice(new ApiExceptionHandler())
          .build();

  private void storeAnOrder() {
    orders.save(
        Order.place(
            ID,
            List.of(
                OrderItem.of(
                    UUID.fromString("11111111-1111-1111-1111-111111111111"), "Latte", 990, 1),
                OrderItem.of(
                    UUID.fromString("22222222-2222-2222-2222-222222222222"), "Cuban", 990, 2)),
            new Address(
                "01310-100", "Paulista Avenue", "1000", "Apt 12", "Bela Vista", "Sao Paulo", "SP"),
            PaymentMethod.DEBIT_CARD,
            Instant.parse("2026-11-04T12:00:00.123456Z")));
  }

  @Test
  void answersTheStoredOrderInTheSameShapeAsTheCreateResponse() throws Exception {
    storeAnOrder();

    mvc.perform(get("/api/v1/orders/" + ID))
        .andExpect(status().isOk())
        .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
        .andExpect(jsonPath("$.id").value(ID.toString()))
        .andExpect(jsonPath("$.status").value("confirmed"))
        .andExpect(jsonPath("$.items.length()").value(2))
        .andExpect(jsonPath("$.items[0].name").value("Latte"))
        .andExpect(jsonPath("$.items[1].lineTotalInCents").value(1980))
        .andExpect(jsonPath("$.address.complement").value("Apt 12"))
        .andExpect(jsonPath("$.paymentMethod").value("debit_card"))
        .andExpect(jsonPath("$.subtotalInCents").value(2970))
        .andExpect(jsonPath("$.deliveryFeeInCents").value(350))
        .andExpect(jsonPath("$.totalInCents").value(3320))
        .andExpect(jsonPath("$.currency").value("USD"))
        .andExpect(jsonPath("$.estimatedDeliveryMinutes.min").value(20))
        .andExpect(jsonPath("$.estimatedDeliveryMinutes.max").value(30))
        .andExpect(jsonPath("$.createdAt").value("2026-11-04T12:00:00.123456Z"));
  }

  @Test
  void anUppercaseIdFindsTheSameOrder() throws Exception {
    storeAnOrder();

    mvc.perform(get("/api/v1/orders/" + ID.toString().toUpperCase()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(ID.toString()));
  }

  @Test
  void anIdThatDoesNotExistIsNotFound() throws Exception {
    storeAnOrder();

    mvc.perform(get("/api/v1/orders/" + UUID.randomUUID()))
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.error.code").value("not_found"))
        .andExpect(jsonPath("$.error.message").isNotEmpty())
        .andExpect(jsonPath("$.error.fields").doesNotExist());
  }

  @Test
  void anIdThatIsNotAUuidIsAlsoNotFound() throws Exception {
    for (String bad : List.of("abc", "123", "not-a-uuid", "1-1-1-1-1", ID + "0", "%20")) {
      mvc.perform(get("/api/v1/orders/" + bad))
          .andExpect(status().isNotFound())
          .andExpect(jsonPath("$.error.code").value("not_found"));
    }
  }
}
