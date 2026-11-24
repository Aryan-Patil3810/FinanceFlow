
package com.financeflow.category.controller;

import com.financeflow.category.dto.CreateCategoryRequest;
import com.financeflow.category.dto.CategoryResponse;
import com.financeflow.category.dto.UpdateCategoryRequest;
import com.financeflow.category.service.CategoryService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
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
            @AuthenticationPrincipal Jwt jwt
    ) {
        UUID userId = UUID.fromString(jwt.getSubject());

        List<CategoryResponse> categories =
                categoryService.getCategories(userId);

        return ResponseEntity.ok(categories);
    }

    @PostMapping
    public ResponseEntity<CategoryResponse> createCategory(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody CreateCategoryRequest request
    ) {
        UUID userId = UUID.fromString(jwt.getSubject());

        CategoryResponse response =
                categoryService.createCategory(userId, request);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{categoryId}")
    public ResponseEntity<CategoryResponse> updateCategory(
            @PathVariable UUID categoryId,
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody UpdateCategoryRequest request
    ) {
        UUID userId = UUID.fromString(jwt.getSubject());

        CategoryResponse response =
                categoryService.updateCategory(
                        categoryId,
                        userId,
                        request
                );

        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{categoryId}/archive")
    public ResponseEntity<CategoryResponse> archiveCategory(
            @PathVariable UUID categoryId,
            @AuthenticationPrincipal Jwt jwt
    ) {
        UUID userId = UUID.fromString(jwt.getSubject());

        CategoryResponse response =
                categoryService.archiveCategory(categoryId, userId);

        return ResponseEntity.ok(response);
    }
}
