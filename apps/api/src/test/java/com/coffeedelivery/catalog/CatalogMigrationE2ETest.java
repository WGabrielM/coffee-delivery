package com.coffeedelivery.catalog;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.coffeedelivery.e2e.PostgresContainerSupport;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;

/** The catalog migrations, checked with plain SQL against a real PostgreSQL. */
@Tag("e2e")
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class CatalogMigrationE2ETest extends PostgresContainerSupport {

  private static final List<String> TAGS =
      List.of("traditional", "special", "with-milk", "alcoholic", "iced");

  private static final List<String> TAG_NAMES =
      List.of("Traditional", "Special", "With milk", "Alcoholic", "Iced");

  /** Slug, name, description, and tag slugs, in catalog order (BUSINESS.md). */
  private record Expected(String slug, String name, String description, List<String> tags) {}

  private static final List<Expected> COFFEES =
      List.of(
          new Expected(
              "traditional-espresso",
              "Traditional Espresso",
              "The traditional coffee made with hot water and ground beans",
              List.of("traditional")),
          new Expected(
              "american-espresso",
              "American Espresso",
              "Diluted espresso, less intense than the traditional",
              List.of("traditional")),
          new Expected(
              "creamy-espresso",
              "Creamy Espresso",
              "Traditional espresso coffee with creamy foam",
              List.of("traditional")),
          new Expected(
              "iced-espresso",
              "Iced Espresso",
              "Drink prepared with espresso coffee and ice cubes",
              List.of("traditional", "iced")),
          new Expected(
              "coffee-with-milk",
              "Coffee with Milk",
              "Half and half of traditional espresso with steamed milk",
              List.of("traditional", "with-milk")),
          new Expected(
              "latte",
              "Latte",
              "A shot of espresso coffee with double the milk and creamy foam",
              List.of("traditional", "with-milk")),
          new Expected(
              "cappuccino",
              "Cappuccino",
              "Cinnamon drink made of equal parts coffee, milk and foam",
              List.of("traditional", "with-milk")),
          new Expected(
              "macchiato",
              "Macchiato",
              "Espresso coffee mixed with a little hot milk and foam",
              List.of("traditional", "with-milk")),
          new Expected(
              "mochaccino",
              "Mochaccino",
              "Espresso coffee with chocolate syrup, a little milk and foam",
              List.of("traditional", "with-milk")),
          new Expected(
              "hot-chocolate",
              "Hot Chocolate",
              "Drink made with chocolate dissolved in hot milk and coffee",
              List.of("special", "with-milk")),
          new Expected(
              "cuban",
              "Cuban",
              "Iced espresso drink with rum, cream and mint",
              List.of("special", "alcoholic", "iced")),
          new Expected(
              "hawaiian",
              "Hawaiian",
              "Sweet drink prepared with coffee and coconut milk",
              List.of("special")),
          new Expected(
              "arabic",
              "Arabic",
              "Drink prepared with Arabian coffee beans and spices",
              List.of("special")),
          new Expected(
              "irish",
              "Irish",
              "Coffee-based drink with Irish whiskey, sugar and whipped cream",
              List.of("special", "alcoholic")));

  @Autowired private JdbcTemplate jdbc;
  @Autowired private Flyway flyway;

  @Test
  void theThreeCatalogTablesExist() {
    List<String> tables =
        jdbc.queryForList(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'",
            String.class);

    assertThat(tables).contains("tags", "coffees", "coffee_tags");
  }

  @Test
  void fiveTagsInPositionOrder() {
    List<Map<String, Object>> rows =
        jdbc.queryForList("SELECT slug, name FROM tags ORDER BY position");

    assertThat(rows.stream().map(row -> row.get("slug")).toList()).isEqualTo(TAGS);
    assertThat(rows.stream().map(row -> row.get("name")).toList()).isEqualTo(TAG_NAMES);
  }

  @Test
  void fourteenCoffeesInPositionOrderAllAtNineNinety() {
    List<String> slugs =
        jdbc.queryForList("SELECT slug FROM coffees ORDER BY position", String.class);
    List<Integer> prices = jdbc.queryForList("SELECT price_in_cents FROM coffees", Integer.class);

    assertThat(slugs).isEqualTo(COFFEES.stream().map(Expected::slug).toList());
    assertThat(prices).hasSize(14).containsOnly(990);
  }

  @Test
  void namesAndDescriptionsAreTheEnglishCopy() {
    List<Map<String, Object>> rows =
        jdbc.queryForList("SELECT slug, name, description FROM coffees ORDER BY position");

    for (int index = 0; index < COFFEES.size(); index++) {
      Expected expected = COFFEES.get(index);
      Map<String, Object> row = rows.get(index);
      assertThat(row.get("slug")).isEqualTo(expected.slug());
      assertThat(row.get("name")).isEqualTo(expected.name());
      assertThat(row.get("description")).isEqualTo(expected.description());
      assertThat((String) row.get("description")).matches("[\\x20-\\x7E]+").doesNotContain("$");
    }
  }

  @Test
  void everyCoffeeHasTheTagsOfTheDesignInTagOrder() {
    for (Expected expected : COFFEES) {
      List<String> tags =
          jdbc.queryForList(
              """
              SELECT t.slug FROM coffee_tags ct
              JOIN coffees c ON c.id = ct.coffee_id
              JOIN tags t ON t.id = ct.tag_id
              WHERE c.slug = ? ORDER BY t.position
              """,
              String.class,
              expected.slug());

      assertThat(tags).as(expected.slug()).isEqualTo(expected.tags());
    }
  }

  @Test
  void tagCountsMatchTheFilterResultsOfTheDesign() {
    Map<String, Integer> counts = new java.util.HashMap<>();
    jdbc.query(
        """
        SELECT t.slug, count(*) AS total FROM coffee_tags ct
        JOIN tags t ON t.id = ct.tag_id GROUP BY t.slug
        """,
        rs -> {
          counts.put(rs.getString("slug"), rs.getInt("total"));
        });

    assertThat(counts)
        .containsEntry("traditional", 9)
        .containsEntry("special", 5)
        .containsEntry("with-milk", 6)
        .containsEntry("alcoholic", 2)
        .containsEntry("iced", 2);
    assertThat(coffeesWithTag("alcoholic")).containsExactly("cuban", "irish");
    assertThat(coffeesWithTag("iced")).containsExactly("iced-espresso", "cuban");
  }

  @Test
  void coffeeSlugAndPositionAreUniqueAndThePriceIsPositive() {
    assertThatThrownBy(() -> insertCoffee("latte", 99, 990))
        .isInstanceOf(DataIntegrityViolationException.class);
    assertThatThrownBy(() -> insertCoffee("new-coffee", 1, 990))
        .isInstanceOf(DataIntegrityViolationException.class);
    assertThatThrownBy(() -> insertCoffee("free-coffee", 98, 0))
        .isInstanceOf(DataIntegrityViolationException.class);
    assertThatThrownBy(() -> insertCoffee("negative-coffee", 97, -1))
        .isInstanceOf(DataIntegrityViolationException.class);
  }

  @Test
  void tagSlugIsUnique() {
    assertThatThrownBy(
            () ->
                jdbc.update(
                    "INSERT INTO tags (slug, name, position) VALUES ('special', 'Other', 99)"))
        .isInstanceOf(DataIntegrityViolationException.class);
  }

  @Test
  void coffeeTagsHaveACompositeKeyAndForeignKeys() {
    UUID coffeeId = jdbc.queryForObject("SELECT id FROM coffees WHERE slug = 'latte'", UUID.class);
    UUID tagId = jdbc.queryForObject("SELECT id FROM tags WHERE slug = 'traditional'", UUID.class);

    assertThatThrownBy(
            () ->
                jdbc.update(
                    "INSERT INTO coffee_tags (coffee_id, tag_id) VALUES (?, ?)", coffeeId, tagId))
        .isInstanceOf(DataIntegrityViolationException.class);
    assertThatThrownBy(
            () ->
                jdbc.update(
                    "INSERT INTO coffee_tags (coffee_id, tag_id) VALUES (?, ?)",
                    UUID.randomUUID(),
                    tagId))
        .isInstanceOf(DataIntegrityViolationException.class);
    assertThatThrownBy(
            () ->
                jdbc.update(
                    "INSERT INTO coffee_tags (coffee_id, tag_id) VALUES (?, ?)",
                    coffeeId,
                    UUID.randomUUID()))
        .isInstanceOf(DataIntegrityViolationException.class);
  }

  @Test
  void runningTheMigrationsAgainChangesNothing() {
    flyway.validate();

    assertThat(flyway.migrate().migrationsExecuted).isZero();
    assertThat(jdbc.queryForObject("SELECT count(*) FROM coffees", Integer.class)).isEqualTo(14);
    assertThat(jdbc.queryForObject("SELECT count(*) FROM tags", Integer.class)).isEqualTo(5);
  }

  private List<String> coffeesWithTag(String tagSlug) {
    return jdbc.queryForList(
        """
        SELECT c.slug FROM coffee_tags ct
        JOIN coffees c ON c.id = ct.coffee_id
        JOIN tags t ON t.id = ct.tag_id
        WHERE t.slug = ? ORDER BY c.position
        """,
        String.class,
        tagSlug);
  }

  private void insertCoffee(String slug, int position, int priceInCents) {
    jdbc.update(
        "INSERT INTO coffees (slug, name, description, price_in_cents, position) VALUES (?, 'Name', 'Description', ?, ?)",
        slug,
        priceInCents,
        position);
  }
}
