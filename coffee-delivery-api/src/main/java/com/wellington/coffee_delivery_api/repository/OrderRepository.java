package com.wellington.coffee_delivery_api.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.wellington.coffee_delivery_api.entity.Order;

import java.util.UUID;

public interface OrderRepository extends JpaRepository<Order, UUID> {
}
