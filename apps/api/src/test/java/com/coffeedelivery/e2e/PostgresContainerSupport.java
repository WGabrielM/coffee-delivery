package com.coffeedelivery.e2e;

import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.wait.strategy.Wait;
import org.testcontainers.utility.DockerImageName;

/** One PostgreSQL container for the whole end-to-end JVM, started on first use. */
public abstract class PostgresContainerSupport {

  /** Keep equal to the image in compose.yaml; a root test compares them. */
  static final String POSTGRES_IMAGE = "postgres:18.6-alpine";

  private static final String DATABASE = "coffee_delivery_test";
  private static final String USER = "test";
  private static final String PASSWORD = "test";

  private static final GenericContainer<?> POSTGRES =
      new GenericContainer<>(DockerImageName.parse(POSTGRES_IMAGE))
          .withEnv("POSTGRES_DB", DATABASE)
          .withEnv("POSTGRES_USER", USER)
          .withEnv("POSTGRES_PASSWORD", PASSWORD)
          .withExposedPorts(5432)
          .waitingFor(
              Wait.forLogMessage(".*database system is ready to accept connections.*\\n", 2));

  static {
    POSTGRES.start();
  }

  @DynamicPropertySource
  static void databaseProperties(DynamicPropertyRegistry registry) {
    registry.add(
        "spring.datasource.url",
        () ->
            "jdbc:postgresql://%s:%d/%s"
                .formatted(POSTGRES.getHost(), POSTGRES.getMappedPort(5432), DATABASE));
    registry.add("spring.datasource.username", () -> USER);
    registry.add("spring.datasource.password", () -> PASSWORD);
  }
}
