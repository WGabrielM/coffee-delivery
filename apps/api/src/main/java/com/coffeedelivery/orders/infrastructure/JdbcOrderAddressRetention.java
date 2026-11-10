package com.coffeedelivery.orders.infrastructure;

import com.coffeedelivery.orders.application.OrderAddressRetention;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

/**
 * Clears the address of the orders that are due, in one statement. The condition {@code
 * address_cleared_at IS NULL} makes a second run, or a second instance, do nothing.
 */
@Repository
@Transactional
class JdbcOrderAddressRetention implements OrderAddressRetention {

  private final JdbcClient jdbc;

  JdbcOrderAddressRetention(JdbcClient jdbc) {
    this.jdbc = jdbc;
  }

  @Override
  public int clearAddressesCreatedBefore(Instant cutoff, Instant clearedAt) {
    return jdbc.sql(
            """
            UPDATE orders
            SET zip_code = NULL, street = NULL, number = NULL, complement = NULL,
                neighborhood = NULL, city = NULL, state = NULL,
                address_cleared_at = :clearedAt
            WHERE address_cleared_at IS NULL AND created_at < :cutoff
            """)
        .param("clearedAt", OffsetDateTime.ofInstant(clearedAt, ZoneOffset.UTC))
        .param("cutoff", OffsetDateTime.ofInstant(cutoff, ZoneOffset.UTC))
        .update();
  }
}
