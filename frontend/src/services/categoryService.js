import api from "./api";

export async function getCategories(userId) {
  const response = await api.get("/categories", {
    params: { userId },
  });

  return response.data;
}

export async function createCategory(userId, category) {
  const response = await api.post(
    "/categories",
    category,
    {
      params: { userId },
    }
  );

  return response.data;
}

export async function updateCategory(
  userId,
  categoryId,
  category
) {
  const response = await api.put(
    `/categories/${categoryId}`,
    category,
    {
      params: { userId },
    }
  );

  return response.data;
}

export async function archiveCategory(
  userId,
  categoryId
) {
  const response = await api.patch(
    `/categories/${categoryId}/archive`,
    null,
    {
      params: { userId },
    }
  );

  return response.data;
}