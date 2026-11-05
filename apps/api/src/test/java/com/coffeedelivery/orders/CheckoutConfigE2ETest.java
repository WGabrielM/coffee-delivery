package com.coffeedelivery.orders;

import static org.assertj.core.api.Assertions.assertThat;

import com.coffeedelivery.e2e.ApiClient;
import com.coffeedelivery.e2e.PostgresContainerSupport;
import com.jayway.jsonpath.JsonPath;
import java.net.http.HttpResponse;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;

/** GET /api/v1/checkout-config against the real application. */
@Tag("e2e")
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class CheckoutConfigE2ETest extends PostgresContainerSupport {

  @Value("${local.server.port}")
  private int port;

  @Test
  void answersTheCheckoutConfiguration() {
    HttpResponse<String> response = new ApiClient(port).get("/api/v1/checkout-config");

    assertThat(response.statusCode()).isEqualTo(200);
    assertThat(response.headers().firstValue("Content-Type").orElse(""))
        .contains("application/json");
    Map<String, Object> body = JsonPath.read(response.body(), "$");
    assertThat(body)
        .containsOnlyKeys(
            "currency", "deliveryFeeInCents", "estimatedDeliveryMinutes", "paymentMethods");
    assertThat(body.get("currency")).isEqualTo("USD");
    assertThat(body.get("deliveryFeeInCents")).isEqualTo(350);
    assertThat((Map<String, Object>) body.get("estimatedDeliveryMinutes"))
        .containsOnly(Map.entry("min", 20), Map.entry("max", 30));
    assertThat((List<String>) body.get("paymentMethods"))
        .containsExactly("credit_card", "debit_card", "cash");
  }
}
