package com.coffeedelivery.e2e;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;

import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import com.coffeedelivery.shared.logging.RequestLoggingFilter;
import com.jayway.jsonpath.JsonPath;
import io.micrometer.core.instrument.MeterRegistry;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpRequest.BodyPublishers;
import java.net.http.HttpResponse;
import java.net.http.HttpResponse.BodyHandlers;
import java.time.Duration;
import java.util.Map;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;

/** The API running for real, on a random port, against a PostgreSQL in Docker. */
@Tag("e2e")
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class ApiE2ETest extends PostgresContainerSupport {

  private final HttpClient client = HttpClient.newHttpClient();

  @Value("${local.server.port}")
  private int port;

  @Autowired private JdbcTemplate jdbc;
  @Autowired private MeterRegistry meters;

  @Test
  void healthIsUp() throws Exception {
    HttpResponse<String> response = get("/actuator/health");

    assertThat(response.statusCode()).isEqualTo(200);
    assertThat((String) JsonPath.read(response.body(), "$.status")).isEqualTo("UP");
  }

  @Test
  void flywayRanAtStartup() {
    Integer tables =
        jdbc.queryForObject(
            "SELECT count(*) FROM information_schema.tables WHERE table_name = 'flyway_schema_history'",
            Integer.class);

    assertThat(tables).isEqualTo(1);
  }

  @Test
  void apiInfoAnswersNameAndVersion() throws Exception {
    HttpResponse<String> response = get("/api/v1");

    assertThat(response.statusCode()).isEqualTo(200);
    assertThat((String) JsonPath.read(response.body(), "$.name")).isEqualTo("coffee-delivery-api");
    assertThat((String) JsonPath.read(response.body(), "$.version")).isEqualTo("v1");
  }

  @Test
  void anUnknownRouteIsNotFoundInTheErrorShape() throws Exception {
    HttpResponse<String> response = get("/api/v1/does-not-exist");

    assertThat(response.statusCode()).isEqualTo(404);
    assertThat((String) JsonPath.read(response.body(), "$.error.code")).isEqualTo("not_found");
    assertThat((String) JsonPath.read(response.body(), "$.error.message")).isNotBlank();
    Map<String, Object> error = JsonPath.read(response.body(), "$.error");
    assertThat(error).doesNotContainKey("fields");
  }

  @Test
  void aBodyThatIsNotJsonIsAValidationFailure() throws Exception {
    HttpResponse<String> response = post("/api/v1/test-support/echo", "{not json");

    assertThat(response.statusCode()).isEqualTo(400);
    assertThat((String) JsonPath.read(response.body(), "$.error.code"))
        .isEqualTo("validation_failed");
    Map<String, Object> fields = JsonPath.read(response.body(), "$.error.fields");
    assertThat(fields).containsKey("body");
  }

  @Test
  void anUnhandledExceptionIsAGenericServerError() throws Exception {
    HttpResponse<String> response = get("/api/v1/test-support/boom");

    assertThat(response.statusCode()).isEqualTo(500);
    assertThat((String) JsonPath.read(response.body(), "$.error.code"))
        .isEqualTo("unexpected_error");
    assertThat(response.body())
        .doesNotContain("secret internal detail")
        .doesNotContain("IllegalStateException")
        .doesNotContain("at com.");
  }

  @Test
  void eachRequestWritesOneLogLineWithMethodPathStatusAndDuration() throws Exception {
    Logger logger = (Logger) LoggerFactory.getLogger(RequestLoggingFilter.class);
    ListAppender<ILoggingEvent> appender = new ListAppender<>();
    appender.start();
    logger.addAppender(appender);
    try {
      get("/api/v1");

      await()
          .atMost(Duration.ofSeconds(5))
          .untilAsserted(
              () ->
                  assertThat(appender.list)
                      .anySatisfy(
                          event -> {
                            assertThat(event.getFormattedMessage()).isEqualTo("request completed");
                            assertThat(event.getKeyValuePairs())
                                .anyMatch(
                                    pair ->
                                        pair.key.equals("path") && "/api/v1".equals(pair.value));
                            assertThat(event.getKeyValuePairs())
                                .anyMatch(
                                    pair ->
                                        pair.key.equals("status")
                                            && Integer.valueOf(200).equals(pair.value));
                          }));
    } finally {
      logger.detachAppender(appender);
      appender.stop();
    }
  }

  @Test
  void httpServerMetricsAreRecorded() throws Exception {
    get("/api/v1");

    await()
        .atMost(Duration.ofSeconds(5))
        .untilAsserted(() -> assertThat(meters.find("http.server.requests").timer()).isNotNull());
  }

  private HttpResponse<String> get(String path) throws Exception {
    HttpRequest request =
        HttpRequest.newBuilder(URI.create("http://localhost:" + port + path)).GET().build();
    return client.send(request, BodyHandlers.ofString());
  }

  private HttpResponse<String> post(String path, String body) throws Exception {
    HttpRequest request =
        HttpRequest.newBuilder(URI.create("http://localhost:" + port + path))
            .header("Content-Type", "application/json")
            .POST(BodyPublishers.ofString(body))
            .build();
    return client.send(request, BodyHandlers.ofString());
  }
}
