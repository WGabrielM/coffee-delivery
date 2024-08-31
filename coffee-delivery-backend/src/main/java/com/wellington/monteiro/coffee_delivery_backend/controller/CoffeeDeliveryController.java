package com.wellington.monteiro.coffee_delivery_backend.controller;

import jakarta.transaction.Transactional;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("coffeedelivery")
public class CoffeeDeliveryController {

    @PostMapping
    @Transactional
    public void register() {

    }

}
