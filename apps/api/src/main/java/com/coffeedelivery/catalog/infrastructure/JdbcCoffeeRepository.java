package com.coffeedelivery.catalog.infrastructure;

import com.coffeedelivery.catalog.application.CoffeeRepository;
import com.coffeedelivery.catalog.domain.Coffee;
import com.coffeedelivery.catalog.domain.Tag;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

/** Reads the catalog tables with two queries: the coffees, then the tags of those coffees. */
@Repository
class JdbcCoffeeRepository implements CoffeeRepository {

  private record CoffeeRow(
      UUID id, String slug, String name, String description, int priceInCents) {}

  private record TagRow(UUID coffeeId, Tag tag) {}

  private final JdbcClient jdbc;

  JdbcCoffeeRepository(JdbcClient jdbc) {
    this.jdbc = jdbc;
  }

  @Override
  public List<Coffee> findAll() {
    List<CoffeeRow> rows =
        jdbc.sql(
                """
                SELECT id, slug, name, description, price_in_cents
                FROM coffees
                ORDER BY position
                """)
            .query(
                (rs, rowNumber) ->
                    new CoffeeRow(
                        rs.getObject("id", UUID.class),
                        rs.getString("slug"),
                        rs.getString("name"),
                        rs.getString("description"),
                        rs.getInt("price_in_cents")))
            .list();
    return withTags(rows);
  }

  private List<Coffee> withTags(List<CoffeeRow> rows) {
    if (rows.isEmpty()) {
      return List.of();
    }
    Map<UUID, List<Tag>> tagsByCoffee = new HashMap<>();
    for (TagRow row : findTags(rows.stream().map(CoffeeRow::id).toList())) {
      tagsByCoffee.computeIfAbsent(row.coffeeId(), id -> new ArrayList<>()).add(row.tag());
    }
    return rows.stream()
        .map(
            row ->
                new Coffee(
                    row.id(),
                    row.slug(),
                    row.name(),
                    row.description(),
                    row.priceInCents(),
                    tagsByCoffee.getOrDefault(row.id(), List.of())))
        .toList();
  }

  private List<TagRow> findTags(List<UUID> coffeeIds) {
    return jdbc.sql(
            """
            SELECT ct.coffee_id, t.slug, t.name
            FROM coffee_tags ct
            JOIN tags t ON t.id = ct.tag_id
            WHERE ct.coffee_id IN (:coffeeIds)
            ORDER BY t.position
            """)
        .param("coffeeIds", coffeeIds)
        .query(
            (rs, rowNumber) ->
                new TagRow(
                    rs.getObject("coffee_id", UUID.class),
                    new Tag(rs.getString("slug"), rs.getString("name"))))
        .list();
  }
}
