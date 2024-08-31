package com.wellington.monteiro.coffee_delivery_backend;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "coffeedelivery")
@Entity(name = "CoffeeDelivery")
public class CoffeeDelivery {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private double value;
    private String image;
    private String description;

    @Enumerated(EnumType.STRING)
    private CoffeeType coffeeType;
}
