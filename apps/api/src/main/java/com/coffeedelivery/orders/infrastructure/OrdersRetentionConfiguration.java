package com.coffeedelivery.orders.infrastructure;

import com.coffeedelivery.orders.application.RetentionPolicy;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

/** The retention setting and the scheduling that runs {@link ClearOldAddressesJob}. */
@Configuration
@EnableScheduling
class OrdersRetentionConfiguration {

  @Bean
  RetentionPolicy retentionPolicy(@Value("${orders.retention.days}") int days) {
    return new RetentionPolicy(days);
  }
}
