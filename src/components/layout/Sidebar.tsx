import { NavLink } from 'react-router-dom';
import {
  Home,
  Pill,
  Calendar,
  Heart,
  FileText,
  Settings,
  Users,
  BarChart3,
  Inbox,
  History,
  Menu,
  X,
  Sparkles,
  FolderHeart,
  TrendingUp,
  ShieldCheck,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useState } from 'react';

interface MenuItem {
  icon: any;
  label: string;
  path: string;
  badge?: string;
  badgeColor?: 'purple' | 'green' | 'blue';
}

export default function Sidebar() {
  const { user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(true);

  const getMenuItems = (): MenuItem[] => {
    switch (user?.role) {
      case 'patient':
        return [
          { icon: Home, label: 'Dashboard', path: '/dashboard' },
          { icon: Pill, label: 'Medicines', path: '/medicines' },
          { icon: Calendar, label: 'Schedule', path: '/schedule' },
          { icon: Sparkles, label: 'AI Assistant', path: '/ai-assistant', badge: 'AI', badgeColor: 'purple' },
          { icon: FolderHeart, label: 'Health Records', path: '/health-records', badge: 'New', badgeColor: 'green' },
          { icon: TrendingUp, label: 'Analytics', path: '/analytics' },
          { icon: ShieldCheck, label: 'Drug Safety', path: '/drug-interactions' },
          { icon: Heart, label: 'Donations', path: '/donations' },
          { icon: FileText, label: 'Reports', path: '/reports' },
          { icon: Settings, label: 'Settings', path: '/settings' },
        ];
      case 'admin':
        return [
          { icon: Home, label: 'Dashboard', path: '/dashboard' },
          { icon: Users, label: 'Users', path: '/users' },
          { icon: BarChart3, label: 'Analytics', path: '/analytics' },
          { icon: Settings, label: 'System Settings', path: '/system' },
        ];
      case 'ngo':
      case 'hospital':
        return [
          { icon: Home, label: 'Dashboard', path: '/dashboard' },
          { icon: Inbox, label: 'Donation Requests', path: '/donation-requests' },
          { icon: History, label: 'History', path: '/donation-history' },
        ];
      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 transition-transform duration-300 fixed lg:sticky top-0 left-0 h-screen w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-40`}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <Heart className="w-8 h-8 text-primary-600" />
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                Mediloop
              </span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center justify-between px-4 py-3 rounded-lg transition-colors group ${
                    isActive
                      ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`
                }
              >
                <div className="flex items-center space-x-3">
                  <item.icon size={20} className="group-hover:scale-110 transition-transform" />
                  <span className="font-medium">{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    item.badgeColor === 'purple'
                      ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                      : item.badgeColor === 'green'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>

          {/* User Info */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
                {user?.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {user?.role}
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
        />
      )}
    </>
  );
}
