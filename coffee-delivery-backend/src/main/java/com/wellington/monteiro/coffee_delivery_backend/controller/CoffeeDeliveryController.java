package com.wellington.monteiro.coffee_delivery_backend.controller;

import com.wellington.monteiro.coffee_delivery_backend.coffeedelivery.DataCoffeeDelivery;
import com.wellington.monteiro.coffee_delivery_backend.coffeedelivery.DataUpdateCoffeeDelivery;
import com.wellington.monteiro.coffee_delivery_backend.entity.CoffeeDelivery;
import com.wellington.monteiro.coffee_delivery_backend.repository.CoffeeDeliveryRepository;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.DataBinder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("coffeedelivery")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class CoffeeDeliveryController {

    @Autowired
    CoffeeDeliveryRepository repository;

    @PostMapping
    @Transactional
    public void register(@RequestBody @Valid DataCoffeeDelivery data) {
        repository.save(new CoffeeDelivery(data));
    }

    @GetMapping
    public List<DataCoffeeDelivery> list() {
        return repository.findAll().stream().map(DataCoffeeDelivery::new).toList();
    }

    @PutMapping
    @Transactional
    public void update(@RequestBody @Valid DataUpdateCoffeeDelivery data) {
        var coffee = repository.getReferenceById(data.id());
        coffee.updateInfo(data);
    }

}
