package com.coffeedelivery.catalog.infrastructure;

import com.coffeedelivery.catalog.application.CoffeeRepository;
import com.coffeedelivery.catalog.domain.Coffee;
import com.coffeedelivery.catalog.domain.Tag;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

/**
 * Reads the catalog tables with two queries: the coffees (all of them, or those that have every
 * required tag), then the tags of those coffees. The read is one read-only transaction, so the two
 * queries share one connection (and one snapshot of the data).
 */
@Repository
@Transactional(readOnly = true)
class JdbcCoffeeRepository implements CoffeeRepository {

  private record CoffeeRow(
      UUID id, String slug, String name, String description, int priceInCents) {}

  private record TagRow(UUID coffeeId, Tag tag) {}

  private final JdbcClient jdbc;

  JdbcCoffeeRepository(JdbcClient jdbc) {
    this.jdbc = jdbc;
  }

  private static final String ALL_COFFEES =
      """
      SELECT id, slug, name, description, price_in_cents
      FROM coffees
      ORDER BY position
      """;

  /** Tags are distinct per coffee (composite key) and slugs are unique, so count(*) is exact. */
  private static final String COFFEES_WITH_ALL_TAGS =
      """
      SELECT c.id, c.slug, c.name, c.description, c.price_in_cents
      FROM coffees c
      WHERE c.id IN (
        SELECT ct.coffee_id
        FROM coffee_tags ct
        JOIN tags t ON t.id = ct.tag_id
        WHERE t.slug IN (:slugs)
        GROUP BY ct.coffee_id
        HAVING count(*) = :tagCount
      )
      ORDER BY c.position
      """;

  @Override
  public List<Coffee> findAll(Set<String> requiredTagSlugs) {
    JdbcClient.StatementSpec statement =
        requiredTagSlugs.isEmpty()
            ? jdbc.sql(ALL_COFFEES)
            : jdbc.sql(COFFEES_WITH_ALL_TAGS)
                .param("slugs", requiredTagSlugs)
                .param("tagCount", requiredTagSlugs.size());
    List<CoffeeRow> rows =
        statement
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

  @Override
  public List<String> findTagSlugs() {
    return jdbc.sql("SELECT slug FROM tags ORDER BY position").query(String.class).list();
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
