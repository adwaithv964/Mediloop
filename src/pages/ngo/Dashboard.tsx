import { useEffect, useState } from 'react';
import {
  Heart,
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
  RefreshCw,
  Eye,
  MessageCircle,
  Download,
  BarChart3
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { db } from '../../db';
import { Donation } from '../../types';
import { formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';

interface NGODashboardStats {
  totalDonations: number;
  pendingDonations: number;
  completedDonations: number;
  totalMedicines: number;
  activeDonors: number;
  thisMonthDonations: number;
}

export default function NGODashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<NGODashboardStats>({
    totalDonations: 0,
    pendingDonations: 0,
    completedDonations: 0,
    totalMedicines: 0,
    activeDonors: 0,
    thisMonthDonations: 0,
  });
  const [recentDonations, setRecentDonations] = useState<Donation[]>([]);
  const [urgentDonations, setUrgentDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load donations for this NGO
      // Auto-register/Check NGO profile
      try {
        const ngoProfileRes = await fetch(`http://localhost:5000/api/ngos/${user?.id}`);
        if (ngoProfileRes.status === 404 && user) {
          // Create default profile for this user
          await fetch('http://localhost:5000/api/ngos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: user.id,
              name: user.name,
              email: user.email,
              phone: user.phone || '+91-0000000000',
              address: user.address || 'Delhi, India',
              verified: true,
              location: { lat: 28.7041, lng: 77.1025 },
              createdAt: new Date()
            })
          });
          toast.success("NGO Profile Created Successfully");
        }
      } catch (e) {
        console.error("Error checking NGO profile", e);
      }

      // const donations = await db.donations.where('ngoId').equals(user?.id || '').toArray();
      const donationsRes = await fetch(`http://localhost:5000/api/donations/ngo/${user?.id}`);
      let donations: Donation[] = [];
      if (donationsRes.ok) {
        const data = await donationsRes.json();
        donations = data.map((d: any) => ({
          ...d,
          createdAt: new Date(d.createdAt),
          updatedAt: new Date(d.updatedAt),
          medicines: d.medicines.map((m: any) => ({ ...m, expiryDate: new Date(m.expiryDate) }))
        }));
      }

      // Calculate stats
      const totalDonations = donations.length;
      const pendingDonations = donations.filter((d: Donation) => d.status === 'pending').length;
      const completedDonations = donations.filter((d: Donation) => d.status === 'completed').length;

      // Calculate total medicines across all donations
      const totalMedicines = donations.reduce((sum: number, d: Donation) => sum + d.medicines.length, 0);

      // Active donors (users who donated in last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const activeDonors = new Set(
        donations
          .filter((d: Donation) => d.createdAt > thirtyDaysAgo)
          .map((d: Donation) => d.userId)
      ).size;

      // This month's donations
      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);
      const thisMonthDonations = donations.filter((d: Donation) => d.createdAt >= thisMonth).length;

      setStats({
        totalDonations,
        pendingDonations,
        completedDonations,
        totalMedicines,
        activeDonors,
        thisMonthDonations,
      });

      // Get recent donations (last 5)
      setRecentDonations(donations.sort((a: Donation, b: Donation) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 5));

      // Get urgent donations (pending for more than 3 days)
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      const urgent = donations.filter((d: Donation) =>
        d.status === 'pending' && d.createdAt < threeDaysAgo
      ).slice(0, 5);
      setUrgentDonations(urgent);

    } catch (error) {
      console.error('Error loading NGO dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleDonationStatusUpdate = async (donationId: string, newStatus: string) => {
    try {
      await db.donations.update(donationId, {
        status: newStatus as any,
        updatedAt: new Date()
      });
      toast.success('Donation status updated');
      loadDashboardData();
    } catch (error) {
      toast.error('Failed to update donation status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900';
      case 'confirmed': return 'text-blue-600 bg-blue-100 dark:bg-blue-900';
      case 'picked-up': return 'text-purple-600 bg-purple-100 dark:bg-purple-900';
      case 'completed': return 'text-green-600 bg-green-100 dark:bg-green-900';
      case 'cancelled': return 'text-red-600 bg-red-100 dark:bg-red-900';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'confirmed': return <CheckCircle className="w-4 h-4" />;
      case 'picked-up': return <Package className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            NGO Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage donation requests and track your impact
          </p>
        </div>
        <div className="flex space-x-3">
          <button onClick={loadDashboardData} className="btn btn-secondary">
            <RefreshCw size={18} />
            <span>Refresh</span>
          </button>
          <button className="btn btn-primary">
            <Download size={18} />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* NGO Info Card */}
      <div className="card bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <Heart className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {user?.name || 'NGO Organization'}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Making healthcare accessible to all
              </p>
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-1">
                  <MapPin size={14} />
                  <span>Delhi, India</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Phone size={14} />
                  <span>+91 98765 43210</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Mail size={14} />
                  <span>contact@ngo.org</span>
                </div>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500 dark:text-gray-400">Verified NGO</div>
            <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
              <CheckCircle size={16} />
              <span className="font-medium">Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Donations */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Donations</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.totalDonations}
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                +{stats.thisMonthDonations} this month
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <Heart className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        {/* Pending Donations */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Pending Requests</p>
              <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">
                {stats.pendingDonations}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Awaiting confirmation
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>

        {/* Completed Donations */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Completed</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">
                {stats.completedDonations}
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                Successfully delivered
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        {/* Total Medicines */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Medicines Received</p>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                {stats.totalMedicines}
              </p>
              <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                Across all donations
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Active Donors</p>
              <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                {stats.activeDonors}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Donated in last 30 days
              </p>
            </div>
            <Users className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Success Rate</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                {stats.totalDonations > 0 ? Math.round((stats.completedDonations / stats.totalDonations) * 100) : 0}%
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Completion rate
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
        </div>
      </div>

      {/* Urgent Alerts */}
      {urgentDonations.length > 0 && (
        <div className="card border-l-4 border-red-500 bg-red-50 dark:bg-red-900/20">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <div>
              <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">
                Urgent Donation Requests
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300">
                {urgentDonations.length} donation(s) pending for more than 3 days
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Donations */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Recent Donation Requests
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
                    <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
                      <Heart className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {donation.medicines.length} medicine(s)
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(donation.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(donation.status)}`}>
                      {getStatusIcon(donation.status)}
                      <span className="capitalize">{donation.status}</span>
                    </span>
                    <button
                      onClick={() => handleDonationStatusUpdate(donation.id, 'confirmed')}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                      title="Confirm"
                    >
                      <CheckCircle size={16} className="text-green-600" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                No donation requests yet
              </p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Quick Actions
            </h2>
          </div>

          <div className="space-y-3">
            <button className="w-full btn btn-primary">
              <Eye size={18} />
              <span>View All Donation Requests</span>
            </button>
            <button className="w-full btn btn-secondary">
              <MessageCircle size={18} />
              <span>Contact Donors</span>
            </button>
            <button className="w-full btn btn-secondary">
              <BarChart3 size={18} />
              <span>View Analytics</span>
            </button>
            <button className="w-full btn btn-secondary">
              <Download size={18} />
              <span>Export Reports</span>
            </button>
          </div>

          {/* NGO Profile */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Organization Profile
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <MapPin size={14} className="text-gray-500" />
                <span className="text-gray-600 dark:text-gray-400">Delhi, India</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone size={14} className="text-gray-500" />
                <span className="text-gray-600 dark:text-gray-400">+91 98765 43210</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail size={14} className="text-gray-500" />
                <span className="text-gray-600 dark:text-gray-400">contact@ngo.org</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar size={14} className="text-gray-500" />
                <span className="text-gray-600 dark:text-gray-400">Est. 2020</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Impact Summary */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Impact Summary
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <Heart className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.totalDonations}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Lives Impacted
            </p>
          </div>
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <Package className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.totalMedicines}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Medicines Distributed
            </p>
          </div>
          <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <Users className="w-8 h-8 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.activeDonors}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Active Donors
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
