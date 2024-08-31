package com.wellington.monteiro.coffee_delivery_backend.entity;

import com.wellington.monteiro.coffee_delivery_backend.enums.CoffeeType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "coffee_delivery")
@Entity(name = "CoffeeDelivery")
public class CoffeeDelivery {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private double price;
    private String image;
    private String description;

    @Enumerated(EnumType.STRING)
    private CoffeeType coffeeType;
}