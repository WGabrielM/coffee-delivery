package com.wellington.monteiro.coffee_delivery_backend.entity;

import com.wellington.monteiro.coffee_delivery_backend.coffeedelivery.DataCoffeeDelivery;
import com.wellington.monteiro.coffee_delivery_backend.coffeedelivery.DataUpdateCoffeeDelivery;
import com.wellington.monteiro.coffee_delivery_backend.enums.CoffeeType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import static com.wellington.monteiro.coffee_delivery_backend.enums.CoffeeType.*;

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
    private String description;

    @Column(name = "coffeetype")
    @Enumerated(EnumType.STRING)
    private CoffeeType coffeeType;

    public CoffeeDelivery(DataCoffeeDelivery data) {
        this.name = data.name();
        this.price = data.price();
        this.description = data.description();
        this.coffeeType = data.coffeeType();
    }

    public void updateInfo(DataUpdateCoffeeDelivery data) {
        if(data.name() != null) {
            this.name = data.name();
        }
        if(data.price() != 0) {
            this.price = data.price();
        }
        if(data.description() != null) {
            this.description = data.description();
        }
        if(data.coffeeType() == ICE || data.coffeeType() == ESPECIAL || data.coffeeType() == WITH_MILK || data.coffeeType() == ALCOHOLIC || data.coffeeType() == TRADITIONAL ){
            this.coffeeType = data.coffeeType();
        }
    }
}
