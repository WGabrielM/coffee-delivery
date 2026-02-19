package com.wellington.coffee_delivery_api.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.wellington.coffee_delivery_api.entity.Cart;

import java.util.UUID;

public interface CartRepository extends JpaRepository<Cart, UUID> {
}
