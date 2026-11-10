package com.coffeedelivery.catalog;

import static org.assertj.core.api.Assertions.assertThat;

import com.coffeedelivery.e2e.ApiClient;
import com.coffeedelivery.e2e.CountingDataSourceConfiguration;
import com.coffeedelivery.e2e.PostgresContainerSupport;
import com.coffeedelivery.e2e.StatementCounter;
import java.net.http.HttpResponse;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;

/**
 * The catalog read runs its two statements on one connection, counted on the data source (spec
 * 034): one read-only transaction per request.
 */
@Tag("e2e")
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Import(CountingDataSourceConfiguration.class)
class CatalogStatementsE2ETest extends PostgresContainerSupport {

  @Value("${local.server.port}")
  private int port;

  @Autowired private StatementCounter counter;

  @Test
  void listingTheCoffeesTakesOneConnectionForItsTwoStatements() {
    counter.reset();

    HttpResponse<String> response = new ApiClient(port).get("/api/v1/coffees");

    assertThat(response.statusCode()).isEqualTo(200);
    assertThat(counter.statements()).hasSize(2);
    assertThat(counter.statements().get(0)).contains("FROM coffees");
    assertThat(counter.statements().get(1)).contains("FROM coffee_tags");
    assertThat(counter.connections()).isEqualTo(1);
  }

  @Test
  void filteringByTagsReadsTheTagListFirstAndThenTheCoffeesAndTheirTagsOnOneConnection() {
    counter.reset();

    HttpResponse<String> response = new ApiClient(port).get("/api/v1/coffees?tags=special,iced");

    assertThat(response.statusCode()).isEqualTo(200);
    // The use case first checks the tags of the request against the list of tags (one statement,
    // its own connection); the coffees and their tags are then one transaction on one connection.
    assertThat(counter.statements()).hasSize(3);
    assertThat(counter.statements().get(0)).contains("FROM tags ORDER BY position");
    assertThat(counter.statements().get(1)).contains("FROM coffees");
    assertThat(counter.statements().get(2)).contains("FROM coffee_tags");
    assertThat(counter.connections()).isEqualTo(2);
  }
}
