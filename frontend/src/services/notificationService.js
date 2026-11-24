
import api from "./api";

export async function getNotifications(userId) {
  const response = await api.get("/notifications", {
    params: { userId },
  });
  return response.data;
}

export async function getUnreadNotificationCount(userId) {
  const response = await api.get("/notifications/unread-count", {
    params: { userId },
  });
  return response.data.unreadCount;
}

export async function markNotificationAsRead(notificationId, userId) {
  const response = await api.patch(
    `/notifications/${notificationId}/read`,
    null,
    { params: { userId } }
  );
  return response.data;
}

export async function markAllNotificationsAsRead(userId) {
  const response = await api.patch("/notifications/read-all", null, {
    params: { userId },
  });
  return response.data;
}
