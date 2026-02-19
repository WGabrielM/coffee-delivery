package com.wellington.coffee_delivery_api.config;

import com.wellington.coffee_delivery_api.entity.Coffee;
import com.wellington.coffee_delivery_api.repository.CoffeeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
@Profile("!test")
public class CoffeeDataLoader implements CommandLineRunner {

    private final CoffeeRepository coffeeRepository;

    @Override
    public void run(String... args) {
        if (coffeeRepository.count() > 0) {
            log.info("Coffee catalog already seeded, skipping.");
            return;
        }

        List<Coffee> coffees = List.of(
                Coffee.builder()
                        .name("Traditional Espresso")
                        .description("Traditional coffee made with hot water and ground beans")
                        .price(new BigDecimal("9.90"))
                        .imageUrl("/coffees/expresso.png")
                        .tags(List.of("traditional"))
                        .build(),
                Coffee.builder()
                        .name("Americano")
                        .description("Diluted espresso, less intense than the traditional one")
                        .price(new BigDecimal("9.90"))
                        .imageUrl("/coffees/americano.png")
                        .tags(List.of("traditional"))
                        .build(),
                Coffee.builder()
                        .name("Creamy Espresso")
                        .description("Traditional espresso with creamy foam")
                        .price(new BigDecimal("9.90"))
                        .imageUrl("/coffees/expresso-cremoso.png")
                        .tags(List.of("traditional"))
                        .build(),
                Coffee.builder()
                        .name("Iced Espresso")
                        .description("Drink made with espresso and ice cubes")
                        .price(new BigDecimal("9.90"))
                        .imageUrl("/coffees/cafe-gelado.png")
                        .tags(List.of("traditional", "iced"))
                        .build(),
                Coffee.builder()
                        .name("Coffee with Milk")
                        .description("Half and half of traditional espresso with steamed milk")
                        .price(new BigDecimal("9.90"))
                        .imageUrl("/coffees/cafe-com-leite.png")
                        .tags(List.of("traditional", "with milk"))
                        .build(),
                Coffee.builder()
                        .name("Latte")
                        .description("One shot of espresso with double milk and creamy foam")
                        .price(new BigDecimal("9.90"))
                        .imageUrl("/coffees/latte.png")
                        .tags(List.of("traditional", "with milk"))
                        .build(),
                Coffee.builder()
                        .name("Cappuccino")
                        .description("Cinnamon drink made with equal parts coffee, milk and foam")
                        .price(new BigDecimal("9.90"))
                        .imageUrl("/coffees/capuccino.png")
                        .tags(List.of("traditional", "with milk"))
                        .build(),
                Coffee.builder()
                        .name("Macchiato")
                        .description("Espresso mixed with a little hot milk and foam")
                        .price(new BigDecimal("9.90"))
                        .imageUrl("/coffees/macchiato.png")
                        .tags(List.of("traditional", "with milk"))
                        .build(),
                Coffee.builder()
                        .name("Mochaccino")
                        .description("Espresso with chocolate syrup, a little milk and foam")
                        .price(new BigDecimal("9.90"))
                        .imageUrl("/coffees/mocaccino.png")
                        .tags(List.of("traditional", "with milk"))
                        .build(),
                Coffee.builder()
                        .name("Hot Chocolate")
                        .description("Drink made with chocolate dissolved in hot milk and coffee")
                        .price(new BigDecimal("9.90"))
                        .imageUrl("/coffees/chocolate-quente.png")
                        .tags(List.of("special", "with milk"))
                        .build(),
                Coffee.builder()
                        .name("Cuban")
                        .description("Iced drink made with espresso, rum, cream and mint")
                        .price(new BigDecimal("9.90"))
                        .imageUrl("/coffees/cubano.png")
                        .tags(List.of("special", "alcoholic", "iced"))
                        .build(),
                Coffee.builder()
                        .name("Hawaiian")
                        .description("Sweet drink made with coffee and coconut milk")
                        .price(new BigDecimal("9.90"))
                        .imageUrl("/coffees/havaiano.png")
                        .tags(List.of("special"))
                        .build(),
                Coffee.builder()
                        .name("Arabic")
                        .description("Drink made with Arabic coffee beans and spices")
                        .price(new BigDecimal("9.90"))
                        .imageUrl("/coffees/arabe.png")
                        .tags(List.of("special"))
                        .build(),
                Coffee.builder()
                        .name("Irish")
                        .description("Drink based on coffee, Irish whiskey, sugar and whipped cream")
                        .price(new BigDecimal("9.90"))
                        .imageUrl("/coffees/irlandes.png")
                        .tags(List.of("special", "alcoholic"))
                        .build()
        );

        coffeeRepository.saveAll(coffees);
        log.info("Seeded {} coffees into catalog.", coffees.size());
    }
}
