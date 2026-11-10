package com.coffeedelivery.e2e;

import javax.sql.DataSource;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;

/**
 * Wraps the data source of the application in a {@link StatementCounter}. A test that wants to
 * count statements adds {@code @Import(CountingDataSourceConfiguration.class)} and autowires the
 * counter.
 */
@TestConfiguration(proxyBeanMethods = false)
public class CountingDataSourceConfiguration {

  @Bean
  static StatementCounter statementCounter() {
    return new StatementCounter();
  }

  @Bean
  static BeanPostProcessor countingDataSource(StatementCounter counter) {
    return new BeanPostProcessor() {
      @Override
      public Object postProcessAfterInitialization(Object bean, String beanName) {
        return bean instanceof DataSource dataSource ? counter.wrap(dataSource) : bean;
      }
    };
  }
}
