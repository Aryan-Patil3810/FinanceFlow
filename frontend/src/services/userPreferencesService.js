
import api from "./api";

export async function getUserPreferences(userId) {
  const response = await api.get("/settings/preferences", {
    params: { userId },
  });
  return response.data;
}

export async function updateUserPreferences(userId, preferences) {
  const response = await api.put(
    "/settings/preferences",
    preferences,
    { params: { userId } }
  );
  return response.data;
}
