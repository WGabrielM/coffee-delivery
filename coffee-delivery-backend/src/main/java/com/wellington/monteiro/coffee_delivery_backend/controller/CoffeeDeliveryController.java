package com.wellington.monteiro.coffee_delivery_backend.controller;

import com.wellington.monteiro.coffee_delivery_backend.coffeedelivery.DataRegisterCoffeeDelivery;
import com.wellington.monteiro.coffee_delivery_backend.entity.CoffeeDelivery;
import com.wellington.monteiro.coffee_delivery_backend.repository.CoffeeDeliveryRepository;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("coffeedelivery")
public class CoffeeDeliveryController {

    @Autowired
    CoffeeDeliveryRepository repository;

    @PostMapping
    @Transactional
    public void register(@RequestBody @Valid DataRegisterCoffeeDelivery data) {
        repository.save(new CoffeeDelivery(data));
    }

}
