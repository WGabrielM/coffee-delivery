package com.coffeedelivery.shared.logging;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import java.util.HashMap;
import java.util.Map;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

class RequestLoggingFilterTest {

  private final Logger logger = (Logger) LoggerFactory.getLogger(RequestLoggingFilter.class);
  private final ListAppender<ILoggingEvent> appender = new ListAppender<>();
  private final RequestLoggingFilter filter = new RequestLoggingFilter();

  @BeforeEach
  void attachAppender() {
    logger.setLevel(Level.INFO);
    appender.start();
    logger.addAppender(appender);
  }

  @AfterEach
  void detachAppender() {
    logger.detachAppender(appender);
    appender.stop();
  }

  @Test
  void logsOneLineWithMethodPathStatusAndDuration() throws Exception {
    MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1");
    request.setQueryString("secret=1");
    MockHttpServletResponse response = new MockHttpServletResponse();
    FilterChain chain = (req, res) -> response.setStatus(201);

    filter.doFilter(request, response, chain);

    assertThat(appender.list).hasSize(1);
    ILoggingEvent event = appender.list.get(0);
    assertThat(event.getFormattedMessage()).isEqualTo("request completed");
    Map<String, Object> fields = keyValues(event);
    assertThat(fields).containsEntry("method", "GET");
    assertThat(fields).containsEntry("path", "/api/v1");
    assertThat(fields).containsEntry("status", 201);
    assertThat(fields.get("durationMs")).isInstanceOf(Long.class);
    assertThat((Long) fields.get("durationMs")).isGreaterThanOrEqualTo(0L);
  }

  @Test
  void neverLogsTheQueryString() throws Exception {
    MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/coffees");
    request.setQueryString("tags=special");

    filter.doFilter(request, new MockHttpServletResponse(), (req, res) -> {});

    assertThat(keyValues(appender.list.get(0)).values())
        .noneMatch(v -> v.toString().contains("tags"));
  }

  @Test
  void logsStatus500AndRethrowsWhenTheChainFails() {
    MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1");
    FilterChain chain =
        (req, res) -> {
          throw new ServletException("boom");
        };

    assertThatThrownBy(() -> filter.doFilter(request, new MockHttpServletResponse(), chain))
        .isInstanceOf(ServletException.class);

    assertThat(keyValues(appender.list.get(0))).containsEntry("status", 500);
  }

  private static Map<String, Object> keyValues(ILoggingEvent event) {
    Map<String, Object> values = new HashMap<>();
    event.getKeyValuePairs().forEach(pair -> values.put(pair.key, pair.value));
    return values;
  }
}
