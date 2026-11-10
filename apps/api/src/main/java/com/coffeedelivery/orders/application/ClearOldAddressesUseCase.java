package com.coffeedelivery.orders.application;

import java.time.Clock;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import org.springframework.stereotype.Service;

/**
 * Clears the address of every order that is older than the retention period (spec 038). The time
 * comes from the injected {@link Clock}. It does nothing a second time: an order that is already
 * cleared is not touched again, so two instances that run it together do no harm.
 */
@Service
public class ClearOldAddressesUseCase {

  private final OrderAddressRetention retention;
  private final RetentionPolicy policy;
  private final Clock clock;

  public ClearOldAddressesUseCase(
      OrderAddressRetention retention, RetentionPolicy policy, Clock clock) {
    this.retention = retention;
    this.policy = policy;
    this.clock = clock;
  }

  /** The number of orders whose address was cleared by this run. */
  public int execute() {
    Instant now = Instant.now(clock);
    Instant cutoff = now.minus(policy.days(), ChronoUnit.DAYS);
    return retention.clearAddressesCreatedBefore(cutoff, now);
  }
}
