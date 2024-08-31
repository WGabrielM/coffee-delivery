package com.wellington.monteiro.coffee_delivery_backend.repository;

import com.wellington.monteiro.coffee_delivery_backend.entity.CoffeeDelivery;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CoffeeDeliveryRepository extends JpaRepository<CoffeeDelivery, Long> {
}
