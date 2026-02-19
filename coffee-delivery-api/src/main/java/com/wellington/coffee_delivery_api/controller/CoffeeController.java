package com.wellington.coffee_delivery_api.controller;

import com.wellington.coffee_delivery_api.entity.Coffee;
import com.wellington.coffee_delivery_api.repository.CoffeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/coffees")
@RequiredArgsConstructor
public class CoffeeController {

    private final CoffeeRepository coffeeRepository;

    @GetMapping
    public ResponseEntity<List<Coffee>> list() {
        return ResponseEntity.ok(coffeeRepository.findAll());
    }
}
