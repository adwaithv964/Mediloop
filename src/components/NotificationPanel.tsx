import { useState, useEffect } from 'react';
import { X, CheckCheck, Trash2, Bell, AlertCircle, Heart, Package, Trash } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { db } from '../db';
import { AppNotification } from '../types';
import { formatDate } from '../utils/helpers';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface NotificationPanelProps {
  onClose: () => void;
}

export default function NotificationPanel({ onClose }: NotificationPanelProps) {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    loadNotifications();
  }, [user, filter]);

  const loadNotifications = async () => {
    if (!user) return;

    let query = db.notifications.where('userId').equals(user.id);
    
    if (filter === 'unread') {
      const allNotifications = await query.toArray();
      setNotifications(allNotifications.filter(n => !n.read));
    } else {
      const allNotifications = await query.reverse().sortBy('createdAt');
      setNotifications(allNotifications);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await db.notifications.update(notificationId, { read: true });
      loadNotifications();
    } catch (error) {
      toast.error('Failed to mark as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      for (const notification of unreadNotifications) {
        await db.notifications.update(notification.id, { read: true });
      }
      loadNotifications();
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await db.notifications.delete(notificationId);
      loadNotifications();
      toast.success('Notification deleted');
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  };

  const clearAllNotifications = async () => {
    if (!user) return;
    
    if (notifications.length === 0) {
      toast.error('No notifications to clear');
      return;
    }

    if (confirm(`Are you sure you want to delete all ${notifications.length} notification${notifications.length !== 1 ? 's' : ''}?`)) {
      try {
        for (const notification of notifications) {
          await db.notifications.delete(notification.id);
        }
        loadNotifications();
        toast.success('All notifications cleared');
      } catch (error) {
        toast.error('Failed to clear notifications');
      }
    }
  };

  const handleNotificationClick = (notification: AppNotification) => {
    markAsRead(notification.id);
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
      onClose();
    }
  };

  const getNotificationIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'reminder':
        return <Bell className="text-blue-500" size={20} />;
      case 'expiry_warning':
        return <AlertCircle className="text-yellow-500" size={20} />;
      case 'refill_alert':
        return <Package className="text-orange-500" size={20} />;
      case 'donation_update':
        return <Heart className="text-red-500" size={20} />;
      case 'system':
        return <Bell className="text-gray-500" size={20} />;
      default:
        return <Bell className="text-gray-500" size={20} />;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
      <div className="bg-white dark:bg-gray-800 w-full max-w-md h-full shadow-2xl flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Notifications
              </h2>
              {unreadCount > 0 && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                filter === 'unread'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* Action Buttons */}
          <div className="mt-3 space-y-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="w-full py-2 text-sm text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <CheckCheck size={16} />
                <span>Mark all as read</span>
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={clearAllNotifications}
                className="w-full py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <Trash size={16} />
                <span>Clear all notifications</span>
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 rounded-lg border transition-all cursor-pointer ${
                  notification.read
                    ? 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                    : 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800'
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {notification.title}
                      </h3>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                      >
                        <Trash2 size={14} className="text-gray-500" />
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {notification.message}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        {formatDate(notification.createdAt)}
                      </p>
                      {!notification.read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                          className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <Bell size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                No notifications
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {filter === 'unread' 
                  ? "You're all caught up!"
                  : "You'll see notifications here"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
