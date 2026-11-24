package com.financeflow.category.dto;

import com.financeflow.category.entity.CategoryStatus;
import com.financeflow.category.entity.CategoryType;

import java.time.Instant;
import java.util.UUID;

public class CategoryResponse {

    private UUID id;
    private String name;
    private CategoryType categoryType;
    private CategoryStatus status;
    private boolean system;
    private Instant createdAt;

    public CategoryResponse(
            UUID id,
            String name,
            CategoryType categoryType,
            CategoryStatus status,
            boolean system,
            Instant createdAt
    ) {
        this.id = id;
        this.name = name;
        this.categoryType = categoryType;
        this.status = status;
        this.system = system;
        this.createdAt = createdAt;
    }

    public UUID getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public CategoryType getCategoryType() {
        return categoryType;
    }

    public CategoryStatus getStatus() {
        return status;
    }

    public boolean isSystem() {
        return system;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}