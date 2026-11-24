
import api from "./api";

// Get categories belonging to the authenticated user
export async function getCategories() {
  const response = await api.get("/categories");

  return response.data;
}

// Create a category for the authenticated user
export async function createCategory(category) {
  const response = await api.post("/categories", category);

  return response.data;
}

// Update a category belonging to the authenticated user
export async function updateCategory(categoryId, category) {
  const response = await api.put(
    `/categories/${categoryId}`,
    category
  );

  return response.data;
}

// Archive a category belonging to the authenticated user
export async function archiveCategory(categoryId) {
  const response = await api.patch(
    `/categories/${categoryId}/archive`
  );

  return response.data;
}
