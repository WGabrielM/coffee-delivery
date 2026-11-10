package com.coffeedelivery.orders.infrastructure;

import com.coffeedelivery.orders.application.ClearOldAddressesUseCase;
import com.coffeedelivery.orders.application.RetentionPolicy;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Runs {@link ClearOldAddressesUseCase} on the schedule of {@code orders.retention.cron} (every day
 * at 03:00 by default). It records how many orders it cleared in the metric {@code
 * orders.addresses.cleared} and in one log line that has no address data.
 */
@Component
public class ClearOldAddressesJob {

  private static final Logger LOG = LoggerFactory.getLogger(ClearOldAddressesJob.class);

  private final ClearOldAddressesUseCase useCase;
  private final RetentionPolicy policy;
  private final Counter cleared;

  ClearOldAddressesJob(
      ClearOldAddressesUseCase useCase, RetentionPolicy policy, MeterRegistry registry) {
    this.useCase = useCase;
    this.policy = policy;
    this.cleared =
        Counter.builder("orders.addresses.cleared")
            .description("Orders whose address was cleared after the retention period")
            .register(registry);
  }

  @Scheduled(cron = "${orders.retention.cron}")
  public void run() {
    int count = useCase.execute();
    cleared.increment(count);
    LOG.info("Cleared the address of {} orders older than {} days", count, policy.days());
  }
}
