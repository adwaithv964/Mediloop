import { useEffect, useState } from 'react';
import { 
  Building2, 
  Package, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp,
  Users,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Filter,
  RefreshCw,
  Eye,
  MessageCircle,
  Download,
  BarChart3,
  Activity,
  Heart,
  Pill,
  Stethoscope,
  Bed,
  Shield
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { db } from '../../db';
import { Donation, User } from '../../types';
import { formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';

interface HospitalDashboardStats {
  totalDonations: number;
  pendingDonations: number;
  completedDonations: number;
  totalMedicines: number;
  activeDonors: number;
  thisMonthDonations: number;
  departments: number;
  beds: number;
}

export default function HospitalDashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<HospitalDashboardStats>({
    totalDonations: 0,
    pendingDonations: 0,
    completedDonations: 0,
    totalMedicines: 0,
    activeDonors: 0,
    thisMonthDonations: 0,
    departments: 8,
    beds: 150,
  });
  const [recentDonations, setRecentDonations] = useState<Donation[]>([]);
  const [urgentDonations, setUrgentDonations] = useState<Donation[]>([]);
  const [departmentStats, setDepartmentStats] = useState<{ department: string; donations: number; medicines: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      const donations = await db.donations.where('hospitalId').equals(user?.id || '').toArray();
      const allDonations = await db.donations.toArray();
      const users = await db.users.toArray();

      const totalDonations = donations.length;
      const pendingDonations = donations.filter(d => d.status === 'pending').length;
      const completedDonations = donations.filter(d => d.status === 'completed').length;
      
      const totalMedicines = donations.reduce((sum, d) => sum + d.medicines.length, 0);
      
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const activeDonors = new Set(
        donations
          .filter(d => d.createdAt > thirtyDaysAgo)
          .map(d => d.userId)
      ).size;

      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);
      const thisMonthDonations = donations.filter(d => d.createdAt >= thisMonth).length;

      setStats({
        totalDonations,
        pendingDonations,
        completedDonations,
        totalMedicines,
        activeDonors,
        thisMonthDonations,
        departments: 8,
        beds: 150,
      });

      setRecentDonations(donations.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 5));
      
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      const urgent = donations.filter(d => 
        d.status === 'pending' && d.createdAt < threeDaysAgo
      ).slice(0, 5);
      setUrgentDonations(urgent);

      // Department stats (simulated)
      const departments = [
        { department: 'Emergency', donations: 12, medicines: 45 },
        { department: 'Cardiology', donations: 8, medicines: 32 },
        { department: 'Oncology', donations: 15, medicines: 67 },
        { department: 'Pediatrics', donations: 6, medicines: 28 },
        { department: 'Surgery', donations: 10, medicines: 41 },
        { department: 'ICU', donations: 7, medicines: 35 },
        { department: 'Pharmacy', donations: 20, medicines: 89 },
        { department: 'General Ward', donations: 14, medicines: 56 },
      ];
      setDepartmentStats(departments);

    } catch (error) {
      console.error('Error loading hospital dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (donationId: string, newStatus: string) => {
    try {
      await db.donations.update(donationId, { status: newStatus });
      toast.success('Donation status updated successfully');
      loadDashboardData();
    } catch (error) {
      console.error('Error updating donation status:', error);
      toast.error('Failed to update donation status');
    }
  };

  const exportData = () => {
    const data = recentDonations.map(donation => ({
      'Donation ID': donation.id,
      'Donor': donation.userId,
      'Medicines': donation.medicines.map(m => m.name).join(', '),
      'Status': donation.status,
      'Date': formatDate(donation.createdAt),
      'Notes': donation.notes || '',
    }));

    const csv = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hospital-donations-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Data exported successfully');
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-lg h-32"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Hospital Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Welcome back, {user?.name}. Manage donations and track hospital operations.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={loadDashboardData}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw size={20} />
            <span>Refresh</span>
          </button>
          <button
            onClick={exportData}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download size={20} />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Donations</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalDonations}</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
              <Heart className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-green-600 dark:text-green-400">+{stats.thisMonthDonations} this month</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Requests</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.pendingDonations}</p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-full">
              <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <AlertCircle className="h-4 w-4 text-yellow-500 mr-1" />
            <span className="text-yellow-600 dark:text-yellow-400">Requires attention</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Medicines Received</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalMedicines}</p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
              <Pill className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-green-600 dark:text-green-400">Ready for distribution</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Donors</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.activeDonors}</p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
              <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <Activity className="h-4 w-4 text-purple-500 mr-1" />
            <span className="text-purple-600 dark:text-purple-400">Last 30 days</span>
          </div>
        </div>
      </div>

      {/* Hospital Info */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Hospital Information</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Bed className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Beds</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{stats.beds}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <Stethoscope className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Departments</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{stats.departments}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Accreditation</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">JCI Certified</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Donations */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Donations</h2>
              <button className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium">
                View All
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentDonations.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No recent donations</p>
                </div>
              ) : (
                recentDonations.map((donation) => (
                  <div key={donation.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                        <Heart className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {donation.medicines.length} medicines
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {formatDate(donation.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        donation.status === 'completed' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : donation.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                      }`}>
                        {donation.status}
                      </span>
                      <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded">
                        <Eye className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Urgent Donations */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Urgent Requests</h2>
              <span className="px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 text-xs font-medium rounded-full">
                {urgentDonations.length} urgent
              </span>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {urgentDonations.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No urgent requests</p>
                </div>
              ) : (
                urgentDonations.map((donation) => (
                  <div key={donation.id} className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                        <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {donation.medicines.length} medicines
                        </p>
                        <p className="text-sm text-red-600 dark:text-red-400">
                          Overdue by {Math.ceil((Date.now() - donation.createdAt.getTime()) / (1000 * 60 * 60 * 24))} days
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleStatusUpdate(donation.id, 'completed')}
                        className="px-3 py-1 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700 transition-colors"
                      >
                        Complete
                      </button>
                      <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded">
                        <Eye className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Department Statistics */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Department Statistics</h2>
            <button className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium">
              <BarChart3 className="h-4 w-4" />
              <span>View Analytics</span>
            </button>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {departmentStats.map((dept, index) => (
              <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900 dark:text-white">{dept.department}</h3>
                  <Stethoscope className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Donations:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{dept.donations}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Medicines:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{dept.medicines}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center space-x-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
            <Heart className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <div className="text-left">
              <p className="font-medium text-gray-900 dark:text-white">Manage Donations</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">View and process donation requests</p>
            </div>
          </button>
          <button className="flex items-center space-x-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
            <BarChart3 className="h-6 w-6 text-green-600 dark:text-green-400" />
            <div className="text-left">
              <p className="font-medium text-gray-900 dark:text-white">View Analytics</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Track donation trends and statistics</p>
            </div>
          </button>
          <button className="flex items-center space-x-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors">
            <MessageCircle className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            <div className="text-left">
              <p className="font-medium text-gray-900 dark:text-white">Communicate</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Contact donors and coordinate</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
