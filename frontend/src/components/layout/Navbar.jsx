
import {
  Menu,
  Search,
  Bell,
  ChevronDown,
  Check,
  CheckCheck,
  CreditCard,
  AlertCircle,
  Info,
  X,
} from "lucide-react";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../../services/notificationService";

function Navbar({ onMenuClick }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const loadNotifications = async () => {
    if (!user?.id) return;

    try {
      const [notificationData, unreadData] = await Promise.all([
        getNotifications(user.id),
        getUnreadNotificationCount(user.id),
      ]);

      setNotifications(notificationData);
      setUnreadCount(unreadData);
    } catch (error) {
      console.error("Failed to load notifications:", error);
    }
  };

  // Load notifications and refresh periodically
  useEffect(() => {
    if (!user?.id) return;

    loadNotifications();

    const interval = setInterval(() => {
      loadNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, [user?.id]);

  const handleNotificationToggle = async () => {
    const nextState = !notificationOpen;
    setNotificationOpen(nextState);
    setProfileOpen(false);

    if (nextState) {
      setLoadingNotifications(true);
      await loadNotifications();
      setLoadingNotifications(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId, user.id);
      await loadNotifications();
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead(user.id);
      await loadNotifications();
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  const handleLogout = () => {
    logout();
    setProfileOpen(false);
    navigate("/login", { replace: true });
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "PAYMENT_DUE":
        return <CreditCard size={17} className="text-amber-600" />;

      case "PAYMENT_OVERDUE":
        return <AlertCircle size={17} className="text-red-600" />;

      case "PAYMENT_COMPLETED":
        return <Check size={17} className="text-emerald-600" />;

      default:
        return <Info size={17} className="text-blue-600" />;
    }
  };

  const formatNotificationDate = (date) => {
    if (!date) return "";

    return new Date(date).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const latestNotifications = notifications.slice(0, 5);

  return (
    <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-xl sm:px-6 lg:px-8">

      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
        >
          <Menu size={21} />
        </button>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            Workspace
          </p>

          <p className="mt-0.5 text-sm font-semibold text-slate-800">
            Personal Finance
          </p>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 sm:gap-3">

        {/* Search */}
        <button className="hidden h-10 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-xs text-slate-400 hover:bg-white md:flex">
          <Search size={16} />
          Search anything
          <span className="ml-5 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[9px]">
            ⌘ K
          </span>
        </button>

        {/* Notification */}
        <div className="relative">
          <button
            onClick={handleNotificationToggle}
            aria-label="Notifications"
            aria-expanded={notificationOpen}
            className="relative rounded-xl p-2.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            <Bell size={18} />

            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {notificationOpen && (
            <div className="absolute right-0 top-full z-50 mt-3 w-[340px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl sm:w-[390px]">

              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Notifications
                  </h3>

                  <p className="mt-0.5 text-xs text-slate-400">
                    {unreadCount} unread notifications
                  </p>
                </div>

                <button
                  onClick={() => setNotificationOpen(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
                  aria-label="Close notifications"
                >
                  <X size={17} />
                </button>
              </div>

              {/* Mark all as read */}
              {unreadCount > 0 && (
                <div className="flex justify-end border-b border-slate-100 px-4 py-2">
                  <button
                    onClick={handleMarkAllAsRead}
                    className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
                  >
                    <CheckCheck size={14} />
                    Mark all as read
                  </button>
                </div>
              )}

              {/* Notification List */}
              <div className="max-h-[380px] overflow-y-auto">

                {loadingNotifications ? (
                  <div className="px-4 py-10 text-center text-sm text-slate-400">
                    Loading notifications...
                  </div>
                ) : latestNotifications.length === 0 ? (
                  <div className="px-4 py-10 text-center">
                    <Bell
                      size={28}
                      className="mx-auto mb-3 text-slate-300"
                    />

                    <p className="text-sm font-semibold text-slate-700">
                      You're all caught up!
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      No notifications yet.
                    </p>
                  </div>
                ) : (
                  latestNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`flex gap-3 border-b border-slate-100 px-4 py-3 transition hover:bg-slate-50 ${
                        !notification.isRead ? "bg-blue-50/40" : ""
                      }`}
                    >
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                        {getNotificationIcon(
                          notification.notificationType
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-bold text-slate-800">
                            {notification.title}
                          </p>

                          {!notification.isRead && (
                            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                          )}
                        </div>

                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          {notification.message}
                        </p>

                        <div className="mt-2 flex items-center justify-between gap-2">
                          <span className="text-[10px] text-slate-400">
                            {formatNotificationDate(
                              notification.createdAt
                            )}
                          </span>

                          {!notification.isRead && (
                            <button
                              onClick={() =>
                                handleMarkAsRead(notification.id)
                              }
                              className="text-[10px] font-semibold text-blue-600 hover:text-blue-800"
                            >
                              Mark as read
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-slate-100 px-4 py-3">
                <button
                  onClick={() => {
                    setNotificationOpen(false);
                    navigate("/notifications");
                  }}
                  className="w-full text-center text-xs font-semibold text-slate-700 transition hover:text-slate-950"
                >
                  View all notifications →
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="h-7 w-px bg-slate-200" />

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setProfileOpen(!profileOpen);
              setNotificationOpen(false);
            }}
            className="flex items-center gap-2 rounded-xl p-1.5 transition hover:bg-slate-100"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
              {user?.firstName?.charAt(0)?.toUpperCase() || "U"}
            </div>

            <div className="hidden text-left sm:block">
              <p className="text-xs font-semibold text-slate-800">
                {user?.firstName || "User"}
              </p>

              <p className="text-[10px] text-slate-400">
                Personal
              </p>
            </div>

            <ChevronDown
              size={14}
              className={`hidden text-slate-400 transition-transform sm:block ${
                profileOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Dropdown */}
          {profileOpen && (
            <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
              <div className="border-b border-slate-100 px-3 py-2">
                <p className="text-sm font-semibold text-slate-800">
                  {user?.firstName} {user?.lastName}
                </p>

                <p className="truncate text-xs text-slate-500">
                  {user?.email}
                </p>
              </div>

              <button
                onClick={handleLogout}
                className="mt-1 flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
