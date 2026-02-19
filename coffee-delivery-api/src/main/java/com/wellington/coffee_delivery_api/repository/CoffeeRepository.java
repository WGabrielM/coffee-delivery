package com.wellington.coffee_delivery_api.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.wellington.coffee_delivery_api.entity.Coffee;

import java.util.UUID;

public interface CoffeeRepository extends JpaRepository<Coffee, UUID> {
}
