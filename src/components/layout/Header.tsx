import { Bell, LogOut, Sun, Moon } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { db } from '../../db';
import { getGreeting } from '../../utils/helpers';
import NotificationPanel from '../NotificationPanel';
import { medicineAlarmService } from '../../services/medicineAlarmService';

export default function Header() {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (user) {
      loadUnreadCount();
      // Start medicine alarm monitoring
      medicineAlarmService.startMonitoring(user.id);
      // Request notification permission
      medicineAlarmService.requestPermission();
    }

    return () => {
      // Stop monitoring on unmount
      medicineAlarmService.stopMonitoring();
    };
  }, [user]);

  const loadUnreadCount = () => {
    if (user) {
      db.notifications
        .where('userId')
        .equals(user.id)
        .and((n) => !n.read)
        .count()
        .then(setUnreadCount);
    }
  };

  useEffect(() => {
    if (showNotifications) {
      loadUnreadCount();
    }
  }, [showNotifications]);

  const handleLogout = () => {
    medicineAlarmService.stopMonitoring();
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Mediloop
            </h1>
          </div>

          {/* User Info & Actions */}
          {user && (
            <div className="flex items-center space-x-4">
              {/* Greeting */}
              <div className="hidden md:block text-sm">
                <p className="text-gray-600 dark:text-gray-300">
                  {getGreeting()}, <span className="font-semibold">{user.name}</span>
                </p>
              </div>

              {/* Notifications */}
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors relative"
                title="Notifications"
              >
                <Bell size={20} className="text-gray-600 dark:text-gray-300" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {theme === 'dark' ? (
                  <Sun size={20} className="text-gray-300" />
                ) : (
                  <Moon size={20} className="text-gray-600" />
                )}
              </button>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Logout"
              >
                <LogOut size={20} className="text-gray-600 dark:text-gray-300" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Notification Panel */}
      {showNotifications && (
        <NotificationPanel onClose={() => setShowNotifications(false)} />
      )}
    </header>
  );
}
