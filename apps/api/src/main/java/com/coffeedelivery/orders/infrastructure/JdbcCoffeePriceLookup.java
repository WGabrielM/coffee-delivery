package com.coffeedelivery.orders.infrastructure;

import com.coffeedelivery.orders.application.CoffeePrice;
import com.coffeedelivery.orders.application.CoffeePriceLookup;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

/** Reads coffee names and prices straight from the coffees table, with its own SQL. */
@Repository
class JdbcCoffeePriceLookup implements CoffeePriceLookup {

  private final JdbcClient jdbc;

  JdbcCoffeePriceLookup(JdbcClient jdbc) {
    this.jdbc = jdbc;
  }

  @Override
  public Map<UUID, CoffeePrice> findByIds(Collection<UUID> ids) {
    if (ids.isEmpty()) {
      return Map.of();
    }
    List<CoffeePrice> coffees =
        jdbc.sql("SELECT id, name, price_in_cents FROM coffees WHERE id IN (:ids)")
            .param("ids", ids)
            .query(
                (rs, rowNumber) ->
                    new CoffeePrice(
                        rs.getObject("id", UUID.class),
                        rs.getString("name"),
                        rs.getInt("price_in_cents")))
            .list();
    return coffees.stream().collect(Collectors.toMap(CoffeePrice::id, Function.identity()));
  }
}
