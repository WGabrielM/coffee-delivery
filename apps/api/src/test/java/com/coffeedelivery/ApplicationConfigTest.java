package com.coffeedelivery;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Properties;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.config.YamlPropertiesFactoryBean;
import org.springframework.core.io.ClassPathResource;

class ApplicationConfigTest {

  private final Properties properties = load();

  @Test
  void theApiListensOnPort3000() {
    assertThat(properties.getProperty("server.port")).isEqualTo("3000");
  }

  @Test
  void logsAreJsonOnStdout() {
    assertThat(properties.getProperty("logging.structured.format.console")).isEqualTo("logstash");
  }

  @Test
  void flywayReadsTheMigrationFolder() {
    assertThat(properties.getProperty("spring.flyway.locations"))
        .isEqualTo("classpath:db/migration");
  }

  @Test
  void databaseSettingsComeFromTheEnvironmentWithoutLiteralSecrets() {
    assertThat(properties.getProperty("spring.datasource.url"))
        .contains("${POSTGRES_PORT}")
        .contains("${POSTGRES_DB}");
    assertThat(properties.getProperty("spring.datasource.username")).isEqualTo("${POSTGRES_USER}");
    assertThat(properties.getProperty("spring.datasource.password"))
        .isEqualTo("${POSTGRES_PASSWORD}");
  }

  @Test
  void telemetryGoesToTheEndpointFromTheEnvironment() {
    assertThat(properties.getProperty("management.opentelemetry.tracing.export.otlp.endpoint"))
        .contains("${OTEL_EXPORTER_OTLP_ENDPOINT:http://localhost:4318}");
    assertThat(properties.getProperty("management.otlp.metrics.export.url"))
        .contains("${OTEL_EXPORTER_OTLP_ENDPOINT:http://localhost:4318}");
  }

  @Test
  void onlyTheHealthEndpointIsExposed() {
    assertThat(properties.getProperty("management.endpoints.web.exposure.include"))
        .isEqualTo("health");
  }

  private static Properties load() {
    YamlPropertiesFactoryBean yaml = new YamlPropertiesFactoryBean();
    yaml.setResources(new ClassPathResource("application.yaml"));
    return yaml.getObject();
  }
}
