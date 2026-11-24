package com.financeflow.category.controller;

import com.financeflow.category.dto.UpdateCategoryRequest;
import com.financeflow.category.dto.CreateCategoryRequest;
import jakarta.validation.Valid;
import com.financeflow.category.dto.CategoryResponse;
import com.financeflow.category.service.CategoryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/categories")
public class CategoryController {

    private final CategoryService categoryService;

    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @GetMapping
    public ResponseEntity<List<CategoryResponse>> getCategories(
            @RequestParam UUID userId
    ) {
        List<CategoryResponse> categories =
                categoryService.getCategories(userId);

        return ResponseEntity.ok(categories);
    }
    @PostMapping
    public ResponseEntity<CategoryResponse> createCategory(
            @RequestParam UUID userId,
            @Valid @RequestBody CreateCategoryRequest request
    ) {
        CategoryResponse response =
                categoryService.createCategory(userId, request);

        return ResponseEntity.status(201).body(response);
    }

    @PutMapping("/{categoryId}")
    public ResponseEntity<CategoryResponse> updateCategory(
            @PathVariable UUID categoryId,
            @RequestParam UUID userId,
            @Valid @RequestBody UpdateCategoryRequest request
    ) {
        CategoryResponse response =
                categoryService.updateCategory(categoryId, userId, request);

        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{categoryId}/archive")
    public ResponseEntity<CategoryResponse> archiveCategory(
            @PathVariable UUID categoryId,
            @RequestParam UUID userId
    ) {
        CategoryResponse response =
                categoryService.archiveCategory(categoryId, userId);

        return ResponseEntity.ok(response);
    }
}