
package com.financeflow.category.service;

import com.financeflow.category.dto.CategoryResponse;
import com.financeflow.category.dto.CreateCategoryRequest;
import com.financeflow.category.dto.UpdateCategoryRequest;
import com.financeflow.category.entity.Category;
import com.financeflow.category.entity.CategoryStatus;
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
                .orElseThrow(() ->
                        new IllegalArgumentException("User not found"));

        return categoryRepository.findByUserIdOrUserIdIsNull(userId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public CategoryResponse createCategory(
            UUID userId,
            CreateCategoryRequest request
    ) {
        var user = userRepository.findById(userId)
                .orElseThrow(() ->
                        new IllegalArgumentException("User not found"));

        String name = request.getName().trim();

        if (categoryRepository.existsByUserIdAndNameIgnoreCase(
                userId, name
        )) {
            throw new IllegalArgumentException(
                    "Category with this name already exists"
            );
        }

        Category category = new Category();

        category.setUser(user);
        category.setName(name);
        category.setCategoryType(request.getCategoryType());
        category.setStatus(CategoryStatus.ACTIVE);

        return toResponse(categoryRepository.save(category));
    }

    @Transactional
    public CategoryResponse updateCategory(
            UUID categoryId,
            UUID userId,
            UpdateCategoryRequest request
    ) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() ->
                        new IllegalArgumentException("Category not found"));

        validateOwnership(category, userId);

        String name = request.getName().trim();

        if (!category.getName().equalsIgnoreCase(name)
                && categoryRepository.existsByUserIdAndNameIgnoreCase(
                userId, name
        )) {
            throw new IllegalArgumentException(
                    "Category with this name already exists"
            );
        }

        category.setName(name);
        category.setCategoryType(request.getCategoryType());

        return toResponse(categoryRepository.save(category));
    }

    @Transactional
    public CategoryResponse archiveCategory(
            UUID categoryId,
            UUID userId
    ) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() ->
                        new IllegalArgumentException("Category not found"));

        validateOwnership(category, userId);

        if (category.getStatus() == CategoryStatus.ARCHIVED) {
            throw new IllegalArgumentException(
                    "Category is already archived"
            );
        }

        category.setStatus(CategoryStatus.ARCHIVED);

        return toResponse(categoryRepository.save(category));
    }

    private void validateOwnership(Category category, UUID userId) {

        if (category.getUser() == null) {
            throw new IllegalArgumentException(
                    "System categories cannot be modified"
            );
        }

        if (!category.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException(
                    "Category does not belong to this user"
            );
        }
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
}
