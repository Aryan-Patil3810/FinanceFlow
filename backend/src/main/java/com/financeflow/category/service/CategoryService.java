package com.financeflow.category.service;

import com.financeflow.category.dto.UpdateCategoryRequest;
import com.financeflow.category.dto.CreateCategoryRequest;
import com.financeflow.category.entity.CategoryStatus;
import com.financeflow.category.dto.CategoryResponse;
import com.financeflow.category.entity.Category;
import com.financeflow.category.repository.CategoryRepository;
import com.financeflow.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

    public CategoryService(
            CategoryRepository categoryRepository,
            UserRepository userRepository
    ) {
        this.categoryRepository = categoryRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> getCategories(UUID userId) {

        userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        return categoryRepository.findByUserIdOrUserIdIsNull(userId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private CategoryResponse toResponse(Category category) {

        boolean system = category.getUser() == null;

        return new CategoryResponse(
                category.getId(),
                category.getName(),
                category.getCategoryType(),
                category.getStatus(),
                system,
                category.getCreatedAt()
        );
    }

    @Transactional
    public CategoryResponse createCategory(
            UUID userId,
            CreateCategoryRequest request
    ) {

        // 1. Verify user exists
        var user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        // 2. Check duplicate custom category
        if (categoryRepository.existsByUserIdAndNameIgnoreCase(
                userId,
                request.getName()
        )) {
            throw new IllegalArgumentException(
                    "Category with this name already exists"
            );
        }

        // 3. Create category
        Category category = new Category();

        category.setUser(user);
        category.setName(request.getName().trim());
        category.setCategoryType(request.getCategoryType());
        category.setStatus(CategoryStatus.ACTIVE);

        // 4. Save
        Category savedCategory = categoryRepository.save(category);

        // 5. Convert Entity → DTO
        return toResponse(savedCategory);
    }

    @Transactional
    public CategoryResponse updateCategory(
            UUID categoryId,
            UUID userId,
            UpdateCategoryRequest request
    ) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new IllegalArgumentException("Category not found"));

        // System categories cannot be modified
        if (category.getUser() == null) {
            throw new IllegalArgumentException(
                    "System categories cannot be modified"
            );
        }

        // Ownership check
        if (!category.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException(
                    "Category does not belong to this user"
            );
        }

        // Duplicate name check
        if (!category.getName().equalsIgnoreCase(request.getName())
                && categoryRepository.existsByUserIdAndNameIgnoreCase(
                userId,
                request.getName()
        )) {

            throw new IllegalArgumentException(
                    "Category with this name already exists"
            );
        }

        category.setName(request.getName().trim());
        category.setCategoryType(request.getCategoryType());

        return toResponse(categoryRepository.save(category));
    }

    @Transactional
    public CategoryResponse archiveCategory(
            UUID categoryId,
            UUID userId
    ) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new IllegalArgumentException("Category not found"));

        if (category.getUser() == null) {
            throw new IllegalArgumentException(
                    "System categories cannot be archived"
            );
        }

        if (!category.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException(
                    "Category does not belong to this user"
            );
        }

        if (category.getStatus() == CategoryStatus.ARCHIVED) {
            throw new IllegalArgumentException(
                    "Category is already archived"
            );
        }

        category.setStatus(CategoryStatus.ARCHIVED);

        return toResponse(categoryRepository.save(category));
    }
}