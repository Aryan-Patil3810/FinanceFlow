
import { useEffect, useState, useCallback } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  CreditCard,
  AlertCircle,
  Info,
  RefreshCw,
  Inbox,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../services/notificationService";

function Notifications() {
  const { user } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadNotifications = useCallback(async () => {
    if (!user?.id) return;

    try {
      setError("");

      const [notificationData, unreadData] = await Promise.all([
        getNotifications(user.id),
        getUnreadNotificationCount(user.id),
      ]);

      setNotifications(notificationData);
      setUnreadCount(unreadData);
    } catch (err) {
      console.error("Failed to load notifications:", err);
      setError("Unable to load notifications. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId, user.id);
      await loadNotifications();
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
      setError("Unable to update notification.");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead(user.id);
      await loadNotifications();
    } catch (err) {
      console.error("Failed to mark all as read:", err);
      setError("Unable to mark notifications as read.");
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case "PAYMENT_DUE":
        return <CreditCard size={20} className="text-amber-600" />;

      case "PAYMENT_OVERDUE":
        return <AlertCircle size={20} className="text-red-600" />;

      case "PAYMENT_COMPLETED":
        return <Check size={20} className="text-emerald-600" />;

      default:
        return <Info size={20} className="text-blue-600" />;
    }
  };

  const formatDate = (date) => {
    if (!date) return "";

    return new Date(date).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const filteredNotifications =
    filter === "UNREAD"
      ? notifications.filter((item) => !item.isRead)
      : notifications;

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <RefreshCw size={17} className="animate-spin" />
          Loading notifications...
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">

      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <Bell size={23} className="text-slate-800" />
            <h1 className="text-2xl font-bold text-slate-900">
              Notifications
            </h1>
          </div>

          <p className="mt-1 text-sm text-slate-500">
            Stay updated with your financial activity and reminders.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={loadNotifications}
            className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            <RefreshCw size={15} />
            Refresh
          </button>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              <CheckCheck size={15} />
              Mark all as read
            </button>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">
            Total Notifications
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {notifications.length}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">
            Unread Notifications
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {unreadCount}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 border-b border-slate-200">
        {[
          { label: "All", value: "ALL" },
          { label: "Unread", value: "UNREAD" },
        ].map((item) => (
          <button
            key={item.value}
            onClick={() => setFilter(item.value)}
            className={`border-b-2 px-4 py-3 text-sm font-semibold transition ${
              filter === item.value
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-400 hover:text-slate-700"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Notification List */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">

        {filteredNotifications.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <Inbox size={38} className="mx-auto text-slate-300" />

            <h3 className="mt-4 text-sm font-bold text-slate-800">
              {filter === "UNREAD"
                ? "No unread notifications"
                : "No notifications yet"}
            </h3>

            <p className="mt-1 text-xs text-slate-400">
              You're all caught up!
            </p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`flex gap-4 border-b border-slate-100 p-4 transition last:border-0 hover:bg-slate-50 sm:p-5 ${
                !notification.isRead ? "bg-blue-50/30" : ""
              }`}
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                {getIcon(notification.notificationType)}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-800">
                    {notification.title}
                  </h3>

                  {!notification.isRead && (
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                      New
                    </span>
                  )}
                </div>

                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {notification.message}
                </p>

                <p className="mt-2 text-xs text-slate-400">
                  {formatDate(notification.createdAt)}
                </p>
              </div>

              {!notification.isRead && (
                <button
                  onClick={() => handleMarkAsRead(notification.id)}
                  title="Mark as read"
                  aria-label={`Mark ${notification.title} as read`}
                  className="h-fit rounded-lg p-2 text-slate-400 transition hover:bg-white hover:text-slate-900"
                >
                  <Check size={17} />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Notifications;
