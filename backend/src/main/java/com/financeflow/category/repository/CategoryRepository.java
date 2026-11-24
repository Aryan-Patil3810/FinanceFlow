package com.financeflow.category.repository;

import com.financeflow.category.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CategoryRepository extends JpaRepository<Category, UUID> {

    List<Category> findByUserIdOrUserIdIsNull(UUID userId);
    boolean existsByUserIdAndNameIgnoreCase(UUID userId, String name);
}