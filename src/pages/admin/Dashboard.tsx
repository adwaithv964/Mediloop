import { useEffect, useState } from 'react';
import {
  Users,
  Pill,
  Heart,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3,
  Settings,
  Bell,
  Database,
  Shield,
  Activity,
  RefreshCw
} from 'lucide-react';
import { User, Medicine, Donation, AppNotification } from '../../types';
import { formatDate } from '../../utils/helpers';
import { API_URL } from '../../config/api';
import { useNavigate } from 'react-router-dom';

interface DashboardStats {
  totalUsers: number;
  totalMedicines: number;
  totalDonations: number;
  pendingDonations: number;
  completedDonations: number;
  activeUsers: number;
  systemHealth: 'good' | 'warning' | 'critical';
  recentActivity: number;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalMedicines: 0,
    totalDonations: 0,
    pendingDonations: 0,
    completedDonations: 0,
    activeUsers: 0,
    systemHealth: 'good',
    recentActivity: 0,
  });
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [recentDonations, setRecentDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all collections from MongoDB backend (source of truth for all users)
      const [usersRes, medicinesRes, donationsRes] = await Promise.all([
        fetch(`${API_URL}/api/sync/users`),
        fetch(`${API_URL}/api/sync/medicines`),
        fetch(`${API_URL}/api/sync/donations`),
      ]);

      const users: User[] = usersRes.ok ? await usersRes.json() : [];
      const medicines: Medicine[] = medicinesRes.ok ? await medicinesRes.json() : [];
      const donations: Donation[] = donationsRes.ok ? await donationsRes.json() : [];

      // Normalise date strings → Date objects
      const toDate = (v: any) => v ? new Date(v) : new Date(0);
      const normUsers = users.map(u => ({ ...u, createdAt: toDate(u.createdAt), updatedAt: toDate(u.updatedAt) }));
      const normDonations = donations.map(d => ({ ...d, createdAt: toDate(d.createdAt), updatedAt: toDate(d.updatedAt) }));

      // Calculate stats
      const totalUsers = normUsers.length;
      const totalMedicines = medicines.length;
      const totalDonations = normDonations.length;
      const pendingDonations = normDonations.filter(d => d.status === 'pending').length;
      const completedDonations = normDonations.filter(d => d.status === 'completed').length;

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const activeUsers = normUsers.filter(u => u.createdAt > sevenDaysAgo).length;

      let systemHealth: 'good' | 'warning' | 'critical' = 'good';
      if (pendingDonations > 50) systemHealth = 'warning';
      if (pendingDonations > 100) systemHealth = 'critical';
      // Only flag critical if truly 0 users AND backend is reachable (we got a response)
      if (totalUsers === 0 && usersRes.ok) systemHealth = 'warning';

      setStats({
        totalUsers,
        totalMedicines,
        totalDonations,
        pendingDonations,
        completedDonations,
        activeUsers,
        systemHealth,
        recentActivity: 0,
      });

      setRecentUsers(normUsers.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 5));
      setRecentDonations(normDonations.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 5));

    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to connect to the backend. Make sure the server is running.');
    } finally {
      setLoading(false);
    }
  };

  const getSystemHealthColor = (health: string) => {
    switch (health) {
      case 'good': return 'text-green-600 bg-green-100 dark:bg-green-900';
      case 'warning': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900';
      case 'critical': return 'text-red-600 bg-red-100 dark:bg-red-900';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900';
    }
  };

  const getSystemHealthIcon = (health: string) => {
    switch (health) {
      case 'good': return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'warning': return <AlertCircle className="w-6 h-6 text-yellow-600" />;
      case 'critical': return <AlertCircle className="w-6 h-6 text-red-600" />;
      default: return <Activity className="w-6 h-6 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <p className="text-red-600 dark:text-red-400 text-center max-w-md">{error}</p>
        <button onClick={loadDashboardData} className="btn btn-primary">
          <RefreshCw size={18} />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            System overview and management controls
          </p>
        </div>
        <button onClick={loadDashboardData} className="btn btn-secondary">
          <RefreshCw size={18} />
          <span>Refresh</span>
        </button>
      </div>

      {/* System Health Alert */}
      {stats.systemHealth !== 'good' && (
        <div className={`p-4 rounded-lg border-l-4 ${stats.systemHealth === 'critical'
            ? 'bg-red-50 dark:bg-red-900/20 border-red-500'
            : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500'
          }`}>
          <div className="flex items-center">
            {getSystemHealthIcon(stats.systemHealth)}
            <div className="ml-3">
              <h3 className={`text-sm font-medium ${stats.systemHealth === 'critical' ? 'text-red-800 dark:text-red-200' : 'text-yellow-800 dark:text-yellow-200'
                }`}>
                {stats.systemHealth === 'critical' ? 'System Critical' : 'System Warning'}
              </h3>
              <p className={`text-sm ${stats.systemHealth === 'critical' ? 'text-red-700 dark:text-red-300' : 'text-yellow-700 dark:text-yellow-300'
                }`}>
                {stats.systemHealth === 'critical'
                  ? 'High number of pending donations detected'
                  : stats.totalUsers === 0
                    ? 'No users have registered yet — data will appear once users sync'
                    : 'System performance requires attention'
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Users */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Users</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.totalUsers}
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                +{stats.activeUsers} active this week
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        {/* Total Medicines */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Medicines</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.totalMedicines}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Across all users
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
              <Pill className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        {/* Total Donations */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Donations</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.totalDonations}
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                {stats.completedDonations} completed
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
              <Heart className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>

        {/* System Health */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">System Health</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.systemHealth === 'good' ? 'Good' : stats.systemHealth === 'warning' ? 'Warning' : 'Critical'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {stats.recentActivity} activities today
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Pending Donations</p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">
                {stats.pendingDonations}
              </p>
            </div>
            <Clock className="w-8 h-8 text-orange-600 dark:text-orange-400" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Completed Donations</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                {stats.completedDonations}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Active Users</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                {stats.activeUsers}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Recent Users
            </h2>
            <button
              onClick={() => navigate('/users')}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              View All
            </button>
          </div>

          <div className="space-y-3">
            {recentUsers.length > 0 ? (
              recentUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {user.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {user.email} • {user.role}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(user.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                No users found — data appears once patients sync their accounts
              </p>
            )}
          </div>
        </div>

        {/* Recent Donations */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Recent Donations
            </h2>
            <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              View All
            </button>
          </div>

          <div className="space-y-3">
            {recentDonations.length > 0 ? (
              recentDonations.map((donation) => (
                <div
                  key={donation.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
                      <Heart className="w-5 h-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {donation.medicines.length} medicine(s)
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Status: {donation.status}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(donation.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                No donations found yet
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button className="btn btn-primary" onClick={() => navigate('/analytics')}>
            <BarChart3 size={18} />
            <span>View Analytics</span>
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/users')}>
            <Users size={18} />
            <span>Manage Users</span>
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/system')}>
            <Settings size={18} />
            <span>System Settings</span>
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/logs')}>
            <Database size={18} />
            <span>System Logs</span>
          </button>
        </div>
      </div>
    </div>
  );
}
